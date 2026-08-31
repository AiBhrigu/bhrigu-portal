import PublicEphemeridesToday from "../../components/astro/PublicEphemeridesToday";
import { loadPublicEphemeridesToday } from "../../lib/public-ephemerides-live";
export async function getServerSideProps({query}:any){const locale=query.lang==="ru"?"ru":"en";return{props:{locale,canonicalPath:"/ephemerides",mode:"today",data:await loadPublicEphemeridesToday(locale)}}}
export default PublicEphemeridesToday;
