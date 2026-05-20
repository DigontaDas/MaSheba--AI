import { createIdempotencyKey } from "@/utils/ids";

describe("createIdempotencyKey", () => {
  it("includes device id, timestamp, and uuid-like suffix", () => {
    const key = createIdempotencyKey("device-a");
    expect(key).toMatch(/^device-a:\d+:[0-9a-f-]{36}$/);
  });
});
