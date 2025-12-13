import { loadContent } from "../lib/loadContent";

export async function getStaticProps() {
  return {
    props: {
      content: loadContent()
    }
  };
}

export default function Page({ content }) {
  return <pre>{JSON.stringify(content.portal, null, 2)}</pre>;
}
