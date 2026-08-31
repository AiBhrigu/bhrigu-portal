import PublicEphemeridesV1 from "../../../components/astro/PublicEphemeridesV1";
import { buildPublicEphemeridesMonth, normalizeEphemeridesMonth, PUBLIC_EPHEMERIDES_YEAR } from "../../../lib/public-ephemerides-v1";
export async function getServerSideProps({query,params}:any){const month=normalizeEphemeridesMonth(params.month);if(Number(params.year)!==PUBLIC_EPHEMERIDES_YEAR||!month)return{notFound:true};const locale=query.lang==="ru"?"ru":"en";return{props:{locale,canonicalPath:`/ephemerides/${PUBLIC_EPHEMERIDES_YEAR}/${String(month).padStart(2,"0")}`,mode:"month",data:buildPublicEphemeridesMonth(locale,month)}}}
export default PublicEphemeridesV1;
