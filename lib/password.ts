import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

/**
 * パスワードハッシュ化。Node 標準の scrypt（メモリハード KDF）を用い、
 * 外部依存ゼロで安全なハッシュ化を実現する。
 *
 * 保存形式: `scrypt$<saltHex>$<hashHex>`
 * - ソルトはアカウントごとにランダム生成（16 バイト）。
 * - 検証は timingSafeEqual で行い、タイミング攻撃を防ぐ。
 * - 形式にアルゴリズム名を含めることで、将来の方式移行も後方互換に行える。
 */

const scrypt = promisify(scryptCallback);

const SCHEME = "scrypt";
const SALT_BYTES = 16;
const KEY_BYTES = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = (await scrypt(password, salt, KEY_BYTES)) as Buffer;
  return `${SCHEME}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== SCHEME) return false;

  const [, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length === 0) return false;

  const derived = (await scrypt(password, salt, expected.length)) as Buffer;

  // 長さが一致しないと timingSafeEqual が例外を投げるため事前に確認する。
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
