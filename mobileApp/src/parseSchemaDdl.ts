import { ParsedTableSchema } from "./types";

/** Split Flask CREATE TABLE DDL into per-table chunks. Same rules as the website. */
export function parseSchemaDdl(schemaText: string): ParsedTableSchema[] {
  if (!schemaText?.trim()) return [];
  console.log("[mobile] parse schema ddl", schemaText.length);

  const blocks = schemaText
    .split(/;\s*(?=\n|$)/)
    .map((part) => part.trim())
    .filter((part) => /CREATE\s+TABLE/i.test(part));

  const tables: ParsedTableSchema[] = [];
  for (const block of blocks) {
    const match = block.match(/CREATE\s+TABLE\s+(?:`([^`]+)`|"([^"]+)"|(\w+))/i);
    const name = match?.[1] || match?.[2] || match?.[3];
    if (!name) continue;
    tables.push({ name, ddl: `${block};` });
  }

  return tables.sort((a, b) => a.name.localeCompare(b.name));
}
