import type {
  AccessSubmissionModel,
  AccessTemporalMeta,
  DraftCurrentStep,
  DraftFormState,
  DraftLoadOptions,
  DraftRestoreResult,
  DraftSaveContext,
  DraftSaveOptions,
  DraftStatus,
  DraftSubmitAttempt,
  FormDataModel,
  NormalizedDatesModel,
  PersistedAccessDraftV1,
  ReviewDataModel,
} from "./access-models";

export const ACCESS_DRAFT_STORAGE_KEY = "bhrigu_access_draft_v1";
export const ACCESS_DRAFT_VERSION = "v1";
export const ACCESS_DRAFT_TTL_DAYS = 7;

export function createInitialTemporalMeta(
  source: AccessTemporalMeta["access_entry_source"] = "unknown",
  nowIso: string = new Date().toISOString()
): AccessTemporalMeta {
  return {
    access_entry_at: nowIso,
    draft_started_at: null,
    date_confirmation_completed_at: null,
    request_submitted_at: null,
    access_entry_source: source,
    resume_count: 0,
    draft_duration_ms: null,
    correction_requested: false,
  };
}

export function markDraftStarted(
  temporalMeta: AccessTemporalMeta,
  nowIso: string = new Date().toISOString()
): AccessTemporalMeta {
  if (temporalMeta.draft_started_at) return temporalMeta;

  return {
    ...temporalMeta,
    draft_started_at: nowIso,
  };
}

export function markDateConfirmationCompleted(
  temporalMeta: AccessTemporalMeta,
  nowIso: string = new Date().toISOString()
): AccessTemporalMeta {
  if (temporalMeta.date_confirmation_completed_at) return temporalMeta;

  return {
    ...temporalMeta,
    date_confirmation_completed_at: nowIso,
  };
}

export function incrementResumeCount(
  temporalMeta: AccessTemporalMeta
): AccessTemporalMeta {
  return {
    ...temporalMeta,
    resume_count: temporalMeta.resume_count + 1,
  };
}

export function markCorrectionRequested(
  temporalMeta: AccessTemporalMeta
): AccessTemporalMeta {
  return {
    ...temporalMeta,
    correction_requested: true,
  };
}

export function markRequestSubmitted(
  temporalMeta: AccessTemporalMeta,
  submittedAtIso: string
): AccessTemporalMeta {
  return {
    ...temporalMeta,
    request_submitted_at: submittedAtIso,
    draft_duration_ms: temporalMeta.draft_started_at
      ? new Date(submittedAtIso).getTime() -
        new Date(temporalMeta.draft_started_at).getTime()
      : null,
  };
}

export function hasMeaningfulDraftData(formData: FormDataModel): boolean {
  const request = formData.request;
  const scope = formData.scope;

  const requestHasData =
    Boolean(request.name?.trim()) ||
    Boolean(request.email?.trim()) ||
    Boolean(request.subjectType) ||
    Boolean(request.mainQuestion?.trim()) ||
    Boolean(request.shortDescription?.trim()) ||
    Boolean(request.preferredDepth);

  const scopeHasData =
    Boolean(scope.entitiesCount) ||
    Boolean(scope.timeScope) ||
    Boolean(scope.sourceMaterialLevel) ||
    Boolean(scope.referenceLinks?.trim());

  const payloadHasData = hasSubjectPayloadData(formData.subjectPayload);

  return requestHasData || scopeHasData || payloadHasData;
}

export function buildDraftStatus(
  formData: FormDataModel,
  reviewData: ReviewDataModel
): DraftStatus {
  if (!hasMeaningfulDraftData(formData)) return "empty";

  if (reviewData.canSubmit && formData.consents.reviewConfirmationAccepted) {
    return "reviewed_not_submitted";
  }

  if (reviewData.blockingIssues.length === 0) {
    return "ready_for_review";
  }

  return "in_progress";
}

