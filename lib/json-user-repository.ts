import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  DuplicateEmailError,
  normalizeEmail,
  type CreateUserInput,
  type User,
  type UserRepository,
} from "./user-repository";

/**
 * JSON ファイルによるユーザー永続化（ローカル開発の既定）。
 * JsonFileTaskRepository と同じく、ネイティブ依存なしで動く。
 */
export class JsonFileUserRepository implements UserRepository {
  private users = new Map<string, User>();

  constructor(private readonly filename: string) {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    this.load();
  }

  private load(): void {
    if (!fs.existsSync(this.filename)) return;
    try {
      const raw = fs.readFileSync(this.filename, "utf-8").trim();
      if (!raw) return;
      const parsed = JSON.parse(raw) as User[];
      for (const user of parsed) {
        this.users.set(user.id, user);
      }
    } catch {
      // 壊れたファイルでも起動を止めない。
    }
  }

  private persist(): void {
    const data = JSON.stringify([...this.users.values()], null, 2);
    fs.writeFileSync(this.filename, data, "utf-8");
  }

  async findByEmail(email: string): Promise<User | null> {
    const target = normalizeEmail(email);
    for (const user of this.users.values()) {
      if (user.email === target) return user;
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const email = normalizeEmail(input.email);
    if (await this.findByEmail(email)) {
      throw new DuplicateEmailError();
    }
    const user: User = {
      id: randomUUID(),
      email,
      name: input.name ?? null,
      passwordHash: input.passwordHash,
      createdAt: new Date().toISOString(),
    };
    this.users.set(user.id, user);
    this.persist();
    return user;
  }
}
