import type Database from "better-sqlite3";
import type { Role, UserRecord } from "../types/domain.js";

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: Role;
  session_version: number;
  created_at: string;
  updated_at: string;
}

interface UserWithPasswordRow extends UserRow {
  password_hash: string;
}

const mapUser = (row: UserRow): UserRecord => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  sessionVersion: row.session_version,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const createUserRepository = (db: Database.Database) => ({
  countUsers() {
    return (db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number }).count;
  },

  createUser(input: { name: string; email: string; passwordHash: string; role: Role }) {
    const statement = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (@name, @email, @passwordHash, @role)
    `);
    const result = statement.run(input);
    return this.findById(Number(result.lastInsertRowid));
  },

  findByEmailWithPassword(email: string) {
    const row = db
      .prepare(
        `SELECT id, name, email, role, session_version, created_at, updated_at, password_hash
         FROM users
         WHERE email = ?`
      )
      .get(email) as UserWithPasswordRow | undefined;

    if (!row) {
      return null;
    }

    return {
      user: mapUser(row),
      passwordHash: row.password_hash
    };
  },

  findById(id: number) {
    const row = db
      .prepare(
        `SELECT id, name, email, role, session_version, created_at, updated_at
         FROM users
         WHERE id = ?`
      )
      .get(id) as UserRow | undefined;

    return row ? mapUser(row) : null;
  },

  searchUsers(query: string, limit: number) {
    const searchTerm = `%${query.toLowerCase()}%`;
    const rows = db
      .prepare(
        `SELECT id, name, email, role, session_version, created_at, updated_at
         FROM users
         WHERE lower(name) LIKE @searchTerm OR lower(email) LIKE @searchTerm
         ORDER BY name ASC, email ASC
         LIMIT @limit`
      )
      .all({ searchTerm, limit }) as UserRow[];

    return rows.map(mapUser);
  },

  incrementSessionVersion(userId: number) {
    db.prepare(
      `UPDATE users
       SET session_version = session_version + 1,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`
    ).run(userId);

    return this.findById(userId);
  }
});
