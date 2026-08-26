const PUBLIC_LOCALES = new Set(["en", "ru"]);

export function normalizePublicLocale(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "ru" ? "ru" : "en";
}

function splitInternalHref(href) {
  const value = String(href || "");
  const hashIndex = value.indexOf("#");
  const hash = hashIndex >= 0 ? value.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? value.slice(0, hashIndex) : value;
  const queryIndex = withoutHash.indexOf("?");
  const path = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : "";
  return { path, query, hash };
}

function isExternalOrSpecialHref(href) {
  const value = String(href || "");
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value) || value.startsWith("#");
}

export function resolvePublicLocale(asPath = "", queryLang = null) {
  const direct = Array.isArray(queryLang) ? queryLang[0] : queryLang;
  if (PUBLIC_LOCALES.has(direct)) return direct;
  const { query } = splitInternalHref(asPath);
  const fromPath = new URLSearchParams(query).get("lang");
  return normalizePublicLocale(fromPath);
}

export function withPublicLocale(href, locale) {
  if (!href || isExternalOrSpecialHref(href)) return href;
  const { path, query, hash } = splitInternalHref(href);
  const params = new URLSearchParams(query);
  params.set("lang", normalizePublicLocale(locale));
  const encoded = params.toString();
  return `${path || "/"}${encoded ? `?${encoded}` : ""}${hash}`;
}

export function switchPublicLocale(asPath, targetLocale) {
  return withPublicLocale(asPath || "/", normalizePublicLocale(targetLocale));
}
