import type { Table } from "@/types";

export const A4_PAGE_WIDTH_MM = 210;
export const A4_PAGE_HEIGHT_MM = 297;
export const QR_PDF_COLUMNS = 3;
export const QR_PDF_ROWS_PER_PAGE = 4;
export const QR_CODES_PER_PAGE = QR_PDF_COLUMNS * QR_PDF_ROWS_PER_PAGE;
export const QR_SIZE_MM = 42;
export const QR_GRID_X_MM = [16, 78, 140] as const;
export const QR_GRID_Y_MM = [30, 92, 154, 216] as const;
export const QR_LABEL_OFFSET_MM = 48;

type TableQrPdfTable = Pick<Table, "number" | "label">;

export type TableQrPdfSlot<T extends TableQrPdfTable> = {
  table: T;
  pageIndex: number;
  rowIndex: number;
  columnIndex: number;
  x: number;
  y: number;
  labelY: number;
};

const naturalTableCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base"
});

export function sortTablesForQrPdf<T extends TableQrPdfTable>(tables: readonly T[]): T[] {
  return tables
    .map((table, index) => ({ table, index }))
    .sort((left, right) => {
      const numberComparison = naturalTableCollator.compare(left.table.number, right.table.number);
      if (numberComparison !== 0) return numberComparison;

      const labelComparison = naturalTableCollator.compare(left.table.label, right.table.label);
      if (labelComparison !== 0) return labelComparison;

      return left.index - right.index;
    })
    .map(({ table }) => table);
}

export function buildTableQrPdfLayout<T extends TableQrPdfTable>(tables: readonly T[]) {
  const sortedTables = sortTablesForQrPdf(tables);
  const slots: Array<TableQrPdfSlot<T>> = sortedTables.map((table, index) => {
    const pageIndex = Math.floor(index / QR_CODES_PER_PAGE);
    const indexOnPage = index % QR_CODES_PER_PAGE;
    const rowIndex = Math.floor(indexOnPage / QR_PDF_COLUMNS);
    const columnIndex = indexOnPage % QR_PDF_COLUMNS;
    const y = QR_GRID_Y_MM[rowIndex];

    return {
      table,
      pageIndex,
      rowIndex,
      columnIndex,
      x: QR_GRID_X_MM[columnIndex],
      y,
      labelY: y + QR_LABEL_OFFSET_MM
    };
  });

  return {
    pageCount: Math.ceil(sortedTables.length / QR_CODES_PER_PAGE),
    sortedTables,
    slots
  };
}
