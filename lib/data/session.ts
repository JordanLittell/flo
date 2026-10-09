import type { Vibe } from "@/components/vibes";
import { sql, type Db } from "@/lib/db";
import { INSTRUCTORS, type Instructor, type Level } from "@/lib/instructors";

export interface SessionRow {
  id: string;
  slug: string;
  created_by: string | null;
  prompt: string;
  title: string;
  minutes: number;
  level: Level;
  vibe: Vibe;
  voice_id: string;
  audio_url: string | null;
  instructor_audio_url: string;
  transcript_url: string;
  manifest_url: string;
  duration: number;
  created_at: Date;
}

export interface SessionData {
  id: string;
  slug: string;
  createdBy: string | null;
  prompt: string;
  title: string;
  /** Requested length in minutes. */
  minutes: number;
  level: Level;
  vibe: Vibe;
  /** The instructor's ElevenLabs voice. */
  voiceId: string;
  /** The music loop. */
  audioUrl: string | null;
  instructorAudioUrl: string;
  transcriptUrl: string;
  manifestUrl: string;
  /** Length of the voice track in seconds. */
  duration: number;
  createdAt: Date;
}

export type NewSession = Omit<SessionData, "id" | "createdAt">;

/** A generated class: its settings and the Blob URLs of its media. */
export class Session implements SessionData {
  readonly id!: string;
  readonly slug!: string;
  readonly createdBy!: string | null;
  readonly prompt!: string;
  readonly title!: string;
  readonly minutes!: number;
  readonly level!: Level;
  readonly vibe!: Vibe;
  readonly voiceId!: string;
  readonly audioUrl!: string | null;
  readonly instructorAudioUrl!: string;
  readonly transcriptUrl!: string;
  readonly manifestUrl!: string;
  readonly duration!: number;
  readonly createdAt!: Date;

  private constructor(data: SessionData) {
    Object.assign(this, data);
  }

  static fromRow(row: SessionRow): Session {
    return new Session({
      id: row.id,
      slug: row.slug,
      createdBy: row.created_by,
      prompt: row.prompt,
      title: row.title,
      minutes: row.minutes,
      level: row.level,
      vibe: row.vibe,
      voiceId: row.voice_id,
      audioUrl: row.audio_url,
      instructorAudioUrl: row.instructor_audio_url,
      transcriptUrl: row.transcript_url,
      manifestUrl: row.manifest_url,
      duration: row.duration,
      createdAt: row.created_at,
    });
  }

  static async create(input: NewSession, db: Db = sql): Promise<Session> {
    const [row] = await db<SessionRow[]>`
      insert into sessions (
        slug, created_by, prompt, title, minutes, level, vibe, voice_id,
        audio_url, instructor_audio_url, transcript_url, manifest_url, duration
      ) values (
        ${input.slug}, ${input.createdBy}, ${input.prompt}, ${input.title}, ${input.minutes},
        ${input.level}, ${input.vibe}, ${input.voiceId}, ${input.audioUrl}, ${input.instructorAudioUrl},
        ${input.transcriptUrl}, ${input.manifestUrl}, ${input.duration}
      )
      returning *
    `;
    return Session.fromRow(row);
  }

  static async findById(id: string, db: Db = sql): Promise<Session | null> {
    const [row] = await db<SessionRow[]>`select * from sessions where id = ${id}`;
    return row ? Session.fromRow(row) : null;
  }

  static async findBySlug(slug: string, db: Db = sql): Promise<Session | null> {
    const [row] = await db<SessionRow[]>`select * from sessions where slug = ${slug}`;
    return row ? Session.fromRow(row) : null;
  }

  /** Every generated session, newest first, for the home screen. */
  static async listAll(db: Db = sql): Promise<Session[]> {
    const rows = await db<SessionRow[]>`select * from sessions order by created_at desc`;
    return rows.map(Session.fromRow);
  }

  get instructor(): Instructor | undefined {
    return INSTRUCTORS.find((instructor) => instructor.voiceId === this.voiceId);
  }

  /** Plain object for Client Components, which can't receive class instances. */
  toJSON(): SessionData {
    return { ...this };
  }
}
