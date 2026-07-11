export type TableValidationClient = {
  from: (table: "tables") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: boolean) => {
          maybeSingle: () => PromiseLike<{
            data: { table_number?: string; is_active?: boolean; status?: string } | null;
            error: unknown;
          }>;
        };
      };
    };
  };
};

const unavailableTableMessage = "Scan your table QR code to place an order.";

export async function validateActiveTable(
  client: TableValidationClient,
  submittedTableNumber: string | null | undefined
) {
  const tableNumber = submittedTableNumber?.trim() ?? "";
  if (!tableNumber) throw new Error(unavailableTableMessage);

  const { data, error } = await client
    .from("tables")
    .select("table_number, is_active, status")
    .eq("table_number", tableNumber)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!data?.table_number || !data.is_active) throw new Error(unavailableTableMessage);

  return data.table_number.trim();
}
