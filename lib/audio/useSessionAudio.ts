"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AudioStatus = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

/** Seconds the two music copies overlap at the loop point (shortened for very short loops). */
const LOOP_CROSSFADE = 4;
/** Seconds the music takes to fade out after the voice ends. */
const END_FADE = 3;
/** Music sits under the voice. */
const MUSIC_LEVEL = 0.35;
/** Reload attempts for a failing music file before the class continues voice-only. */
const MUSIC_RETRIES = 3;

interface Track {
  element: HTMLAudioElement;
  gain: GainNode;
}

interface Callbacks {
  onTick: (seconds: number) => void;
  onPlaying: () => void;
  onBuffering: (buffering: boolean) => void;
  /** Playback stopped without the user asking (blocked by the browser, or the OS took the audio). */
  onInterrupted: () => void;
  onEnded: () => void;
  onError: (message: string) => void;
}

function mediaError(element: HTMLAudioElement): string {
  const codes: Record<number, string> = { 1: "aborted", 2: "network error", 3: "decode error", 4: "unsupported source" };
  return element.error ? (codes[element.error.code] ?? `error ${element.error.code}`) : "unknown error";
}

/**
 * Plays the voice once and loops the music underneath it. Both are streamed <audio> elements routed
 * through Web Audio: gains give volume control on iOS (which ignores element.volume) and let the music
 * loop crossfade between two copies so the loop point is never heard.
 *
 * Loop timing is driven by media events (timeupdate / ended), not requestAnimationFrame, because
 * animation frames stop when the tab is hidden or the screen is off, which is how a class is usually played.
 */
class SessionAudioEngine {
  private context = new AudioContext();
  private voice: Track;
  private music: Track[] = [];
  private musicBus: GainNode;
  private active = 0;
  private crossfade: { from: number; timer: number } | null = null;
  private musicFailures = 0;
  private frame = 0;
  private timers = new Set<number>();
  private playing = false;
  private ended = false;
  private destroyed = false;

  constructor(voiceUrl: string, musicUrl: string | undefined, private callbacks: Callbacks) {
    this.musicBus = this.context.createGain();
    this.musicBus.gain.value = MUSIC_LEVEL;
    this.musicBus.connect(this.context.destination);

    this.voice = this.track(voiceUrl, this.context.destination);
    const voice = this.voice.element;
    voice.addEventListener("playing", () => {
      callbacks.onBuffering(false);
      callbacks.onPlaying();
    });
    voice.addEventListener("waiting", () => callbacks.onBuffering(true));
    voice.addEventListener("ended", () => this.finish());
    voice.addEventListener("error", () => {
      this.halt();
      callbacks.onError(`Voice track failed (${mediaError(voice)}).`);
    });

    if (musicUrl) {
      this.music = [this.track(musicUrl, this.musicBus), this.track(musicUrl, this.musicBus)];
      this.music[1].gain.gain.value = 0;
      this.music.forEach((track, index) => this.watchMusic(track, index));
    }

    // The OS can suspend audio (a phone call, another app). Treat it as a pause the user can resume.
    this.context.addEventListener("statechange", () => {
      if (this.playing && this.context.state !== "running" && this.context.state !== "closed") {
        this.halt();
        callbacks.onInterrupted();
      }
    });
  }

  private track(url: string, destination: AudioNode): Track {
    const element = new Audio();
    element.crossOrigin = "anonymous";
    element.preload = "auto";
    element.src = url;
    const gain = this.context.createGain();
    this.context.createMediaElementSource(element).connect(gain).connect(destination);
    return { element, gain };
  }

