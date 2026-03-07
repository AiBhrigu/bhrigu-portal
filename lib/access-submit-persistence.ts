import fs from "fs/promises";
import path from "path";

import type {
  AccessSubmissionIndexEntry,
  AccessSubmissionIndexV1,
  AccessSubmissionPersistenceAdapter,
  ClientStatus,
  StoredAccessSubmissionV1,
  SubjectType,
} from "./access-models";

interface PersistencePaths {
  rootDir: string;
  recordsDir: string;
  indexFile: string;
}

export function createFileAccessSubmissionPersistenceAdapter(
  baseDir?: string
): AccessSubmissionPersistenceAdapter {
  const paths = buildPersistencePaths(baseDir);

  return {
    async save(record) {
      await ensurePersistenceStructure(paths);
      const recordPath = getRecordPath(paths, record.requestId);
      const normalized = normalizeStoredRecord(record);
      await writeJsonAtomic(recordPath, normalized);
      await upsertIndexEntry(paths, normalized);
    },

    async getByRequestId(requestId) {
      await ensurePersistenceStructure(paths);
      const recordPath = getRecordPath(paths, requestId);
      const record = await readJsonFile<StoredAccessSubmissionV1>(recordPath);
      return record ?? null;
    },

    async updateStatus(requestId, status, updatedAt = new Date().toISOString()) {
      await ensurePersistenceStructure(paths);
      const existing = await readJsonFile<StoredAccessSubmissionV1>(getRecordPath(paths, requestId));
      if (!existing) return null;

      const next: StoredAccessSubmissionV1 = {
        ...existing,
        updatedAt,
        status,
        clientView: { ...existing.clientView, status },
      };

      await writeJsonAtomic(getRecordPath(paths, requestId), next);
      await upsertIndexEntry(paths, next);
      return next;
    },

    async markCorrectionRequested(requestId, updatedAt = new Date().toISOString()) {
      await ensurePersistenceStructure(paths);
      const existing = await readJsonFile<StoredAccessSubmissionV1>(getRecordPath(paths, requestId));
      if (!existing) return null;

      const nextTemporalMeta = {
        ...existing.requestTemporalMeta,
        correctionRequested: true,
      };

      const next: StoredAccessSubmissionV1 = {
        ...existing,
        updatedAt,
        status: "correction_requested",
        requestTemporalMeta: nextTemporalMeta,
        clientView: { ...existing.clientView, status: "correction_requested" },
        operatorPacket: {
          ...existing.operatorPacket,
          requestTemporalMeta: nextTemporalMeta,
        },
      };

      await writeJsonAtomic(getRecordPath(paths, requestId), next);
      await upsertIndexEntry(paths, next);
      return next;
    },
  };
}

export const fileAccessSubmissionPersistenceAdapter =
  createFileAccessSubmissionPersistenceAdapter();

function buildPersistencePaths(baseDir?: string): PersistencePaths {
  const rootDir = baseDir ?? path.join(process.cwd(), "var", "access-submissions");

  return {
    rootDir,
    recordsDir: path.join(rootDir, "records"),
    indexFile: path.join(rootDir, "index.v1.json"),
  };
}

function getRecordPath(paths: PersistencePaths, requestId: string): string {
  return path.join(paths.recordsDir, `${safeFileSegment(requestId)}.json`);
}

function safeFileSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "_");
}

async function ensurePersistenceStructure(paths: PersistencePaths): Promise<void> {
  await fs.mkdir(paths.recordsDir, { recursive: true });

  try {
    await fs.access(paths.indexFile);
  } catch {
    const emptyIndex: AccessSubmissionIndexV1 = {
      version: "v1",
      updatedAt: new Date().toISOString(),
      records: [],
    };
    await writeJsonAtomic(paths.indexFile, emptyIndex);
  }
}

async function upsertIndexEntry(paths: PersistencePaths, record: StoredAccessSubmissionV1): Promise<void> {
  const index = (await readJsonFile<AccessSubmissionIndexV1>(paths.indexFile)) ?? createEmptyIndex();

  const entry: AccessSubmissionIndexEntry = {
    requestId: record.requestId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    status: record.status,
    email: record.request.email,
    subjectType: record.request.subjectType,
    requestPath: getRecordPath(paths, record.requestId),
  };

  const existingIndex = index.records.findIndex((r) => r.requestId === record.requestId);

  const nextRecords =
    existingIndex >= 0
      ? index.records.map((r, idx) => (idx === existingIndex ? entry : r))
      : [...index.records, entry];

  const nextIndex: AccessSubmissionIndexV1 = {
    version: "v1",
    updatedAt: new Date().toISOString(),
    records: nextRecords.sort((a, b) => {
      if (a.createdAt < b.createdAt) return 1;
      if (a.createdAt > b.createdAt) return -1;
      return a.requestId.localeCompare(b.requestId);
    }),
  };

  await writeJsonAtomic(paths.indexFile, nextIndex);
}

function createEmptyIndex(): AccessSubmissionIndexV1 {
  return {
    version: "v1",
    updatedAt: new Date().toISOString(),
    records: [],
  };
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  const tempPath = `${filePath}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(tempPath, json, "utf8");
  await fs.rename(tempPath, filePath);
}

function normalizeStoredRecord(record: StoredAccessSubmissionV1): StoredAccessSubmissionV1 {
  return {
    ...record,
    request: {
      ...record.request,
      name: record.request.name.trim(),
      email: record.request.email.trim().toLowerCase(),
      mainQuestion: record.request.mainQuestion.trim(),
      shortDescription: record.request.shortDescription.trim(),
    },
    normalizedDates: [...record.normalizedDates].sort((a, b) => a.label.localeCompare(b.label)),
  };
}
