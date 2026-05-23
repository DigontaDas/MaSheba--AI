import { trimesterFromWeeks } from "@/db/offlineQa";

describe("trimesterFromWeeks", () => {
  it("maps gestational weeks to trimester filters", () => {
    expect(trimesterFromWeeks(8)).toBe("T1");
    expect(trimesterFromWeeks(20)).toBe("T2");
    expect(trimesterFromWeeks(32)).toBe("T3");
  });

  it("falls back to ALL for out-of-range values", () => {
    expect(trimesterFromWeeks(0)).toBe("ALL");
    expect(trimesterFromWeeks(50)).toBe("ALL");
  });
});
