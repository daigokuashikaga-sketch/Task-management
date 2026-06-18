import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logger", () => {
  it("info は console.log に出力する", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("hello", { a: 1 });
    expect(spy).toHaveBeenCalledOnce();
    expect(String(spy.mock.calls[0]![0])).toContain("hello");
  });

  it("error/warn は console.error に出力する", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("boom");
    logger.warn("careful");
    expect(errSpy).toHaveBeenCalledTimes(2);
  });

  it("child のバインド値が出力に含まれる", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.child({ requestId: "req-123" }).info("scoped");
    expect(String(spy.mock.calls[0]![0])).toContain("req-123");
  });
});
