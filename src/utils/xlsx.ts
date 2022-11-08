import type { UploadFile } from "element-plus";
import { read, utils, writeFileXLSX } from "xlsx";

export function exportXlsx(data: any, file: string, ...sheets: string[]) {
  const wb = utils.book_new();
  for (let i = 0; i < sheets.length; i++) utils.book_append_sheet(wb, utils.json_to_sheet(data), sheets[i]);
  writeFileXLSX(wb, file);
}

export async function importXlsx(file: UploadFile, xlsx: any) {
  const wb = read(await file.raw?.arrayBuffer());
  xlsx.value = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
}

export enum FileType {
  XLS = "application/vnd.ms-excel",
  XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}
