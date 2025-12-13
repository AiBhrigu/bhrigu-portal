import fs from "fs";
import path from "path";
export async function getStaticProps() {
  const p = path.join(process.cwd(), "docs", "start.md");
  return { props: { c: fs.readFileSync(p, "utf8") } };
}
export default function Page({ c }) { return <pre>{c}</pre>; }