export function buildPersistedDraft(
  context: DraftSaveContext
): PersistedAccessDraftV1 {
  return {
    version: "v1",
    draftId: buildDraftId(),
    savedAt: new Date().toISOString(),
    formState: context.formState,
    currentStep: context.currentStep,
    draftStatus: context.draftStatus,
    temporalMeta: context.temporalMeta,
    formData: context.formData,
    normalizedDates: context.normalizedDates,
    reviewData: context.reviewData,
    submitAttempt: context.submitAttempt,
  };
}

export function saveDraftToLocalStorage(
  draft: PersistedAccessDraftV1,
  options: DraftSaveOptions = {}
): void {
  if (typeof window === "undefined") return;
  const storageKey = options.storageKey ?? ACCESS_DRAFT_STORAGE_KEY;
  window.localStorage.setItem(storageKey, JSON.stringify(draft));
}

export function loadDraftFromLocalStorage(
  options: DraftLoadOptions = {}
): DraftRestoreResult {
  if (typeof window === "undefined") {
    return {
      found: false,
      expired: false,
      corrupted: false,
      draft: null,
    };
  }

  const storageKey = options.storageKey ?? ACCESS_DRAFT_STORAGE_KEY;
  const ttlDays = options.ttlDays ?? ACCESS_DRAFT_TTL_DAYS;

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return {
      found: false,
      expired: false,
      corrupted: false,
      draft: null,
    };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (isDraftCorrupted(parsed)) {
      return {
        found: true,
        expired: false,
        corrupted: true,
        draft: null,
      };
    }

    const draft = parsed as PersistedAccessDraftV1;
    const expired = isDraftExpired(draft.savedAt, { ttlDays });

    return {
      found: true,
      expired,
      corrupted: false,
      draft: expired ? null : draft,
    };
  } catch {
    return {
      found: true,
      expired: false,
      corrupted: true,
      draft: null,
    };
  }
}

export function clearDraftFromLocalStorage(
  storageKey: string = ACCESS_DRAFT_STORAGE_KEY
): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey);
}

export function isDraftExpired(
  savedAt: string,
  options: { ttlDays?: number; nowIso?: string } = {}
): boolean {
  const ttlDays = options.ttlDays ?? ACCESS_DRAFT_TTL_DAYS;
  const now = options.nowIso ? new Date(options.nowIso) : new Date();
  const saved = new Date(savedAt);

  if (Number.isNaN(saved.getTime())) return true;

  const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
  return now.getTime() - saved.getTime() > ttlMs;
}

export function isDraftCorrupted(input: unknown): boolean {
  if (!input || typeof input !== "object") return true;

  const draft = input as Partial<PersistedAccessDraftV1>;

  if (draft.version !== "v1") return true;
  if (typeof draft.draftId !== "string") return true;
  if (typeof draft.savedAt !== "string") return true;
  if (!isDraftFormState(draft.formState)) return true;
  if (!isDraftCurrentStep(draft.currentStep)) return true;
  if (!isDraftStatus(draft.draftStatus)) return true;
  if (!draft.temporalMeta || typeof draft.temporalMeta !== "object") return true;
  if (!draft.formData || typeof draft.formData !== "object") return true;
  if (!draft.normalizedDates || typeof draft.normalizedDates !== "object") return true;
  if (!draft.reviewData || typeof draft.reviewData !== "object") return true;
  if (!draft.submitAttempt || typeof draft.submitAttempt !== "object") return true;

  return false;
}

export function restoreDraftToSubmissionModel(
  draft: PersistedAccessDraftV1
): AccessSubmissionModel {
  return {
    formState: draft.formState,
    formData: draft.formData,
    normalizedDates: draft.normalizedDates,
    reviewData: draft.reviewData,
    clientView: null,
    operatorPacket: null,
    temporalMeta: draft.temporalMeta,
  };
}

export function shouldShowDraftRestorePrompt(
  result: DraftRestoreResult
): boolean {
  return result.found && !result.expired && !result.corrupted && result.draft !== null;
}