  private watchMusic(track: Track, index: number) {
    const { element } = track;
    element.addEventListener("timeupdate", () => {
      if (index !== this.active || this.crossfade || !this.playing || this.ended) return;
      const fade = this.fadeLength(element);
      if (fade && element.duration - element.currentTime <= fade) this.startCrossfade(fade);
    });
    element.addEventListener("ended", () => {
      if (this.crossfade?.from === index) {
        this.settleCrossfade();
      } else if (index === this.active && this.playing && !this.ended) {
        // The crossfade was missed (e.g. timeupdate came too late): restart the loop immediately.
        console.warn("[audio] music loop restarted without crossfade");
        this.restartLoop();
      }
    });
    element.addEventListener("error", () => {
      console.warn(`[audio] music copy ${index} failed: ${mediaError(element)}`);
      this.recoverMusic(track, index);
    });
  }

  private fadeLength(element: HTMLAudioElement): number {
    if (!Number.isFinite(element.duration) || element.duration <= 0) return 0;
    return Math.min(LOOP_CROSSFADE, element.duration / 3);
  }

  /** Plays an element, handling rejection instead of dropping it. */
  private play(element: HTMLAudioElement, label: string) {
    return element.play().catch((error: unknown) => {
      if (this.destroyed || (error instanceof DOMException && error.name === "AbortError")) return;
      console.warn(`[audio] ${label} could not play:`, error);
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        // Autoplay blocked: pause everything so the next tap on Resume (a user gesture) restarts it.
        this.halt();
        this.callbacks.onInterrupted();
      } else if (label === "voice") {
        this.halt();
        this.callbacks.onError("Voice track could not play.");
      }
    });
  }

  /** Must run inside a user gesture (autoplay policy). `from` resumes the voice at a position, e.g. after an error. */
  async start(from = 0) {
    await this.context.resume();
    this.voice.element.currentTime = from;
    this.playing = true;
    await Promise.all([this.play(this.voice.element, "voice"), this.music[this.active] && this.play(this.music[this.active].element, "music")]);
    this.tick();
  }

  pause() {
    this.halt();
  }

  async resume() {
    await this.context.resume();
    this.playing = true;
    await Promise.all([this.play(this.voice.element, "voice"), this.music[this.active] && this.play(this.music[this.active].element, "music")]);
    this.tick();
  }

  get position() {
    return this.voice.element.currentTime;
  }

  destroy() {
    this.destroyed = true;
    this.playing = false;
    cancelAnimationFrame(this.frame);
    this.timers.forEach((timer) => clearTimeout(timer));
    for (const { element } of [this.voice, ...this.music]) {
      element.pause();
      element.removeAttribute("src");
      element.load();
    }
    void this.context.close();
  }

  /** Stops every element in place (pause, interruption, failure). */
  private halt() {
    this.playing = false;
    this.settleCrossfade();
    cancelAnimationFrame(this.frame);
    this.voice.element.pause();
    this.music.forEach(({ element }) => element.pause());
  }

  private later(fn: () => void, seconds: number) {
    const timer = window.setTimeout(() => {
      this.timers.delete(timer);
      fn();
    }, seconds * 1000);
    this.timers.add(timer);
    return timer;
  }

  /** Screen updates only; nothing that keeps audio going depends on animation frames. */
  private tick = () => {
    this.callbacks.onTick(this.voice.element.currentTime);
    this.frame = requestAnimationFrame(this.tick);
  };

  private startCrossfade(fade: number) {
    const from = this.active;
    const to = 1 - from;
    const now = this.context.currentTime;
    const incoming = this.music[to];
    incoming.element.currentTime = 0;
    incoming.gain.gain.cancelScheduledValues(now);
    incoming.gain.gain.setValueAtTime(0, now);
    incoming.gain.gain.linearRampToValueAtTime(1, now + fade);
    const outgoing = this.music[from].gain.gain;
    outgoing.cancelScheduledValues(now);
    outgoing.setValueAtTime(outgoing.value, now);
    outgoing.linearRampToValueAtTime(0, now + fade);
    void this.play(incoming.element, "music");
    this.active = to;
    // The outgoing copy's `ended` event settles the crossfade; the timer is a fallback.
    this.crossfade = { from, timer: this.later(() => this.settleCrossfade(), fade + 0.5) };
  }

  /** Ends a crossfade now: the active copy at full level, the other stopped and rewound. */
  private settleCrossfade() {
    if (!this.crossfade) return;
    const { from, timer } = this.crossfade;
    clearTimeout(timer);
    this.timers.delete(timer);
    this.crossfade = null;
    this.setLevels();
    this.music[from].element.pause();
    this.music[from].element.currentTime = 0;
  }

  private setLevels() {
    const now = this.context.currentTime;
    this.music.forEach((track, index) => {
      track.gain.gain.cancelScheduledValues(now);
      track.gain.gain.setValueAtTime(index === this.active ? 1 : 0, now);
    });
  }

  /** Hard restart of the loop on the other copy, used when a crossfade was missed. */
  private restartLoop() {
    const from = this.active;
    this.active = 1 - from;
    this.setLevels();
    this.music[from].element.currentTime = 0;
    this.music[this.active].element.currentTime = 0;
    void this.play(this.music[this.active].element, "music");
  }

  /** Reloads a failed music copy a few times; after that the class carries on with the voice only. */
  private recoverMusic(track: Track, index: number) {
    this.musicFailures += 1;
    if (this.musicFailures > MUSIC_RETRIES) {
      console.warn("[audio] music unavailable; continuing with the voice only");
      this.music.forEach(({ element }) => element.pause());
      this.music = [];
      return;
    }
    const position = Number.isFinite(track.element.currentTime) ? track.element.currentTime : 0;
    track.element.load();
    track.element.currentTime = position;
    if (index === this.active && this.playing && !this.ended) void this.play(track.element, "music");
  }

  private finish() {
    if (this.ended) return;
    this.ended = true;
    this.playing = false;
    cancelAnimationFrame(this.frame);
    this.callbacks.onTick(this.voice.element.duration);
    const now = this.context.currentTime;
    this.musicBus.gain.cancelScheduledValues(now);
    this.musicBus.gain.setValueAtTime(this.musicBus.gain.value, now);
    this.musicBus.gain.linearRampToValueAtTime(0, now + END_FADE);
    this.later(() => {
      this.music.forEach(({ element }) => element.pause());
      this.callbacks.onEnded();
    }, END_FADE);
  }
}

