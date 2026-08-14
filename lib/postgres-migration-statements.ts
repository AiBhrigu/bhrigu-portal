export function splitPostgresStatements(source: string): string[] {
  const statements: string[] = [];
  let current = "";
  let i = 0;
  let single = false;
  let double = false;
  let lineComment = false;
  let blockDepth = 0;
  let dollarTag: string | null = null;

  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1] ?? "";

    if (lineComment) {
      current += ch;
      i += 1;
      if (ch === "\n") lineComment = false;
      continue;
    }
    if (blockDepth > 0) {
      if (ch === "/" && next === "*") { current += "/*"; blockDepth += 1; i += 2; continue; }
      if (ch === "*" && next === "/") { current += "*/"; blockDepth -= 1; i += 2; continue; }
      current += ch; i += 1; continue;
    }
    if (dollarTag !== null) {
      if (source.startsWith(dollarTag, i)) {
        current += dollarTag; i += dollarTag.length; dollarTag = null;
      } else { current += ch; i += 1; }
      continue;
    }
    if (single) {
      current += ch; i += 1;
      if (ch === "'" && source[i] === "'") { current += "'"; i += 1; }
      else if (ch === "'") single = false;
      continue;
    }
    if (double) {
      current += ch; i += 1;
      if (ch === '"' && source[i] === '"') { current += '"'; i += 1; }
      else if (ch === '"') double = false;
      continue;
    }

    if (ch === "-" && next === "-") { current += "--"; lineComment = true; i += 2; continue; }
    if (ch === "/" && next === "*") { current += "/*"; blockDepth = 1; i += 2; continue; }
    if (ch === "'") { current += ch; single = true; i += 1; continue; }
    if (ch === '"') { current += ch; double = true; i += 1; continue; }
    if (ch === "$") {
      const match = source.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/);
      if (match) { dollarTag = match[0]; current += dollarTag; i += dollarTag.length; continue; }
    }
    if (ch === ";") {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = ""; i += 1; continue;
    }
    current += ch; i += 1;
  }

  if (single || double || lineComment || blockDepth > 0 || dollarTag !== null) {
    if (single || double || blockDepth > 0 || dollarTag !== null) throw new Error("unterminated_sql_construct");
  }
  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

export function postgresMigrationTransactionStatements(source: string): string[] {
  return splitPostgresStatements(source).filter((statement) => !/^(?:BEGIN|COMMIT)$/i.test(statement.trim()));
}