export function shouldWarnBeforeUnload(
  formData: FormDataModel,
  draftStatus: DraftStatus
): boolean {
  return hasMeaningfulDraftData(formData) && draftStatus !== "empty";
}

export function markSubmitAttemptSubmitting(
  draft: PersistedAccessDraftV1
): PersistedAccessDraftV1 {
  return {
    ...draft,
    savedAt: new Date().toISOString(),
    submitAttempt: {
      status: "submitting",
      lastAttemptAt: new Date().toISOString(),
      lastErrorMessage: null,
    },
  };
}

export function markSubmitAttemptFailed(
  draft: PersistedAccessDraftV1,
  errorMessage: string
): PersistedAccessDraftV1 {
  return {
    ...draft,
    savedAt: new Date().toISOString(),
    submitAttempt: {
      status: "failed",
      lastAttemptAt: new Date().toISOString(),
      lastErrorMessage: errorMessage,
    },
  };
}

export function resetSubmitAttempt(
  draft: PersistedAccessDraftV1
): PersistedAccessDraftV1 {
  return {
    ...draft,
    savedAt: new Date().toISOString(),
    submitAttempt: {
      status: "idle",
      lastAttemptAt: null,
      lastErrorMessage: null,
    },
  };
}

export function rebuildDraftForSave(
  formState: DraftFormState,
  currentStep: DraftCurrentStep,
  formData: FormDataModel,
  normalizedDates: NormalizedDatesModel,
  reviewData: ReviewDataModel,
  submitAttempt: DraftSubmitAttempt,
  temporalMeta: AccessTemporalMeta
): PersistedAccessDraftV1 {
  const draftStatus = buildDraftStatus(formData, reviewData);

  return buildPersistedDraft({
    formState,
    currentStep,
    formData,
    normalizedDates,
    reviewData,
    draftStatus,
    submitAttempt,
    temporalMeta,
  });
}

export function maybePersistDraft(
  formState: DraftFormState,
  currentStep: DraftCurrentStep,
  formData: FormDataModel,
  normalizedDates: NormalizedDatesModel,
  reviewData: ReviewDataModel,
  submitAttempt: DraftSubmitAttempt,
  temporalMeta: AccessTemporalMeta,
  options: DraftSaveOptions = {}
): void {
  if (!hasMeaningfulDraftData(formData)) return;

  const draft = rebuildDraftForSave(
    formState,
    currentStep,
    formData,
    normalizedDates,
    reviewData,
    submitAttempt,
    temporalMeta
  );

  saveDraftToLocalStorage(draft, options);
}

export function discardExpiredOrCorruptedDraft(
  result: DraftRestoreResult,
  storageKey: string = ACCESS_DRAFT_STORAGE_KEY
): void {
  if (result.expired || result.corrupted) {
    clearDraftFromLocalStorage(storageKey);
  }
}

export function isDraftFormState(value: unknown): value is DraftFormState {
  return value === "input" || value === "ambiguity" || value === "review";
}

export function isDraftCurrentStep(value: unknown): value is DraftCurrentStep {
  return (
    value === "request" ||
    value === "dates" ||
    value === "scope" ||
    value === "review"
  );
}

export function isDraftStatus(value: unknown): value is DraftStatus {
  return (
    value === "empty" ||
    value === "in_progress" ||
    value === "ready_for_review" ||
    value === "reviewed_not_submitted"
  );
}

function buildDraftId(): string {
  return `draft_${Date.now()}`;
}

function hasSubjectPayloadData(payload: FormDataModel["subjectPayload"]): boolean {
  if (!payload || typeof payload !== "object") return false;

  return Object.values(payload).some((value) => {
    if (typeof value === "string") return Boolean(value.trim());

    if (value && typeof value === "object") {
      return Object.values(value as Record<string, unknown>).some((nested) =>
        typeof nested === "string" ? Boolean(nested.trim()) : Boolean(nested)
      );
    }

    return Boolean(value);
  });
}
