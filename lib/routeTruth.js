// PORTAL_SURFACE_CANON · ROUTE_TRUTH (locked)
// Golden Path: /start → /frey → /reading → /cosmographer → /investors
// Support: /map /faq /services /dao /orion  (only Up → /start)
// Archive: /signal → /archive → /chronicle (all have Up → /start)

export const ROUTE_TRUTH = {
  golden: ["/start", "/frey", "/reading", "/cosmographer", "/investors"],
  support: ["/map", "/faq", "/services", "/dao", "/orion"],
  archive: ["/signal", "/archive", "/chronicle"],
  gates: ["/access", "/api"]
};

function norm(route) {
  if (!route) return "";
  return String(route).split("?")[0].split("#")[0];
}

function chainPrevNext(chain, route) {
  const r = norm(route);
  const i = chain.indexOf(r);
  if (i < 0) return { prev: null, next: null };
  return {
    prev: i > 0 ? chain[i - 1] : null,
    next: i < chain.length - 1 ? chain[i + 1] : null
  };
}

export function getPrevNextUp(route) {
  const r = norm(route);

  // Gates: no PrevNext
  if (ROUTE_TRUTH.gates.includes(r)) return { prev: null, next: null, up: null };

  // Golden Path
  if (ROUTE_TRUTH.golden.includes(r)) {
    const pn = chainPrevNext(ROUTE_TRUTH.golden, r);
    const up = r === "/start" ? "/" : "/start";
    return { prev: pn.prev, next: pn.next, up };
  }

  // Archive branch
  if (ROUTE_TRUTH.archive.includes(r)) {
    const pn = chainPrevNext(ROUTE_TRUTH.archive, r);
    return { prev: pn.prev, next: pn.next, up: "/start" };
  }

  // Support pages
  if (ROUTE_TRUTH.support.includes(r)) {
    return { prev: null, next: null, up: "/start" };
  }

  return { prev: null, next: null, up: "/start" };
}
