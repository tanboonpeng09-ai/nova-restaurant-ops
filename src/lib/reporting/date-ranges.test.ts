import { describe, expect, it } from "vitest";
import {
  assertReportRange,
  getReportBounds,
  isWithinReportBounds
} from "@/lib/reporting/date-ranges";

const newYork = "America/New_York";
const julyNow = new Date("2026-07-11T16:00:00.000Z");

describe("getReportBounds", () => {
  it("builds Today from restaurant-local midnight using a half-open interval", () => {
    const bounds = getReportBounds("today", newYork, julyNow);

    expect(bounds.utcStart).toBe("2026-07-11T04:00:00.000Z");
    expect(bounds.utcEnd).toBe("2026-07-12T04:00:00.000Z");
    expect(bounds.localStartDate).toBe("2026-07-11");
    expect(bounds.localEndDateInclusive).toBe("2026-07-11");
    expect(isWithinReportBounds(bounds.utcStart, bounds)).toBe(true);
    expect(isWithinReportBounds(bounds.utcEnd, bounds)).toBe(false);
  });

  it("builds Yesterday from the previous local calendar day", () => {
    const bounds = getReportBounds("yesterday", newYork, julyNow);

    expect(bounds.utcStart).toBe("2026-07-10T04:00:00.000Z");
    expect(bounds.utcEnd).toBe("2026-07-11T04:00:00.000Z");
  });

  it("builds a Monday-based This Week range", () => {
    const bounds = getReportBounds("this_week", newYork, julyNow);

    expect(bounds.utcStart).toBe("2026-07-06T04:00:00.000Z");
    expect(bounds.utcEnd).toBe("2026-07-13T04:00:00.000Z");
    expect(bounds.localEndDateInclusive).toBe("2026-07-12");
  });

  it("builds This Month from local calendar month boundaries", () => {
    const bounds = getReportBounds("this_month", newYork, julyNow);

    expect(bounds.utcStart).toBe("2026-07-01T04:00:00.000Z");
    expect(bounds.utcEnd).toBe("2026-08-01T04:00:00.000Z");
    expect(bounds.localEndDateInclusive).toBe("2026-07-31");
  });

  it("uses the configured IANA timezone instead of the runtime timezone", () => {
    const newYorkBounds = getReportBounds("today", newYork, julyNow);
    const singaporeBounds = getReportBounds("today", "Asia/Singapore", julyNow);

    expect(newYorkBounds.localStartDate).toBe("2026-07-11");
    expect(singaporeBounds.localStartDate).toBe("2026-07-12");
    expect(singaporeBounds.utcStart).toBe("2026-07-11T16:00:00.000Z");
  });

  it("produces a 23-hour UTC interval across New York spring DST", () => {
    const bounds = getReportBounds("today", newYork, new Date("2026-03-08T12:00:00.000Z"));

    expect((Date.parse(bounds.utcEnd) - Date.parse(bounds.utcStart)) / 3_600_000).toBe(23);
  });

  it("produces a 25-hour UTC interval across New York fall DST", () => {
    const bounds = getReportBounds("today", newYork, new Date("2026-11-01T12:00:00.000Z"));

    expect((Date.parse(bounds.utcEnd) - Date.parse(bounds.utcStart)) / 3_600_000).toBe(25);
  });

  it("rejects unsupported client range values", () => {
    expect(() => assertReportRange("custom")).toThrow("Invalid reporting range");
  });
});
