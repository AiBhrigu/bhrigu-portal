import type {
  AccessTemporalMeta,
  AnchorIntegrity,
  DerivedModel,
  EntitiesCount,
  FormDataModel,
  FreyReport,
  FreyReportReady,
  LikelyLevel,
  NormalizedDatesModel,
  OperatorPacketModel,
  OperatorSummary,
  PersonSubjectPayload,
  PreferredDepth,
  RelationshipSubjectPayload,
  RequestTemporalMeta,
  ReviewDataModel,
  SourceMaterialLevel,
  SubjectType,
  TimeScope,
} from "./access-models";

export function buildReviewData(
  formData: FormDataModel,
  normalizedDates: NormalizedDatesModel
): ReviewDataModel {
  const completenessNotes: string[] = [];
  const blockingIssues: string[] = [];

  for (const date of normalizedDates.dates) {
    if (date.required && date.status === "empty") {
      blockingIssues.push(`${date.label} is required.`);
    }

    if (date.required && date.status === "ambiguous") {
      blockingIssues.push(`${date.label} requires confirmation.`);
    }
  }

  const subjectType = formData.request.subjectType;

  if (subjectType === "Person") {
    const p = formData.subjectPayload as PersonSubjectPayload;
    if (!p.birthTimeRaw?.trim()) completenessNotes.push("Birth time not provided");
    if (!p.birthPlaceRaw?.trim()) completenessNotes.push("Birth place not provided");
  }

  if (subjectType === "Relationship") {
    const p = formData.subjectPayload as RelationshipSubjectPayload;
    if (!p.personA.birthTimeRaw?.trim()) {
      completenessNotes.push("Person A birth time not provided");
    }
    if (!p.personA.birthPlaceRaw?.trim()) {
      completenessNotes.push("Person A birth place not provided");
    }
    if (!p.personB.birthTimeRaw?.trim()) {
      completenessNotes.push("Person B birth time not provided");
    }
    if (!p.personB.birthPlaceRaw?.trim()) {
      completenessNotes.push("Person B birth place not provided");
    }
    if (!p.relationshipStartDateRaw?.trim()) {
      completenessNotes.push("Relationship start date not provided");
    }
  }

  if (subjectType === "Project") {
    const p = formData.subjectPayload as { milestoneDateRaw?: string };
    if (!p.milestoneDateRaw?.trim()) {
      completenessNotes.push("Key milestone date not provided");
    }
  }

  if (subjectType === "Business / Organization") {
    const p = formData.subjectPayload as { keyEventDateRaw?: string };
    if (!p.keyEventDateRaw?.trim()) {
      completenessNotes.push("Key event date not provided");
    }
  }

  if (subjectType === "Event / Period") {
    const p = formData.subjectPayload as {
      eventDateRaw?: string;
      periodEndRaw?: string;
    };
    if (!p.eventDateRaw?.trim()) {
      completenessNotes.push("Event date not provided");
    }
    if (!p.periodEndRaw?.trim()) {
      completenessNotes.push("Period end not provided");
    }
  }

  if (!formData.scope.referenceLinks?.trim()) {
    completenessNotes.push("No reference links or materials attached");
  }

  const hasUnconfirmedParsedDates = normalizedDates.dates.some(
    (d) => d.status === "parsed" && !d.confirmed
  );

  if (
    hasUnconfirmedParsedDates &&
    !formData.consents.reviewConfirmationAccepted
  ) {
    blockingIssues.push("Request details must be confirmed before submission.");
  }

  const canSubmit =
    blockingIssues.length === 0 &&
    formData.consents.reviewConfirmationAccepted === true;

  return {
    requestSummary: {
      subjectType: formData.request.subjectType,
      mainQuestion: formData.request.mainQuestion,
      preferredDepth: formData.request.preferredDepth,
    },
    verifiedDates: normalizedDates.dates.map((d) => ({
      label: d.label,
      human: d.human,
      iso: d.iso,
      status: d.status,
    })),
    scopeSummary: {
      entitiesCount: formData.scope.entitiesCount,
      timeScope: formData.scope.timeScope,
      sourceMaterialLevel: formData.scope.sourceMaterialLevel,
    },
    completenessNotes: uniqueStrings(completenessNotes),
    blockingIssues: uniqueStrings(blockingIssues),
    canSubmit,
  };
}