export function useSessionAudio({ voiceUrl, musicUrl }: { voiceUrl: string; musicUrl?: string }) {
  const [status, setStatus] = useState<AudioStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const engine = useRef<SessionAudioEngine | null>(null);
  const resumeAt = useRef(0);

  const stop = useCallback(() => {
    engine.current?.destroy();
    engine.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    // After a failure, pick up where the voice stopped instead of starting over.
    const from = engine.current?.position ?? resumeAt.current;
    stop();
    setStatus("loading");
    setError(null);
    setElapsed(from);
    const created = new SessionAudioEngine(voiceUrl, musicUrl, {
      // Update at most every tenth of a second; the screen shows whole seconds.
      onTick: (seconds) => {
        resumeAt.current = seconds;
        setElapsed((previous) => (Math.abs(seconds - previous) >= 0.1 ? seconds : previous));
      },
      onPlaying: () => setStatus((current) => (current === "loading" ? "playing" : current)),
      onBuffering: setBuffering,
      onInterrupted: () => setStatus("paused"),
      onEnded: () => setStatus("ended"),
      onError: (message) => {
        console.error(`[audio] ${message}`);
        setError(message);
        setStatus("error");
      },
    });
    engine.current = created;
    try {
      await created.start(from);
    } catch (cause) {
      console.error("[audio] could not start", cause);
      setError("Audio could not start.");
      setStatus("error");
    }
  }, [voiceUrl, musicUrl, stop]);

  const pause = useCallback(() => {
    engine.current?.pause();
    setStatus("paused");
  }, []);

  const resume = useCallback(async () => {
    setStatus("playing");
    try {
      await engine.current?.resume();
    } catch (cause) {
      console.error("[audio] could not resume", cause);
      setError("Audio could not resume.");
      setStatus("error");
    }
  }, []);

  return { status, elapsed, buffering, error, start, pause, resume, stop };
}
