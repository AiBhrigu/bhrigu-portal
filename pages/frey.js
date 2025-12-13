import { loadContent } from "../lib/loadContent";

export default function Page() {
  const content = loadContent();
  return <pre>{JSON.stringify(content, null, 2)}</pre>;
}