export function buildDerivedModel(
  formData: FormDataModel,
  normalizedDates: NormalizedDatesModel
): DerivedModel {
  const criticalMissingFields: string[] = [];
  const escalationReasons: string[] = [];

  const score = {
    subjectType: scoreSubjectType(formData.request.subjectType),
    entities: scoreEntities(formData.scope.entitiesCount),
    timeScope: scoreTimeScope(formData.scope.timeScope),
    sourceMaterial: scoreSourceMaterial(formData.scope.sourceMaterialLevel),
    preferredDepth: scorePreferredDepth(formData.request.preferredDepth),
    clarity: scoreQuestionClarity(
      formData.request.mainQuestion,
      formData.request.shortDescription
    ),
    anchors: 0,
    customFlags: 0,
  };

  for (const d of normalizedDates.dates) {
    if (d.required && d.status === "empty") {
      score.anchors += 3;
      criticalMissingFields.push(d.role);
    }

    if (d.required && d.status === "ambiguous") {
      score.anchors += 3;
      criticalMissingFields.push(`${d.role}_ambiguous`);
    }
  }

  const customFlags = detectCustomFlags(formData, normalizedDates);
  score.customFlags = Math.min(customFlags.length * 2, 6);
  escalationReasons.push(...customFlags);

  const total =
    score.subjectType +
    score.entities +
    score.timeScope +
    score.sourceMaterial +
    score.preferredDepth +
    score.clarity +
    score.anchors +
    score.customFlags;

  let likelyLevel: LikelyLevel = "Level I";

  if (total >= 13) {
    likelyLevel = "Level III";
  } else if (total >= 6) {
    likelyLevel = "Level II";
  }

  if (customFlags.includes("three_or_more_entities")) {
    likelyLevel = "Level III";
  }

  if (customFlags.includes("explicit_custom_request")) {
    likelyLevel = "Level III";
  }

  if (criticalMissingFields.length > 1) {
    likelyLevel = "Manual classification required";
  }

  const requiredCount = normalizedDates.dates.filter((d) => d.required).length;

  const anchorIntegrity: AnchorIntegrity =
    criticalMissingFields.length === 0
      ? "complete"
      : criticalMissingFields.length === requiredCount && requiredCount > 0
      ? "insufficient"
      : "partial";

  return {
    anchorIntegrity,
    criticalMissingFields,
    entitiesCount: formData.scope.entitiesCount,
    timeScope: formData.scope.timeScope,
    sourceMaterialLevel: formData.scope.sourceMaterialLevel,
    likelyLevel,
    manualEscalation: customFlags.length > 0 || criticalMissingFields.length > 0,
    manualEscalationReasons: uniqueStrings(escalationReasons),
  };
}

export function buildClientView(
  requestId: string,
  submittedAt: string,
  formData: FormDataModel,
  normalizedDates: NormalizedDatesModel
) {
  return {
    requestId,
    status: "pending_manual_review" as const,
    submittedAt,
    subjectType: formData.request.subjectType,
    mainQuestion: formData.request.mainQuestion,
    preferredDepth: formData.request.preferredDepth,
    submittedDates: normalizedDates.dates
      .filter((d) => d.iso && d.human)
      .map((d) => ({
        label: d.label,
        human: d.human as string,
        iso: d.iso as string,
      })),
    nextSteps: [
      "Manual review",
      "Analytical level assigned",
      "Scope and price confirmed",
      "Payment",
      "Processing begins",
    ],
    correctionWindow: {
      status: "open" as const,
      method: "reply_to_email" as const,
      until: "processing_start" as const,
    },
  };
}

export function buildRequestTemporalMeta(
  temporalMeta: AccessTemporalMeta
): RequestTemporalMeta {
  return {
    accessEntryAt: temporalMeta.access_entry_at,
    draftStartedAt: temporalMeta.draft_started_at,
    dateConfirmationCompletedAt: temporalMeta.date_confirmation_completed_at,
    requestSubmittedAt: temporalMeta.request_submitted_at,
    accessEntrySource: temporalMeta.access_entry_source,
    resumeCount: temporalMeta.resume_count,
    draftDurationMs: temporalMeta.draft_duration_ms,
    correctionRequested: temporalMeta.correction_requested,
  };
}

export function buildOperatorPacketWithTemporalMeta(
  requestId: string,
  submittedAt: string,
  formData: FormDataModel,
  normalizedDates: NormalizedDatesModel,
  derived: DerivedModel,
  freyReport: FreyReport,
  temporalMeta: AccessTemporalMeta
): OperatorPacketModel {
  return {
    requestMeta: {
      requestId,
      submittedAt,
      subjectType: formData.request.subjectType,
      manualReviewRequired: true,
    },
    requestTemporalMeta: buildRequestTemporalMeta(temporalMeta),
    request: formData.request,
    subjectPayload: formData.subjectPayload,
    normalizedDates: normalizedDates.dates,
    derived,
    freyReport,
    operatorSummary: buildOperatorSummary(
      formData,
      normalizedDates,
      derived,
      freyReport
    ),
    requestVerification: {
      clientConfirmed: formData.consents.reviewConfirmationAccepted,
      confirmedAt: formData.consents.reviewConfirmationAccepted
        ? temporalMeta.date_confirmation_completed_at ?? submittedAt
        : null,
    },
    correctionWindow: {
      status: "open",
      locksOn: "processing_start",
    },
  };
}

