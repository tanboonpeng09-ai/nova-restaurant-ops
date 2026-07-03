import { describe, expect, it } from "vitest";
import {
  buildCartFingerprint,
  generateOrderNumberCandidate,
  isDuplicateSubmission,
  mergeUniqueById,
  shouldSuppressStaffRequest
} from "./reliability";

describe("reliability helpers", () => {
  it("builds the same cart fingerprint regardless of cart item order", () => {
    const left = buildCartFingerprint([
      { id: "burger", quantity: 2, price: 26 },
      { id: "fries", quantity: 1, price: 15 }
    ]);
    const right = buildCartFingerprint([
      { id: "fries", quantity: 1, price: 15 },
      { id: "burger", quantity: 2, price: 26 }
    ]);

    expect(left).toBe(right);
  });

  it("detects duplicate submissions inside the cooldown window", () => {
    expect(
      isDuplicateSubmission({
        previousKey: "table-1:cart-a",
        nextKey: "table-1:cart-a",
        previousTime: 1_000,
        nextTime: 2_000,
        cooldownMs: 8_000
      })
    ).toBe(true);
  });

  it("allows a repeated submission after the cooldown window", () => {
    expect(
      isDuplicateSubmission({
        previousKey: "table-1:cart-a",
        nextKey: "table-1:cart-a",
        previousTime: 1_000,
        nextTime: 12_000,
        cooldownMs: 8_000
      })
    ).toBe(false);
  });

  it("generates stable date-prefixed order number candidates with attempt entropy", () => {
    expect(generateOrderNumberCandidate(new Date("2026-07-03T10:00:00Z"), 2, 42)).toBe(
      "ORD-20260703-2042"
    );
  });

  it("suppresses duplicate staff requests for the same table and type while one is open", () => {
    expect(
      shouldSuppressStaffRequest({
        existing: [
          { tableNumber: "4", type: "water", status: "open" },
          { tableNumber: "4", type: "bill", status: "resolved" }
        ],
        tableNumber: "4",
        type: "water"
      })
    ).toBe(true);
  });

  it("merges realtime rows by id without duplicates", () => {
    const merged = mergeUniqueById(
      [
        { id: "a", value: 1 },
        { id: "b", value: 2 }
      ],
      [
        { id: "b", value: 3 },
        { id: "c", value: 4 }
      ]
    );

    expect(merged).toEqual([
      { id: "b", value: 3 },
      { id: "c", value: 4 },
      { id: "a", value: 1 }
    ]);
  });
});
