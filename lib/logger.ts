/**
 * 依存ゼロの構造化ロガー。
 * 本番では 1 行 JSON（ログ収集基盤が解析しやすい）、開発では人間可読の整形出力。
 * レベルは LOG_LEVEL で制御（既定: 本番 info / それ以外 debug）。
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

type Fields = Record<string, unknown>;

const isProd = process.env.NODE_ENV === "production";
const minLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel | undefined) ?? (isProd ? "info" : "debug");

function emit(level: LogLevel, msg: string, base: Fields, extra?: Fields): void {
  if (LEVELS[level] < LEVELS[minLevel]) return;

  const record: Fields = {
    level,
    time: new Date().toISOString(),
    msg,
    ...base,
    ...extra,
  };

  const sink = level === "warn" || level === "error" ? console.error : console.log;

  if (isProd) {
    sink(JSON.stringify(record));
    return;
  }

  const { level: _l, time: _t, msg: _m, ...rest } = record;
  const detail = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
  sink(`${record.time} ${level.toUpperCase()} ${msg}${detail}`);
}

export interface Logger {
  debug(msg: string, fields?: Fields): void;
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields): void;
  /** 共通フィールド（requestId など）を束ねた子ロガーを返す。 */
  child(bindings: Fields): Logger;
}

function make(base: Fields): Logger {
  return {
    debug: (msg, fields) => emit("debug", msg, base, fields),
    info: (msg, fields) => emit("info", msg, base, fields),
    warn: (msg, fields) => emit("warn", msg, base, fields),
    error: (msg, fields) => emit("error", msg, base, fields),
    child: (bindings) => make({ ...base, ...bindings }),
  };
}

export const logger = make({});
