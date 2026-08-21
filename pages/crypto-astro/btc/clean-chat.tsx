import Head from "next/head";
import type { GetServerSideProps } from "next";
import BtcCleanChatV1 from "../../../ui/btc/BtcCleanChatV1";
import type { BtcCleanLocale } from "../../../lib/btc-clean-chat-v1";

type Props = {
  locale: BtcCleanLocale;
  initialQuestion: string;
  deploymentSourceSha: string | null;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function validObservationDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function sourceSha(): string | null {
  const value = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null;
  return value && /^[0-9a-f]{40}$/i.test(value) ? value : null;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, res }) => {
  const locale: BtcCleanLocale = first(query.lang).toLowerCase() === "ru" ? "ru" : "en";
  const rawQuestion = first(query.q).trim();
  const rawDate = first(query.d).trim();
  const selectedDate = validObservationDate(rawDate) ? rawDate : "";
  const dateSuffix = selectedDate ? `\n\n${locale === "ru" ? "Выбранная дата" : "Selected date"}: ${selectedDate}` : "";
  const initialQuestion = rawQuestion
    ? `${rawQuestion.slice(0, Math.max(0, 500 - dateSuffix.length))}${dateSuffix}`
    : "";
  const sha = sourceSha();
  res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Vercel-CDN-Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-BTC-Clean-Chat", "v1");
  res.setHeader("X-BTC-Deployment-Source-Sha", sha ?? "UNAVAILABLE");
  return { props: { locale, initialQuestion, deploymentSourceSha: sha } };
};

export default function BtcCleanChatPage({ locale, initialQuestion, deploymentSourceSha }: Props) {
  const title = locale === "ru" ? "BTC Космограф · Clean Chat Preview" : "BTC Cosmographer · Clean Chat Preview";
  const description = locale === "ru"
    ? "Живой read-only диалог о текущем поле BTC, памяти Snapshot, Binance и ожиданиях Polymarket."
    : "Live read-only dialogue across the BTC field, Snapshot Memory, Binance, and Polymarket expectations.";
  return <>
    <Head>
      <title>{title}</title>
      <meta name="description" content={description}/>
      <meta name="robots" content="noindex,nofollow"/>
      <meta name="btc-clean-chat" content="v1"/>
      <meta name="btc-deployment-source-sha" content={deploymentSourceSha ?? ""}/>
    </Head>
    <BtcCleanChatV1 locale={locale} initialQuestion={initialQuestion}/>
    <style jsx global>{`
      header[data-hdr="BHRIGU_BTC_FIELD_HEADER_V0_1"],
      nav[data-pn-root="PORTAL_PREVNEXT_V0_2"]{display:none!important}
      .cleanChatPage,.cleanChatPage button,.cleanChatPage textarea{
        font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif!important
      }
      @media(max-width:680px){
        .cleanComposer{position:relative!important;bottom:auto!important;margin-top:18px!important}
        .cleanThread{padding-bottom:10px!important}
      }
    `}</style>
  </>;
}
