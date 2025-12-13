import fs from "fs";
import path from "path";

export function loadContent() {
  const filePath = path.join(process.cwd(), "content", "content.json");
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
