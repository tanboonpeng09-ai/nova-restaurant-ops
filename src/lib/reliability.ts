import type { StaffRequestType } from "@/types";

export type FingerprintItem = {
  id: string;
  quantity: number;
  price: number;
};

export function buildCartFingerprint(items: FingerprintItem[]) {
  return items
    .map((item) => `${item.id}:${item.quantity}:${item.price.toFixed(2)}`)
    .sort()
    .join("|");
}

export function isDuplicateSubmission({
  previousKey,
  nextKey,
  previousTime,
  nextTime,
  cooldownMs
}: {
  previousKey: string | null;
  nextKey: string;
  previousTime: number;
  nextTime: number;
  cooldownMs: number;
}) {
  return previousKey === nextKey && nextTime - previousTime < cooldownMs;
}

export function generateOrderNumberCandidate(date: Date, attempt: number, entropy: number) {
  const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = String(attempt * 1000 + entropy).padStart(4, "0").slice(-4);
  return `ORD-${stamp}-${suffix}`;
}

export function shouldSuppressStaffRequest({
  existing,
  tableNumber,
  type
}: {
  existing: Array<{ tableNumber: string; type: StaffRequestType; status: "open" | "resolved" }>;
  tableNumber: string;
  type: StaffRequestType;
}) {
  return existing.some(
    (request) =>
      request.tableNumber === tableNumber && request.type === type && request.status === "open"
  );
}

export function mergeUniqueById<T extends { id: string }>(current: T[], incoming: T[]) {
  const incomingIds = new Set(incoming.map((item) => item.id));
  return [...incoming, ...current.filter((item) => !incomingIds.has(item.id))];
}
