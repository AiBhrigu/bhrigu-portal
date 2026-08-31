import PublicEphemeridesV1 from "../../components/astro/PublicEphemeridesV1";
import { buildPublicEphemeridesMonth, preferredPublishedMonth } from "../../lib/public-ephemerides-v1";
export async function getServerSideProps({query}:any){const locale=query.lang==="ru"?"ru":"en";const month=preferredPublishedMonth();return{props:{locale,canonicalPath:"/ephemerides",mode:"root",data:buildPublicEphemeridesMonth(locale,month)}}}
export default PublicEphemeridesV1;
