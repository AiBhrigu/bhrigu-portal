import { useCallback, useEffect, useRef, useState } from "react";

import type {
  AccessEntrySource,
  AccessSubmissionModel,
  DraftCurrentStep,
  DraftFormState,
  DraftSubmitAttempt,
  FormDataModel,
} from "./access-models";

import {
  buildClientView,
  buildDerivedModel,
  buildOperatorPacketWithTemporalMeta,
  buildReviewData,
} from "./access-builders";
import {
  buildNormalizedDates,
  confirmAllParsedDates,
  resolveAmbiguousDate,
} from "./access-date-normalization";
import {
  ACCESS_DRAFT_STORAGE_KEY,
  clearDraftFromLocalStorage,
  createInitialTemporalMeta,
  discardExpiredOrCorruptedDraft,
  hasMeaningfulDraftData,
  incrementResumeCount,
  loadDraftFromLocalStorage,
  markDateConfirmationCompleted,
  markDraftStarted,
  markRequestSubmitted,
  maybePersistDraft,
  restoreDraftToSubmissionModel,
  shouldShowDraftRestorePrompt,
  shouldWarnBeforeUnload,
} from "./access-draft";
import { buildContinueResult } from "./access-step-gates";
import type { ReviewDataModel } from "./access-models";

export interface AccessUiNoticesState {
  draftSavedVisible: boolean;
  isOffline: boolean;
  justRestored: boolean;
}

export interface AccessRestoreState {
  showRestorePrompt: boolean;
  restoreDraft: ReturnType<typeof loadDraftFromLocalStorage>["draft"];
  isRestoring: boolean;
}

export interface SubmitRequestApiResponse {
  ok: boolean;
  requestId?: string;
  submittedAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface SubmitRequestPayload {
  request: AccessSubmissionModel["formData"]["request"];
  subjectPayload: AccessSubmissionModel["formData"]["subjectPayload"];
  normalizedDates: AccessSubmissionModel["normalizedDates"]["dates"];
  derived: ReturnType<typeof buildDerivedModel>;
  requestVerification: {
    clientConfirmed: boolean;
    confirmedAt: string | null;
  };
  requestTemporalMeta: {
    accessEntryAt: string | null;
    draftStartedAt: string | null;
    dateConfirmationCompletedAt: string | null;
    requestSubmittedAt: string | null;
    accessEntrySource: AccessSubmissionModel["temporalMeta"]["access_entry_source"];
    resumeCount: number;
    draftDurationMs: number | null;
    correctionRequested: boolean;
  };
  frey_ctx?: string | null;
}

export interface AccessStateController {
  submission: AccessSubmissionModel;
  currentStep: DraftCurrentStep;
  submitAttempt: DraftSubmitAttempt;
  notices: AccessUiNoticesState;
  restore: AccessRestoreState;
  updateFormData: (updater: (prev: FormDataModel) => FormDataModel) => void;
  setCurrentStep: (step: DraftCurrentStep) => void;
  setFormState: (formState: DraftFormState) => void;
  continueFromRequest: () => ReturnType<typeof buildContinueResult>;
  continueFromDates: () => ReturnType<typeof buildContinueResult>;
  continueFromScope: () => ReturnType<typeof buildContinueResult>;
  continueDraft: () => void;
  discardDraftAndStartOver: () => void;
  resolveDateAmbiguity: (dateId: string, selectedIso: string) => void;
  confirmReview: () => void;
  revokeReviewConfirmation: () => void;
  submitRequest: () => Promise<SubmitRequestApiResponse>;
  rebuildComputedState: () => void;
  clearSubmitError: () => void;
}

export function createEmptyFormData(): FormDataModel {
  return {
    request: {
      name: "",
      email: "",
      subjectType: "",
      mainQuestion: "",
      shortDescription: "",
      preferredDepth: "",
    },
    subjectPayload: {},
    scope: {
      entitiesCount: "",
      timeScope: "",
      sourceMaterialLevel: "",
      referenceLinks: "",
    },
    consents: {
      manualReviewAccepted: false,
      reviewConfirmationAccepted: false,
    },
  };
}

export function createEmptyNormalizedDates() {
  return { dates: [] };
}

export function createEmptyReviewData(): ReviewDataModel {
  return {
    requestSummary: {
      subjectType: "",
      mainQuestion: "",
      preferredDepth: "",
    },
    verifiedDates: [],
    scopeSummary: {
      entitiesCount: "",
      timeScope: "",
      sourceMaterialLevel: "",
    },
    completenessNotes: [],
    blockingIssues: [],
    canSubmit: false,
  };
}

export function createInitialAccessSubmissionModel(
  entrySource: AccessEntrySource = "unknown",
  nowIso: string = new Date().toISOString()
): AccessSubmissionModel {
  return {
    formState: "input",
    formData: createEmptyFormData(),
    normalizedDates: createEmptyNormalizedDates(),
    reviewData: createEmptyReviewData(),
    clientView: null,
    operatorPacket: null,
    temporalMeta: createInitialTemporalMeta(entrySource, nowIso),
  };
}

export function detectAccessEntrySource(): AccessEntrySource {
  if (typeof window === "undefined") return "unknown";

  const referrer = document.referrer || "";
  const currentOrigin = window.location.origin;

  if (!referrer) return "direct";

  try {
    const url = new URL(referrer);
    if (url.origin !== currentOrigin) return "direct";

    const path = url.pathname;
    if (
      path === "/" ||
      path === "/frey" ||
      path === "/faq" ||
      path === "/reading" ||
      path === "/investors" ||
      path === "/access"
    ) {
      return path as AccessEntrySource;
    }

    return "unknown";
  } catch {
    return "unknown";
  }
}

function readFreyCtxFromLocation(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const url = new URL(window.location.href);
    const ctx = url.searchParams.get("ctx");
    if (!ctx) return null;
    const normalized = ctx.trim();
    return normalized ? normalized.slice(0, 4096) : null;
  } catch {
    return null;
  }
}

