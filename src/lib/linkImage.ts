import "server-only";
import { lookup } from "node:dns/promises";
import net from "node:net";

/**
 * Recupera l'immagine di anteprima di una pagina (og:image, twitter:image, …)
 * o l'immagine stessa se il link punta direttamente a un file immagine.
 * Restituisce null in caso di qualsiasi problema: non deve mai bloccare il salvataggio.
 */

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const MAX_HTML = 1_500_000;
const MAX_IMAGE = 3 * 1024 * 1024;
const TIMEOUT_MS = 7000;
const MAX_REDIRECTS = 5;

/** Formati raster accettati (niente SVG: potrebbe contenere script). */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

function isPrivateIPv4(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return (
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe8") ||
    v6.startsWith("fe9") ||
    v6.startsWith("fea") ||
    v6.startsWith("feb")
  );
}

/** Evita che il server venga usato per raggiungere indirizzi interni. */
async function assertPublic(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocollo");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal"))
    throw new Error("host");
  const addresses = net.isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
  if (addresses.length === 0 || addresses.some(isPrivateIp)) throw new Error("host privato");
}

async function safeFetch(start: URL, accept: string, signal: AbortSignal) {
  let url = start;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await assertPublic(url);
    const res = await fetch(url, {
      redirect: "manual",
      signal,
      headers: {
        "User-Agent": UA,
        Accept: accept,
        "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
      },
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel();
      url = new URL(location, url);
      continue;
    }
    return { res, url };
  }
  throw new Error("troppi redirect");
}

async function readLimited(res: Response, max: number, truncate = false): Promise<Buffer> {
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > max && !truncate) throw new Error("troppo grande");
  const reader = res.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      // Per l'HTML bastano le prime righe: i meta tag stanno nell'<head>
      if (truncate) break;
      throw new Error("troppo grande");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

function mediaType(res: Response) {
  return (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;|&#47;/g, "/");
}

function parseAttributes(tag: string) {
  const attrs: Record<string, string> = {};
  const re = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
  return attrs;
}

/** Candidati in ordine di preferenza. Esportata per i test. */
export function findImageCandidates(html: string): string[] {
  const byKey: Record<string, string[]> = {};
  const push = (k: string, v: string | undefined) => {
    if (v && v.trim()) (byKey[k] ??= []).push(v.trim());
  };

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const a = parseAttributes(tag);
    const key = (a.property ?? a.name ?? a.itemprop ?? "").toLowerCase();
    if (
      [
        "og:image:secure_url",
        "og:image",
        "og:image:url",
        "twitter:image",
        "twitter:image:src",
        "image",
      ].includes(key)
    )
      push(key, a.content);
  }
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const a = parseAttributes(tag);
    if ((a.rel ?? "").toLowerCase().split(/\s+/).includes("image_src")) push("image_src", a.href);
  }
  // Dati strutturati dei negozi online (JSON-LD "image")
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    const found = m[1].match(/"image"\s*:\s*(?:\[\s*)?(?:\{[^}]*?"url"\s*:\s*)?"([^"]+)"/);
    if (found) push("jsonld", found[1].replace(/\\\//g, "/"));
  }

  const order = [
    "og:image:secure_url",
    "og:image",
    "og:image:url",
    "twitter:image",
    "twitter:image:src",
    "image_src",
    "jsonld",
    "image",
  ];
  return Array.from(new Set(order.flatMap((k) => byKey[k] ?? [])));
}

async function downloadImage(url: URL, signal: AbortSignal, max = MAX_IMAGE) {
  const { res } = await safeFetch(url, "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8", signal);
  const type = mediaType(res);
  if (!res.ok || !IMAGE_TYPES.includes(type)) {
    await res.body?.cancel();
    return null;
  }
  const data = await readLimited(res, max);
  if (data.byteLength < 200) return null; // pixel di tracciamento, segnaposto
  return { data, type };
}

/* ---------------------------------------------------------------- */
/* Amazon                                                           */
/* ---------------------------------------------------------------- */

