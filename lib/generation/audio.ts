/** All voice audio is handled as 16-bit little-endian mono PCM at this rate (ElevenLabs `pcm_24000`). */
export const SAMPLE_RATE = 24000;
export const PCM_FORMAT = "pcm_24000" as const;
const BYTES_PER_SAMPLE = 2;
const MP3_KBPS = 64;

// encodes silence as a buffer of zeros of the given duration in seconds
// @param seconds - the duration of the silence in seconds
export function silence(seconds: number): Buffer {
  return Buffer.alloc(Math.round(seconds * SAMPLE_RATE) * BYTES_PER_SAMPLE);
}

// calculates the duration of a pcm buffer in seconds
// @param pcm - the pcm buffer
// @returns the duration of the pcm buffer in seconds
export function pcmDuration(pcm: Buffer): number {
  return pcm.length / BYTES_PER_SAMPLE / SAMPLE_RATE;
}

// converts a pcm buffer to an mp3 buffer
// @param pcm - the pcm buffer
// @returns the mp3 buffer
export async function pcmToMp3(pcm: Buffer): Promise<Buffer> {
  // Dynamic import on purpose: when loaded via require (tsx runs scripts as CommonJS), the package
  // resolves to a browser IIFE build that exports nothing. import() always gets the ES module build.
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / BYTES_PER_SAMPLE));
  const encoder = new Mp3Encoder(1, SAMPLE_RATE, MP3_KBPS);
  const frameSize = 1152;
  const chunks: Buffer[] = [];
  // lamejs returns Int8Array at runtime despite its Uint8Array typings, so copy the raw bytes.
  const keep = (out: ArrayBufferView) => {
    if (out.byteLength) chunks.push(Buffer.from(new Uint8Array(out.buffer, out.byteOffset, out.byteLength)));
  };
  for (let i = 0; i < samples.length; i += frameSize) {
    keep(encoder.encodeBuffer(samples.subarray(i, i + frameSize)));
  }
  keep(encoder.flush());
  return Buffer.concat(chunks);
}
