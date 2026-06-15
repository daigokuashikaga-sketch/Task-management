import { describe, expect, it } from "vitest";
import { formatTags, parseTags } from "../tags";

describe("parseTags", () => {
  it("カンマ区切りを配列に変換し前後の空白を除去する", () => {
    expect(parseTags(" 仕事 , 重要 ")).toEqual(["仕事", "重要"]);
  });

  it("空要素を除外する", () => {
    expect(parseTags("a,,b,")).toEqual(["a", "b"]);
  });

  it("重複を除外する（順序は維持）", () => {
    expect(parseTags("a, b, a")).toEqual(["a", "b"]);
  });

  it("空文字は空配列になる", () => {
    expect(parseTags("   ")).toEqual([]);
  });
});

describe("formatTags", () => {
  it("配列をカンマ区切り文字列に戻す", () => {
    expect(formatTags(["a", "b"])).toBe("a, b");
  });
});