export function buildSubmitRequestPayload(
  submission: AccessSubmissionModel
): SubmitRequestPayload {
  const derived = buildDerivedModel(
    submission.formData,
    submission.normalizedDates
  );
  const freyCtx = readFreyCtxFromLocation();

  return {
    request: submission.formData.request,
    subjectPayload: submission.formData.subjectPayload,
    normalizedDates: submission.normalizedDates.dates,
    derived,
    requestVerification: {
      clientConfirmed: submission.formData.consents.reviewConfirmationAccepted,
      confirmedAt: submission.temporalMeta.date_confirmation_completed_at ?? null,
    },
    requestTemporalMeta: {
      accessEntryAt: submission.temporalMeta.access_entry_at,
      draftStartedAt: submission.temporalMeta.draft_started_at,
      dateConfirmationCompletedAt:
        submission.temporalMeta.date_confirmation_completed_at,
      requestSubmittedAt: submission.temporalMeta.request_submitted_at,
      accessEntrySource: submission.temporalMeta.access_entry_source,
      resumeCount: submission.temporalMeta.resume_count,
      draftDurationMs: submission.temporalMeta.draft_duration_ms,
      correctionRequested: submission.temporalMeta.correction_requested,
    },
    frey_ctx: freyCtx,
  };
}

export async function submitAccessRequest(
  payload: SubmitRequestPayload
): Promise<SubmitRequestApiResponse> {
  try {
    const response = await fetch("/api/access/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const maybeJson = await safeReadJson(response);

      return {
        ok: false,
        errorCode: maybeJson?.errorCode ?? "http_error",
        errorMessage: maybeJson?.errorMessage ?? "Submission failed.",
      };
    }

    const data = (await response.json()) as {
      requestId: string;
      submittedAt: string;
    };

    return {
      ok: true,
      requestId: data.requestId,
      submittedAt: data.submittedAt,
    };
  } catch {
    return {
      ok: false,
      errorCode: "network_error",
      errorMessage: "Connection issue. Please try again.",
    };
  }
}

