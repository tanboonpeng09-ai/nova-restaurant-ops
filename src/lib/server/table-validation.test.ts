import { describe, expect, it, vi } from "vitest";
import { validateActiveTable } from "@/lib/server/table-validation";

function tableClient(row: { table_number: string; is_active: boolean; status: string } | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
  const eqActive = vi.fn(() => ({ maybeSingle }));
  const eqNumber = vi.fn(() => ({ eq: eqActive }));
  const select = vi.fn(() => ({ eq: eqNumber }));
  const from = vi.fn(() => ({ select }));
  return { client: { from }, from, eqNumber, eqActive };
}

describe("validateActiveTable", () => {
  it("accepts an active available table", async () => {
    const { client } = tableClient({ table_number: "1", is_active: true, status: "available" });
    await expect(validateActiveTable(client, " 1 ")).resolves.toBe("1");
  });

  it("accepts an active occupied table", async () => {
    const { client } = tableClient({ table_number: "2", is_active: true, status: "occupied" });
    await expect(validateActiveTable(client, "2")).resolves.toBe("2");
  });

  it.each([null, "", "   "])("rejects a missing table value", async (value) => {
    const { client, from } = tableClient(null);
    await expect(validateActiveTable(client, value)).rejects.toThrow("Scan your table QR code");
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a nonexistent table", async () => {
    const { client } = tableClient(null);
    await expect(validateActiveTable(client, "99")).rejects.toThrow("Scan your table QR code");
  });

  it("requires an active exact match in the query", async () => {
    const { client, eqNumber, eqActive } = tableClient(null);
    await expect(validateActiveTable(client, "3")).rejects.toThrow("Scan your table QR code");
    expect(eqNumber).toHaveBeenCalledWith("table_number", "3");
    expect(eqActive).toHaveBeenCalledWith("is_active", true);
  });
});
