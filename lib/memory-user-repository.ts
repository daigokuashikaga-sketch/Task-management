import { randomUUID } from "node:crypto";
import {
  DuplicateEmailError,
  normalizeEmail,
  type CreateUserInput,
  type User,
  type UserRepository,
} from "./user-repository";

/** インメモリのユーザー実装。テストおよびサーバーレスのデモ用。 */
export class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();

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
    return user;
  }
}
