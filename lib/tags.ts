/**
 * カンマ区切りのタグ入力を正規化した配列に変換する。
 * - 前後の空白を除去
 * - 空文字を除外
 * - 重複を除外（順序は維持）
 */
export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of input.split(",")) {
    const tag = raw.trim();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    result.push(tag);
  }
  return result;
}

/** タグ配列を編集用の入力文字列へ戻す。 */
export function formatTags(tags: string[]): string {
  return tags.join(", ");
}