const AMAZON_HOST = /(^|\.)amazon\.(com|it|de|fr|es|co\.uk|nl|se|pl|com\.be|com\.tr|ca|com\.mx|com\.br|co\.jp|in|com\.au|ae|sa|sg|eg)$/i;
const AMAZON_SHORT_HOST = /^(amzn\.(to|eu|asia|com)|a\.co)$/i;
const ASIN_RE =
  /\/(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/asin|o\/asin|product-reviews)\/([A-Z0-9]{10})(?=[/?#]|$)/i;

export function isAmazon(url: URL) {
  return AMAZON_HOST.test(url.hostname) || AMAZON_SHORT_HOST.test(url.hostname);
}

export function amazonAsin(url: URL): string | null {
  if (!AMAZON_HOST.test(url.hostname)) return null;
  return url.pathname.match(ASIN_RE)?.[1]?.toUpperCase() ?? null;
}

/** Immagine ad alta risoluzione dalla pagina prodotto (se Amazon non ci blocca). */
export function amazonImageFromHtml(html: string): string | null {
  const oldHires = html.match(/data-old-hires="(https:[^"]+)"/)?.[1];
  if (oldHires) return oldHires;
  const hiRes = html.match(/"hiRes"\s*:\s*"(https:[^"]+)"/)?.[1];
  if (hiRes) return hiRes;
  const dyn = html.match(/data-a-dynamic-image="([^"]+)"/)?.[1];
  if (dyn) {
    try {
      const map = JSON.parse(decodeEntities(dyn)) as Record<string, [number, number]>;
      const best = Object.entries(map).sort((a, b) => b[1][0] - a[1][0])[0];
      if (best) return best[0];
    } catch {
      // ignora
    }
  }
  const large = html.match(/"large"\s*:\s*"(https:[^"]+)"/)?.[1];
  return large ?? null;
}

/** Immagine principale a partire dal codice prodotto: funziona anche quando la pagina è bloccata. */
async function amazonImageFromAsin(asin: string, signal: AbortSignal) {
  const variants = [
    { suffix: "_SCRMZZZZZZ_", max: 2 * 1024 * 1024 }, // alta risoluzione
    { suffix: "_SCLZZZZZZZ_", max: MAX_IMAGE }, // 500 px
  ];
  for (const v of variants) {
    try {
      const img = await downloadImage(
        new URL(`https://m.media-amazon.com/images/P/${asin}.01.${v.suffix}.jpg`),
        signal,
        v.max,
      );
      if (img) return img;
    } catch {
      // prova la variante successiva
    }
  }
  return null;
}

async function fetchAmazonImage(start: URL, signal: AbortSignal) {
  let asin = amazonAsin(start);
  // Prima la via veloce e affidabile: codice prodotto già nel link
  if (asin) {
    const img = await amazonImageFromAsin(asin, signal);
    if (img) return img;
  }
  // Link corti (amzn.eu/d/…) o immagine non trovata: apriamo la pagina
  const { res, url } = await safeFetch(start, "text/html,application/xhtml+xml", signal);
  if (!asin) {
    asin = amazonAsin(url);
    if (asin) {
      const img = await amazonImageFromAsin(asin, signal);
      if (img) {
        await res.body?.cancel();
        return img;
      }
    }
  }
  if (!res.ok || !mediaType(res).includes("html")) {
    console.warn(`Amazon: pagina non disponibile (stato ${res.status}) per ${asin ?? url.pathname}`);
    await res.body?.cancel();
    return null;
  }
  const html = (await readLimited(res, 3_000_000, true)).toString("utf8");
  const candidate = amazonImageFromHtml(html) ?? findImageCandidates(html)[0];
  if (!candidate) {
    const blocked = /captcha|api-services-support/i.test(html);
    console.warn(
      `Amazon: ${blocked ? "pagina bloccata dal controllo anti-bot" : "immagine non trovata nella pagina"} per ${asin ?? url.pathname}`,
    );
    return null;
  }
  return downloadImage(new URL(candidate, url), signal);
}

export async function fetchImageFromLink(
  link: string,
): Promise<{ data: Buffer; type: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const start = new URL(link);
    if (isAmazon(start)) return await fetchAmazonImage(start, controller.signal);

    const { res, url } = await safeFetch(
      start,
      "text/html,application/xhtml+xml,image/*;q=0.9,*/*;q=0.8",
      controller.signal,
    );
    const type = mediaType(res);

    // Il link è direttamente un'immagine
    if (IMAGE_TYPES.includes(type)) {
      if (!res.ok) return null;
      const data = await readLimited(res, MAX_IMAGE);
      return data.byteLength >= 200 ? { data, type } : null;
    }
    if (!res.ok || !type.includes("html")) {
      await res.body?.cancel();
      return null;
    }

    const html = (await readLimited(res, MAX_HTML, true)).toString("utf8");
    for (const candidate of findImageCandidates(html).slice(0, 4)) {
      try {
        const img = await downloadImage(new URL(candidate, url), controller.signal);
        if (img) return img;
      } catch {
        // prova il candidato successivo
      }
    }
    return null;
  } catch (e) {
    console.warn(`Foto dal link non recuperata: ${(e as Error).message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
