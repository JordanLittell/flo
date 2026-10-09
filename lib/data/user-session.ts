import { sql, type Db } from "@/lib/db";
import { Session, type SessionRow } from "./session";

export type UserSessionStatus = "started" | "completed";

interface UserSessionRow {
  user_id: string;
  session_id: string;
  status: UserSessionStatus;
  started_at: Date;
  completed_at: Date | null;
}

export interface UserSessionData {
  userId: string;
  sessionId: string;
  status: UserSessionStatus;
  startedAt: Date;
  completedAt: Date | null;
}

/** A user's progress through one session: the latest time they started it and whether they finished. */
export class UserSession implements UserSessionData {
  readonly userId!: string;
  readonly sessionId!: string;
  readonly status!: UserSessionStatus;
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
      startedAt: row.started_at,
      completedAt: row.completed_at,
    });
  }

  /** Records a start. Starting a session again resets it to "started". */
  static async start(userId: string, sessionId: string, db: Db = sql): Promise<UserSession> {
    const [row] = await db<UserSessionRow[]>`
      insert into user_sessions (user_id, session_id)
      values (${userId}, ${sessionId})
      on conflict (user_id, session_id) do update
        set status = 'started', started_at = now(), completed_at = null
      returning *
    `;
    return UserSession.fromRow(row);
  }

  /** Marks a started session completed. Null if the user never started it. */
  static async complete(userId: string, sessionId: string, db: Db = sql): Promise<UserSession | null> {
    const [row] = await db<UserSessionRow[]>`
      update user_sessions
      set status = 'completed', completed_at = now()
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
      select s.*, us.user_id, us.session_id, us.status, us.started_at, us.completed_at
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
