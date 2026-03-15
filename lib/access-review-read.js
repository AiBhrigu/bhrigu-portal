import fs from "fs/promises";
import path from "path";

const REVIEW_VERSION = "OPERATOR_REVIEW_SURFACE_V0_1";

function buildPersistencePaths(baseDir) {
  const defaultRootDir =
    baseDir ??
    process.env.ACCESS_SUBMISSIONS_DIR ??
    (process.env.VERCEL
      ? path.join(process.env.TMPDIR ?? "/tmp", "access-submissions")
      : path.join(process.cwd(), "var", "access-submissions"));

  return {
    rootDir: defaultRootDir,
    recordsDir: path.join(defaultRootDir, "records"),
    indexFile: path.join(defaultRootDir, "index.v1.json"),
  };
}

function safeFileSegment(value) {
  return String(value || "").replace(/[^A-Za-z0-9_-]/g, "_");
}

async function readJsonFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function sanitizeText(value, maxLen = 2000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

function pickTriage(record) {
  const top = record?.triage && typeof record.triage === "object" ? record.triage : null;
  const op = record?.operatorPacket?.triage && typeof record.operatorPacket.triage === "object"
    ? record.operatorPacket.triage
    : null;
  return top || op || null;
}

function pickFreyCtx(record) {
  if (typeof record?.freyCtx === "string" && record.freyCtx.trim()) return record.freyCtx.trim();
  if (typeof record?.operatorPacket?.freyCtx === "string" && record.operatorPacket.freyCtx.trim()) {
    return record.operatorPacket.freyCtx.trim();
  }
  return "";
}

function decodeFreyCtxPreview(rawCtx) {
  if (!rawCtx) return null;
  try {
    const normalized = rawCtx.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    return {
      signal_class: sanitizeText(decoded?.signal_class, 64),
      operational_vector: sanitizeText(decoded?.operational_vector, 64),
      primary_date: sanitizeText(decoded?.primary_date, 64),
      secondary_date: sanitizeText(decoded?.secondary_date, 64),
      delta_mode: sanitizeText(decoded?.delta_mode, 64),
      timeline_mode: sanitizeText(decoded?.timeline_mode, 64),
    };
  } catch {
    return null;
  }
}

export function sanitizeReviewRecord(record) {
  if (!record || typeof record !== "object") return null;

  const triage = pickTriage(record);
  const freyCtx = pickFreyCtx(record);
  const freyPreview = decodeFreyCtxPreview(freyCtx);

  return {
    version: REVIEW_VERSION,
    requestId: sanitizeText(record.requestId, 128),
    submittedAt: sanitizeText(record.createdAt || record.submittedAt || "", 128),
    updatedAt: sanitizeText(record.updatedAt || "", 128),
    status: sanitizeText(record.status || "", 128),
    request: {
      name: sanitizeText(record?.request?.name, 256),
      email: sanitizeText(record?.request?.email, 256),
      subjectType: sanitizeText(record?.request?.subjectType, 128),
      mainQuestion: sanitizeText(record?.request?.mainQuestion, 4000),
      shortDescription: sanitizeText(record?.request?.shortDescription, 4000),
    },
    freyCtx,
    freyPreview,
    triage: triage
      ? {
          intake_score: triage.intake_score ?? null,
          priority_band: sanitizeText(triage.priority_band, 64),
          route_hint: sanitizeText(triage.route_hint, 128),
          signal_class: sanitizeText(triage.signal_class, 64),
          operational_vector: sanitizeText(triage.operational_vector, 64),
        }
      : null,
    intake_score: record?.intake_score ?? triage?.intake_score ?? null,
    priority_band: sanitizeText(record?.priority_band || triage?.priority_band, 64),
    route_hint: sanitizeText(record?.route_hint || triage?.route_hint, 128),
    operatorPacket: record?.operatorPacket ?? null,
  };
}

export async function getAccessReviewRecordById(requestId, baseDir) {
  const paths = buildPersistencePaths(baseDir);
  const filePath = path.join(paths.recordsDir, `${safeFileSegment(requestId)}.json`);
  const record = await readJsonFile(filePath);
  return sanitizeReviewRecord(record);
}

export async function listAccessReviewRecords(limit = 10, baseDir) {
  const paths = buildPersistencePaths(baseDir);
  const index = await readJsonFile(paths.indexFile);

  let rawRecords = [];

  if (index?.records && Array.isArray(index.records) && index.records.length > 0) {
    const top = index.records.slice(0, Math.max(1, Math.min(limit, 50)));
    for (const entry of top) {
      const fromPath =
        typeof entry?.requestPath === "string" && entry.requestPath.trim()
          ? await readJsonFile(entry.requestPath)
          : null;
      if (fromPath) {
        rawRecords.push(fromPath);
        continue;
      }
      if (entry?.requestId) {
        const fallback = await getAccessReviewRecordById(entry.requestId, baseDir);
        if (fallback) rawRecords.push(fallback);
      }
    }
  } else {
    try {
      const files = await fs.readdir(paths.recordsDir);
      const jsonFiles = files.filter((name) => name.endsWith(".json")).sort().reverse().slice(0, limit);
      for (const name of jsonFiles) {
        const record = await readJsonFile(path.join(paths.recordsDir, name));
        if (record) rawRecords.push(record);
      }
    } catch {
      rawRecords = [];
    }
  }

  const sanitized = rawRecords
    .map((record) => sanitizeReviewRecord(record))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.submittedAt < b.submittedAt) return 1;
      if (a.submittedAt > b.submittedAt) return -1;
      return String(a.requestId).localeCompare(String(b.requestId));
    })
    .slice(0, Math.max(1, Math.min(limit, 50)));

  return sanitized;
}

export function getAccessReviewStorageMeta(baseDir) {
  const paths = buildPersistencePaths(baseDir);
  return {
    version: REVIEW_VERSION,
    rootDir: paths.rootDir,
    recordsDir: paths.recordsDir,
    indexFile: paths.indexFile,
  };
}
