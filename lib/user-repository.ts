/**
 * ユーザー集約の型と永続化抽象。
 * Task と同じく、アプリ本体は具体的なストレージではなくこの抽象に依存する。
 */

export interface User {
  id: string;
  /** ログイン識別子。小文字に正規化して保存する。 */
  email: string;
  /** 表示名。未設定可。 */
  name: string | null;
  /** `scrypt$salt$hash` 形式のパスワードハッシュ。平文は決して保存しない。 */
  passwordHash: string;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  name?: string | null;
  passwordHash: string;
}

/** API 応答やセッションで扱う、機密を含まない公開ビュー。 */
export type PublicUser = Pick<User, "id" | "email" | "name">;

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name };
}

/** メールアドレスの正規化（大文字小文字・前後空白を無視して一意に扱う）。 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** メール重複登録時に投げる例外（API では 409 へ変換）。 */
export class DuplicateEmailError extends Error {
  constructor(message = "このメールアドレスは既に登録されています") {
    super(message);
    this.name = "DuplicateEmailError";
  }
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  /** メールが既に存在する場合は DuplicateEmailError を投げる。 */
  create(input: CreateUserInput): Promise<User>;
}
