import PublicEphemeridesV1 from "../../../components/astro/PublicEphemeridesV1";
import { buildPublicEphemeridesMonth, preferredPublishedMonth, PUBLIC_EPHEMERIDES_YEAR } from "../../../lib/public-ephemerides-v1";
export async function getServerSideProps({query,params}:any){if(Number(params.year)!==PUBLIC_EPHEMERIDES_YEAR)return{notFound:true};const locale=query.lang==="ru"?"ru":"en";const month=preferredPublishedMonth();return{props:{locale,canonicalPath:`/ephemerides/${PUBLIC_EPHEMERIDES_YEAR}`,mode:"year",data:buildPublicEphemeridesMonth(locale,month)}}}
export default PublicEphemeridesV1;
