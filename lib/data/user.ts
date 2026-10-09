import { sql, type Db } from "@/lib/db";
import { hashPassword, verifyPassword } from "./password";
import { UserSession } from "./user-session";

interface UserRow {
  id: string;
  email: string;
  email_verified_at: Date | null;
  password_hash: string | null;
  created_at: Date;
}

export interface UserData {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}

/** An account. The password hash stays in the database and is never put on the instance. */
export class User implements UserData {
  readonly id!: string;
  readonly email!: string;
  readonly emailVerifiedAt!: Date | null;
  readonly createdAt!: Date;

  private constructor(data: UserData) {
    Object.assign(this, data);
  }

  static fromRow(row: UserRow): User {
    return new User({
      id: row.id,
      email: row.email,
      emailVerifiedAt: row.email_verified_at,
      createdAt: row.created_at,
    });
  }

  static async findById(id: string, db: Db = sql): Promise<User | null> {
    const [row] = await db<UserRow[]>`select * from users where id = ${id}`;
    return row ? User.fromRow(row) : null;
  }

  static async findByEmail(email: string, db: Db = sql): Promise<User | null> {
    const [row] = await db<UserRow[]>`select * from users where email = ${normalize(email)}`;
    return row ? User.fromRow(row) : null;
  }

  /** Throws if the email is already registered (unique violation) or malformed. */
  static async create(input: { email: string; password: string }, db: Db = sql): Promise<User> {
    const [row] = await db<UserRow[]>`
      insert into users (email, password_hash)
      values (${normalize(input.email)}, ${await hashPassword(input.password)})
      returning *
    `;
    return User.fromRow(row);
  }

  /** The user if the password matches, for next-auth's Credentials provider. */
  static async verifyCredentials(email: string, password: string, db: Db = sql): Promise<User | null> {
    const [row] = await db<UserRow[]>`select * from users where email = ${normalize(email)}`;
    if (!row?.password_hash) {
      // Hash anyway so unknown emails take as long as wrong passwords.
      await hashPassword(password);
      return null;
    }
    return (await verifyPassword(password, row.password_hash)) ? User.fromRow(row) : null;
  }

  sessions(db: Db = sql) {
    return UserSession.listForUser(this.id, db);
  }

  toJSON(): UserData {
    return { ...this };
  }
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}
