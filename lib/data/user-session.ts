import { sql, type Db } from "@/lib/db";
import { Session, type SessionRow } from "./session";

export type UserSessionStatus = "started" | "completed";

interface UserSessionRow {
  user_id: string;
  session_id: string;
  status: UserSessionStatus;
  position: number;
  started_at: Date;
  completed_at: Date | null;
}

export interface UserSessionData {
  userId: string;
  sessionId: string;
  status: UserSessionStatus;
  /** Seconds into the voice track where the user stopped; resume starts here. */
  position: number;
  startedAt: Date;
  completedAt: Date | null;
}

/** A user's progress through one session: the latest time they started it and whether they finished. */
export class UserSession implements UserSessionData {
  readonly userId!: string;
  readonly sessionId!: string;
  readonly status!: UserSessionStatus;
  readonly position!: number;
  readonly startedAt!: Date;
  readonly completedAt!: Date | null;

  private constructor(data: UserSessionData) {
    Object.assign(this, data);
  }

  static fromRow(row: UserSessionRow): UserSession {
    return new UserSession({
      userId: row.user_id,
      sessionId: row.session_id,
      status: row.status,
      position: row.position,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    });
  }

  static async find(userId: string, sessionId: string, db: Db = sql): Promise<UserSession | null> {
    const [row] = await db<UserSessionRow[]>`
      select * from user_sessions where user_id = ${userId} and session_id = ${sessionId}
    `;
    return row ? UserSession.fromRow(row) : null;
  }

  /** Records a start. Starting a session again resets it to "started" at the beginning. */
  static async start(userId: string, sessionId: string, db: Db = sql): Promise<UserSession> {
    const [row] = await db<UserSessionRow[]>`
      insert into user_sessions (user_id, session_id)
      values (${userId}, ${sessionId})
      on conflict (user_id, session_id) do update
        set status = 'started', position = 0, started_at = now(), completed_at = null
      returning *
    `;
    return UserSession.fromRow(row);
  }

  /** Saves where the user is in a started session. Null if it isn't started (never begun, or completed). */
  static async saveProgress(
    userId: string,
    sessionId: string,
    position: number,
    db: Db = sql,
  ): Promise<UserSession | null> {
    const [row] = await db<UserSessionRow[]>`
      update user_sessions
      set position = ${position}
      where user_id = ${userId} and session_id = ${sessionId} and status = 'started'
      returning *
    `;
    return row ? UserSession.fromRow(row) : null;
  }

  /** Marks a started session completed. Null if the user never started it. */
  static async complete(userId: string, sessionId: string, db: Db = sql): Promise<UserSession | null> {
    const [row] = await db<UserSessionRow[]>`
      update user_sessions
      set status = 'completed', position = 0, completed_at = now()
      where user_id = ${userId} and session_id = ${sessionId}
      returning *
    `;
    return row ? UserSession.fromRow(row) : null;
  }

  /** The user's sessions, most recently started first. */
  static async listForUser(
    userId: string,
    db: Db = sql,
  ): Promise<{ session: Session; progress: UserSession }[]> {
    const rows = await db<(SessionRow & UserSessionRow)[]>`
      select s.*, us.user_id, us.session_id, us.status, us.position, us.started_at, us.completed_at
      from user_sessions us
      join sessions s on s.id = us.session_id
      where us.user_id = ${userId}
      order by us.started_at desc
    `;
    return rows.map((row) => ({ session: Session.fromRow(row), progress: UserSession.fromRow(row) }));
  }

  toJSON(): UserSessionData {
    return { ...this };
  }
}