async function safeReadJson(response: Response): Promise<any | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function useAccessStateController(): AccessStateController {
  const [submission, setSubmission] = useState<AccessSubmissionModel>(() =>
    createInitialAccessSubmissionModel("unknown")
  );

  const [currentStep, setCurrentStepState] =
    useState<DraftCurrentStep>("request");
  const [submitAttempt, setSubmitAttempt] = useState<DraftSubmitAttempt>({
    status: "idle",
    lastAttemptAt: null,
    lastErrorMessage: null,
  });

  const [restore, setRestore] = useState<AccessRestoreState>({
    showRestorePrompt: false,
    restoreDraft: null,
    isRestoring: false,
  });

  const [notices, setNotices] = useState<AccessUiNoticesState>({
    draftSavedVisible: false,
    isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
    justRestored: false,
  });

  const autosaveTimerRef = useRef<number | null>(null);
  const draftSavedTimerRef = useRef<number | null>(null);
  const networkRestoredTimerRef = useRef<number | null>(null);
  const didInitRef = useRef(false);

  const showDraftSavedNotice = useCallback(() => {
    setNotices((prev) => ({ ...prev, draftSavedVisible: true }));

    if (draftSavedTimerRef.current) {
      window.clearTimeout(draftSavedTimerRef.current);
    }

    draftSavedTimerRef.current = window.setTimeout(() => {
      setNotices((prev) => ({ ...prev, draftSavedVisible: false }));
    }, 1200);
  }, []);

  const recompute = useCallback(
    (base: AccessSubmissionModel): AccessSubmissionModel => {
      const meaningful = hasMeaningfulDraftData(base.formData);

      const nextTemporalMeta = meaningful
        ? markDraftStarted(base.temporalMeta)
        : base.temporalMeta;

      const normalizedDates = buildNormalizedDates(base.formData);
      const reviewData = buildReviewData(base.formData, normalizedDates);

      return {
        ...base,
        temporalMeta: nextTemporalMeta,
        normalizedDates,
        reviewData,
      };
    },
    []
  );

  const persistDraft = useCallback(
    (
      nextSubmission: AccessSubmissionModel,
      nextStep: DraftCurrentStep,
      nextSubmitAttempt: DraftSubmitAttempt
    ) => {
      if (!hasMeaningfulDraftData(nextSubmission.formData)) return;

      maybePersistDraft(
        nextSubmission.formState as DraftFormState,
        nextStep,
        nextSubmission.formData,
        nextSubmission.normalizedDates,
        nextSubmission.reviewData,
        nextSubmitAttempt,
        nextSubmission.temporalMeta,
        { storageKey: ACCESS_DRAFT_STORAGE_KEY }
      );

      showDraftSavedNotice();
    },
    [showDraftSavedNotice]
  );

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const entrySource = detectAccessEntrySource();
    const restoreResult = loadDraftFromLocalStorage();

    if (restoreResult.expired || restoreResult.corrupted) {
      discardExpiredOrCorruptedDraft(restoreResult);
    }

    if (shouldShowDraftRestorePrompt(restoreResult) && restoreResult.draft) {
      setRestore({
        showRestorePrompt: true,
        restoreDraft: restoreResult.draft,
        isRestoring: false,
      });
      return;
    }

    setSubmission(createInitialAccessSubmissionModel(entrySource));
    setRestore({
      showRestorePrompt: false,
      restoreDraft: null,
      isRestoring: false,
    });
  }, []);

  useEffect(() => {
    if (restore.isRestoring) return;
    if (!hasMeaningfulDraftData(submission.formData)) return;

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      persistDraft(submission, currentStep, submitAttempt);
    }, 1800);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [restore.isRestoring, submission, currentStep, submitAttempt, persistDraft]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      const draftStatus = hasMeaningfulDraftData(submission.formData)
        ? submission.reviewData.canSubmit &&
          submission.formData.consents.reviewConfirmationAccepted
          ? "reviewed_not_submitted"
          : submission.reviewData.blockingIssues.length === 0
          ? "ready_for_review"
          : "in_progress"
        : "empty";

      if (!shouldWarnBeforeUnload(submission.formData, draftStatus)) return;

      persistDraft(submission, currentStep, submitAttempt);
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [submission, currentStep, submitAttempt, persistDraft]);

  useEffect(() => {
    const onOffline = () => {
      setNotices((prev) => ({
        ...prev,
        isOffline: true,
        justRestored: false,
      }));
      persistDraft(submission, currentStep, submitAttempt);
    };

    const onOnline = () => {
      setNotices((prev) => ({
        ...prev,
        isOffline: false,
        justRestored: true,
      }));

      if (networkRestoredTimerRef.current) {
        window.clearTimeout(networkRestoredTimerRef.current);
      }

      networkRestoredTimerRef.current = window.setTimeout(() => {
        setNotices((prev) => ({ ...prev, justRestored: false }));
      }, 2500);

      persistDraft(submission, currentStep, submitAttempt);
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);

      if (networkRestoredTimerRef.current) {
        window.clearTimeout(networkRestoredTimerRef.current);
      }
    };
  }, [submission, currentStep, submitAttempt, persistDraft]);

  const updateFormData = useCallback(
    (updater: (prev: FormDataModel) => FormDataModel) => {
      setSubmission((prev) => {
        const next = {
          ...prev,
          formData: updater(prev.formData),
        };

        return recompute(next);
      });
    },
    [recompute]
  );

  const setCurrentStep = useCallback((step: DraftCurrentStep) => {
    setCurrentStepState(step);
  }, []);

  const setFormState = useCallback((formState: DraftFormState) => {
    setSubmission((prev) => ({
      ...prev,
      formState,
    }));
  }, []);

  const continueFromRequest = useCallback(() => {
    const result = buildContinueResult(
      "request",
      "dates",
      submission.formData,
      submission.normalizedDates,
      submission.reviewData
    );

    if (result.ok) {
      const nextSubmission = { ...submission, formState: result.nextFormState };
      setSubmission(nextSubmission);
      setCurrentStepState("dates");
      persistDraft(nextSubmission, "dates", submitAttempt);
    }

    return result;
  }, [submission, submitAttempt, persistDraft]);

  const continueFromDates = useCallback(() => {
    const working = recompute(submission);
    const result = buildContinueResult(
      "dates",
      "scope",
      working.formData,
      working.normalizedDates,
      working.reviewData
    );

    setSubmission(working);

    if (result.ok) {
      setCurrentStepState("scope");
      persistDraft(working, "scope", submitAttempt);
    }

    return result;
  }, [submission, submitAttempt, recompute, persistDraft]);

  const continueFromScope = useCallback(() => {
    const working = recompute(submission);
    const result = buildContinueResult(
      "scope",
      "review",
      working.formData,
      working.normalizedDates,
      working.reviewData
    );

    const nextSubmission = {
      ...working,
      formState: result.nextFormState,
    };

    setSubmission(nextSubmission);

    if (result.ok) {
      setCurrentStepState("review");
      persistDraft(nextSubmission, "review", submitAttempt);
    }

    return result;
  }, [submission, submitAttempt, recompute, persistDraft]);

  const continueDraft = useCallback(() => {
    if (!restore.restoreDraft) return;

    const restored = restoreDraftToSubmissionModel(restore.restoreDraft);

    setSubmission({
      ...restored,
      temporalMeta: incrementResumeCount(restore.restoreDraft.temporalMeta),
    });

    setCurrentStepState(restore.restoreDraft.currentStep);
    setSubmitAttempt(restore.restoreDraft.submitAttempt);

    setRestore({
      showRestorePrompt: false,
      restoreDraft: null,
      isRestoring: false,
    });
  }, [restore]);

  const discardDraftAndStartOver = useCallback(() => {
    clearDraftFromLocalStorage();

    setSubmission(createInitialAccessSubmissionModel(detectAccessEntrySource()));
    setCurrentStepState("request");
    setSubmitAttempt({
      status: "idle",
      lastAttemptAt: null,
      lastErrorMessage: null,
    });

    setRestore({
      showRestorePrompt: false,
      restoreDraft: null,
      isRestoring: false,
    });
  }, []);

  const resolveDateAmbiguityAction = useCallback(
    (dateId: string, selectedIso: string) => {
      setSubmission((prev) => {
        const nextNormalizedDates = resolveAmbiguousDate(
          prev.normalizedDates,
          dateId,
          selectedIso
        );

        const nextReviewData = buildReviewData(prev.formData, nextNormalizedDates);

        return {
          ...prev,
          formState: "input",
          normalizedDates: nextNormalizedDates,
          reviewData: nextReviewData,
        };
      });
    },
    []
  );

  const confirmReview = useCallback(() => {
    setSubmission((prev) => {
      const confirmedDates = confirmAllParsedDates(prev.normalizedDates);

      const nextFormData: FormDataModel = {
        ...prev.formData,
        consents: {
          ...prev.formData.consents,
          reviewConfirmationAccepted: true,
        },
      };

      const nextTemporalMeta = markDateConfirmationCompleted(prev.temporalMeta);
      const nextReviewData = buildReviewData(nextFormData, confirmedDates);

      return {
        ...prev,
        formState: "review",
        formData: nextFormData,
        normalizedDates: confirmedDates,
        reviewData: nextReviewData,
        temporalMeta: nextTemporalMeta,
      };
    });

    setCurrentStepState("review");
  }, []);

  const revokeReviewConfirmation = useCallback(() => {
    setSubmission((prev) => {
      const nextFormData: FormDataModel = {
        ...prev.formData,
        consents: {
          ...prev.formData.consents,
          reviewConfirmationAccepted: false,
        },
      };

      const nextNormalizedDates: typeof prev.normalizedDates = {
        dates: prev.normalizedDates.dates.map(
          (d): (typeof prev.normalizedDates.dates)[number] =>
            d.status === "confirmed"
              ? { ...d, status: "parsed", confirmed: false }
              : d
        ),
      };

      return {
        ...prev,
        formData: nextFormData,
        normalizedDates: nextNormalizedDates,
        reviewData: buildReviewData(nextFormData, nextNormalizedDates),
      };
    });
  }, []);

  const clearSubmitError = useCallback(() => {
    setSubmitAttempt({
      status: "idle",
      lastAttemptAt: null,
      lastErrorMessage: null,
    });
  }, []);

  const submitRequest = useCallback(async (): Promise<SubmitRequestApiResponse> => {
    const working = recompute(submission);
    const reviewData = buildReviewData(working.formData, working.normalizedDates);

    if (!reviewData.canSubmit) {
      const errorMessage =
        reviewData.blockingIssues[0] ?? "Request is not ready for submission.";

      const failedAttempt: DraftSubmitAttempt = {
        status: "failed",
        lastAttemptAt: new Date().toISOString(),
        lastErrorMessage: errorMessage,
      };

      setSubmitAttempt(failedAttempt);
      persistDraft(working, "review", failedAttempt);

      return {
        ok: false,
        errorCode: "review_incomplete",
        errorMessage,
      };
    }

    const submittingAttempt: DraftSubmitAttempt = {
      status: "submitting",
      lastAttemptAt: new Date().toISOString(),
      lastErrorMessage: null,
    };

    setSubmission(working);
    setSubmitAttempt(submittingAttempt);
    persistDraft(working, "review", submittingAttempt);

    const payload = buildSubmitRequestPayload(working);
    const result = await submitAccessRequest(payload);

    if (!result.ok) {
      const failedAttempt: DraftSubmitAttempt = {
        status: "failed",
        lastAttemptAt: new Date().toISOString(),
        lastErrorMessage: result.errorMessage ?? "Submission failed.",
      };

      setSubmitAttempt(failedAttempt);
      persistDraft(working, "review", failedAttempt);

      return result;
    }

    const finalSubmittedAt = result.submittedAt ?? new Date().toISOString();

    setSubmission((prev) => {
      const nextTemporalMeta = markRequestSubmitted(
        prev.temporalMeta,
        finalSubmittedAt
      );
      const derived = buildDerivedModel(prev.formData, prev.normalizedDates);

      return {
        ...prev,
        formState: "success",
        clientView: buildClientView(
          result.requestId as string,
          finalSubmittedAt,
          prev.formData,
          prev.normalizedDates
        ),
        operatorPacket: buildOperatorPacketWithTemporalMeta(
          result.requestId as string,
          finalSubmittedAt,
          prev.formData,
          prev.normalizedDates,
          derived,
          null,
          nextTemporalMeta
        ),
        temporalMeta: nextTemporalMeta,
      };
    });

    setSubmitAttempt({
      status: "idle",
      lastAttemptAt: null,
      lastErrorMessage: null,
    });

    clearDraftFromLocalStorage();

    return result;
  }, [submission, recompute, persistDraft]);

  const rebuildComputedState = useCallback(() => {
    setSubmission((prev) => recompute(prev));
  }, [recompute]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
      if (draftSavedTimerRef.current) {
        window.clearTimeout(draftSavedTimerRef.current);
      }
      if (networkRestoredTimerRef.current) {
        window.clearTimeout(networkRestoredTimerRef.current);
      }
    };
  }, []);

  return {
    submission,
    currentStep,
    submitAttempt,
    notices,
    restore,
    updateFormData,
    setCurrentStep,
    setFormState,
    continueFromRequest,
    continueFromDates,
    continueFromScope,
    continueDraft,
    discardDraftAndStartOver,
    resolveDateAmbiguity: resolveDateAmbiguityAction,
    confirmReview,
    revokeReviewConfirmation,
    submitRequest,
    rebuildComputedState,
    clearSubmitError,
  };
}
