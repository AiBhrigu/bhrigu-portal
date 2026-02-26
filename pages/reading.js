export const getServerSideProps = async () => {
  return {
    props: {
      force_ssr_marker: "READING_V2_SURFACE_V0_1"
    }
  };
};

export default function Reading({ force_ssr_marker }) {
  return (
    <div data-reading-surface="READING_V2_SURFACE_V0_1">
      <h1>Reading v2 Surface</h1>
      <p>Phase Density</p>
      <p>Engine: frey-temporal-core-v0.1</p>
      <div id="surface-marker">{force_ssr_marker}</div>
    </div>
  );
}