export function buildOperatorSummary(
  formData: FormDataModel,
  normalizedDates: NormalizedDatesModel,
  derived: DerivedModel,
  freyReport: FreyReport
): OperatorSummary {
  const confirmedOrParsed = normalizedDates.dates.filter((d) => d.iso);
  const primaryAnchor = confirmedOrParsed.length
    ? confirmedOrParsed.map((d) => d.iso).join(" + ")
    : "No valid anchor";

  let signalState = "precompute not available";
  if (freyReport?.status === "ready") {
    signalState = summarizeFreySignal(freyReport);
  } else {
    signalState = summarizeRequestSignal(formData.request.preferredDepth, derived);
  }

  const reviewReadiness =
    derived.anchorIntegrity === "complete"
      ? "ready for scoped review"
      : derived.anchorIntegrity === "partial"
      ? "usable with partial anchors"
      : "insufficient anchor integrity";

  return {
    primaryAnchor,
    signalState,
    reviewReadiness,
  };
}

function summarizeRequestSignal(
  preferredDepth: PreferredDepth | "",
  derived: DerivedModel
): string {
  const level = derived.likelyLevel;
  const depth = preferredDepth || "Not sure";

  if (level === "Level III") {
    return `custom review / ${depth.toLowerCase()}`;
  }

  if (level === "Level II") {
    return `deeper phase review / ${depth.toLowerCase()}`;
  }

  return `structured snapshot / ${depth.toLowerCase()}`;
}

function summarizeFreySignal(report: FreyReportReady): string {
  const density =
    report.phase_density >= 0.75
      ? "high density"
      : report.phase_density >= 0.45
      ? "medium density"
      : "low density";

  const tension =
    report.harmonic_tension >= 0.75
      ? "high tension"
      : report.harmonic_tension >= 0.45
      ? "medium tension"
      : "low tension";

  const resonance =
    report.resonance_level >= 0.75
      ? "high resonance"
      : report.resonance_level >= 0.45
      ? "medium resonance"
      : "low resonance";

  return `${density} / ${tension} / ${resonance}`;
}

function scoreSubjectType(subjectType: SubjectType | ""): number {
  switch (subjectType) {
    case "Person":
    case "Event / Period":
      return 0;
    case "Relationship":
    case "Project":
      return 1;
    case "Business / Organization":
      return 2;
    case "Mixed / Not sure":
      return 3;
    default:
      return 2;
  }
}

function scoreEntities(entities: EntitiesCount | ""): number {
  switch (entities) {
    case "1":
      return 0;
    case "2":
      return 2;
    case "3+":
      return 4;
    case "Not sure":
      return 3;
    default:
      return 1;
  }
}

function scoreTimeScope(scope: TimeScope | ""): number {
  switch (scope) {
    case "One date / one point":
      return 0;
    case "Short period":
      return 1;
    case "Several phases":
      return 3;
    case "Extended / unclear":
      return 4;
    default:
      return 1;
  }
}

function scoreSourceMaterial(level: SourceMaterialLevel | ""): number {
  switch (level) {
    case "None":
      return 0;
    case "Short notes":
      return 1;
    case "Documents / links":
      return 2;
    case "Multiple materials":
      return 4;
    default:
      return 1;
  }
}

function scorePreferredDepth(depth: PreferredDepth | ""): number {
  switch (depth) {
    case "Structured Snapshot":
      return 0;
    case "Deep Phase Analysis":
      return 2;
    case "Custom Analytical Work":
      return 4;
    case "Not sure":
      return 1;
    default:
      return 1;
  }
}

function scoreQuestionClarity(
  mainQuestion: string,
  shortDescription: string
): number {
  const q = `${mainQuestion} ${shortDescription}`.trim();

  if (!q) return 4;
  if (q.length < 20) return 2;
  if (/[?]/.test(mainQuestion) && shortDescription.length > 20) return 0;
  return 1;
}

function detectCustomFlags(
  formData: FormDataModel,
  normalizedDates: NormalizedDatesModel
): string[] {
  const flags: string[] = [];

  if (formData.scope.entitiesCount === "3+") {
    flags.push("three_or_more_entities");
  }

  if (formData.request.subjectType === "Mixed / Not sure") {
    flags.push("mixed_subject_type");
  }

  if (formData.request.preferredDepth === "Custom Analytical Work") {
    flags.push("explicit_custom_request");
  }

  if (formData.scope.sourceMaterialLevel === "Multiple materials") {
    flags.push("multiple_materials");
  }

  if (formData.scope.timeScope === "Extended / unclear") {
    flags.push("extended_time_scope");
  }

  if (
    normalizedDates.dates.filter(
      (d) => d.required && d.status !== "confirmed" && d.status !== "parsed"
    ).length > 0
  ) {
    flags.push("incomplete_critical_anchors");
  }

  return uniqueStrings(flags);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
