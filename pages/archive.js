import fs from "fs";
import path from "path";

export async function getStaticProps() {
  const dir = path.join(process.cwd(), "docs");
  const files = fs.readdirSync(dir).map(name => ({
    name,
    content: fs.readFileSync(path.join(dir, name), "utf8")
  }));
  return { props: { files } };
}

export default function Archive({ files }) {
  return (
    <div>
      {files.map(f => (
        <section key={f.name}>
          <h3>{f.name}</h3>
          <pre>{f.content}</pre>
        </section>
      ))}
    </div>
  );
}
