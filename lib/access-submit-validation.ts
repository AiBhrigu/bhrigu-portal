import type {
  AccessEntrySource,
  AccessSubmitRequestBodyV1,
  AccessSubmitValidationFailure,
  AccessSubmitValidationResult,
  AnchorIntegrity,
  ClientStatus,
  DateRole,
  DateStatus,
  DerivedModel,
  EntitiesCount,
  FreyReport,
  FreyReportReady,
  LikelyLevel,
  NormalizedDateEntry,
  OperatorPacketModel,
  OperatorSummary,
  PreferredDepth,
  RequestFields,
  RequestTemporalMeta,
  SourceMaterialLevel,
  StoredAccessSubmissionV1,
  SubjectPayload,
  SubjectType,
  TimeScope,
  MixedSubjectPayload,
} from "./access-models";

export interface AccessSubmitValidationSuccess {
  ok: true;
  data: AccessSubmitRequestBodyV1;
}

export function validateAccessSubmitPayload(
  body: unknown
): AccessSubmitValidationResult {
  if (!body || typeof body !== "object") {
    return fail("invalid_payload", "Invalid request payload.");
  }

  const candidate = body as Partial<AccessSubmitRequestBodyV1>;

  if (!candidate.request || typeof candidate.request !== "object") {
    return fail("invalid_payload", "Request block is missing.");
  }

  if (!candidate.requestVerification || typeof candidate.requestVerification !== "object") {
    return fail("invalid_payload", "Request verification block is missing.");
  }

  if (!candidate.requestTemporalMeta || typeof candidate.requestTemporalMeta !== "object") {
    return fail("invalid_payload", "Request temporal metadata is missing.");
  }

  if (!Array.isArray(candidate.normalizedDates)) {
    return fail("invalid_payload", "Normalized dates block is missing.");
  }

  const request: RequestFields = {
    name: sanitizeText(candidate.request.name, 120),
    email: sanitizeEmail(candidate.request.email),
    subjectType: sanitizeSubjectType(candidate.request.subjectType),
    mainQuestion: sanitizeText(candidate.request.mainQuestion, 240),
    shortDescription: sanitizeText(candidate.request.shortDescription, 4000),
    preferredDepth: sanitizePreferredDepth(candidate.request.preferredDepth),
  };

  if (!request.name) return fail("missing_required_field", "Name is required.");
  if (!request.email) return fail("missing_required_field", "Email is required.");
  if (!isValidEmail(request.email)) return fail("invalid_email", "A valid email address is required.");
  if (!request.subjectType) return fail("missing_required_field", "Subject type is required.");
  if (!isValidSubjectType(request.subjectType)) return fail("invalid_subject_type", "Invalid subject type.");
  if (!request.mainQuestion) return fail("missing_required_field", "Main question is required.");
  if (!request.shortDescription) return fail("missing_required_field", "Short description is required.");
  if (!request.preferredDepth) return fail("missing_required_field", "Preferred depth is required.");

  const requestVerification = {
    clientConfirmed: Boolean(candidate.requestVerification.clientConfirmed),
    confirmedAt: candidate.requestVerification.confirmedAt ?? null,
  };

  if (!requestVerification.clientConfirmed) {
    return fail("verification_required", "Request review confirmation is required before submission.");
  }

  const normalizedDates = sanitizeNormalizedDates(candidate.normalizedDates);
  const unresolvedCriticalAmbiguity = normalizedDates.find(
    (d) => d.required && d.status === "ambiguous"
  );

  if (unresolvedCriticalAmbiguity) {
    return fail(
      "ambiguous_date_unresolved",
      `${unresolvedCriticalAmbiguity.label} requires confirmation before submission.`
    );
  }

  const criticalDateCheck = validateCriticalDatesBySubjectType(
    request.subjectType,
    normalizedDates,
    candidate.subjectPayload
  );
  if (!criticalDateCheck.ok) return criticalDateCheck;

  const requestTemporalMeta = sanitizeRequestTemporalMeta(candidate.requestTemporalMeta);
  const subjectPayload = sanitizeSubjectPayload(request.subjectType, candidate.subjectPayload);
  const derived = sanitizeDerivedModel(candidate.derived);

  return {
    ok: true,
    data: {
      request,
      subjectPayload,
      normalizedDates,
      derived,
      requestVerification,
      requestTemporalMeta,
    },
  };
}

function validateCriticalDatesBySubjectType(
  subjectType: SubjectType,
  normalizedDates: NormalizedDateEntry[],
  subjectPayload: unknown
): AccessSubmitValidationResult {
  const hasConfirmedRole = (role: DateRole) =>
    normalizedDates.some(
      (d) => d.role === role && d.required && d.status === "confirmed" && Boolean(d.iso)
    );

  if (subjectType === "Person" && !hasConfirmedRole("birth_date")) {
    return fail("critical_date_missing", "A confirmed date of birth is required.");
  }

  if (subjectType === "Relationship" && (!hasConfirmedRole("person_a_birth_date") || !hasConfirmedRole("person_b_birth_date"))) {
    return fail("critical_date_missing", "Confirmed birth dates for both people are required.");
  }

  if (subjectType === "Project" && !hasConfirmedRole("project_start_date")) {
    return fail("critical_date_missing", "A confirmed project start date is required.");
  }

  if (subjectType === "Business / Organization" && !hasConfirmedRole("registration_date")) {
    return fail("critical_date_missing", "A confirmed registration or start date is required.");
  }

  if (subjectType === "Event / Period" && !hasConfirmedRole("period_start")) {
    return fail("critical_date_missing", "A confirmed period start is required.");
  }

  if (subjectType === "Mixed / Not sure") {
    const payload = (subjectPayload ?? {}) as Partial<MixedSubjectPayload>;
    const hasKnownDates = Boolean(payload.knownDatesRaw?.trim());
    const hasNormalized = normalizedDates.length > 0;
    if (!hasKnownDates && !hasNormalized) {
      return fail("critical_date_missing", "This request needs at least one known date or enough structured framing.");
    }
  }

  return { ok: true, data: {} as AccessSubmitRequestBodyV1 };
}

export function generateAccessRequestId(now: Date = new Date()): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const suffix = randomBase36(4).toUpperCase();
  return `BRG-${yyyy}${mm}${dd}-${suffix}`;
}

export function buildCanonicalClientView(
  requestId: string,
  submittedAt: string,
  data: AccessSubmitRequestBodyV1
) {
  return {
    requestId,
    status: "pending_manual_review" as const,
    submittedAt,
    subjectType: data.request.subjectType,
    mainQuestion: data.request.mainQuestion,
    preferredDepth: data.request.preferredDepth,
    submittedDates: data.normalizedDates
      .filter((d) => Boolean(d.iso) && Boolean(d.human))
      .map((d) => ({ label: d.label, human: d.human as string, iso: d.iso as string })),
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

export function buildCanonicalOperatorPacket(
  requestId: string,
  submittedAt: string,
  data: AccessSubmitRequestBodyV1
): OperatorPacketModel {
  const canonicalTemporalMeta = withCanonicalSubmittedAt(data.requestTemporalMeta, submittedAt);
  const freyReport: FreyReport = null;

  return {
    requestMeta: {
      requestId,
      submittedAt,
      subjectType: data.request.subjectType,
      manualReviewRequired: true,
    },
    requestTemporalMeta: canonicalTemporalMeta,
    request: data.request,
    subjectPayload: data.subjectPayload,
    normalizedDates: data.normalizedDates,
    derived: data.derived,
    freyReport,
    operatorSummary: buildCanonicalOperatorSummary(data.request, data.normalizedDates, data.derived, freyReport),
    requestVerification: {
      clientConfirmed: true,
      confirmedAt: data.requestVerification.confirmedAt ?? submittedAt,
    },
    correctionWindow: {
      status: "open",
      locksOn: "processing_start",
    },
  };
}

export function buildStoredAccessSubmissionRecord(
  requestId: string,
  submittedAt: string,
  data: AccessSubmitRequestBodyV1
): StoredAccessSubmissionV1 {
  const clientView = buildCanonicalClientView(requestId, submittedAt, data);
  const operatorPacket = buildCanonicalOperatorPacket(requestId, submittedAt, data);

  return {
    requestId,
    createdAt: submittedAt,
    updatedAt: submittedAt,
    status: "pending_manual_review",
    request: data.request,
    subjectPayload: data.subjectPayload,
    normalizedDates: data.normalizedDates,
    derived: data.derived,
    requestVerification: {
      clientConfirmed: true,
      confirmedAt: data.requestVerification.confirmedAt ?? submittedAt,
    },
    requestTemporalMeta: withCanonicalSubmittedAt(data.requestTemporalMeta, submittedAt),
    clientView,
    operatorPacket,
    submissionSource: {
      endpoint: "/api/access/submit",
      version: "v1",
    },
  };
}

function buildCanonicalOperatorSummary(
  request: RequestFields,
  normalizedDates: NormalizedDateEntry[],
  derived: DerivedModel,
  freyReport: FreyReport
): OperatorSummary {
  const anchors = normalizedDates.filter((d) => Boolean(d.iso)).map((d) => d.iso as string);
  const primaryAnchor = anchors.length > 0 ? anchors.join(" + ") : "No valid anchor";
  const signalState = freyReport?.status === "ready" ? summarizeFreySignal(freyReport) : summarizeRequestSignal(request, derived);
  const reviewReadiness =
    derived.anchorIntegrity === "complete"
      ? "ready for scoped review"
      : derived.anchorIntegrity === "partial"
      ? "usable with partial anchors"
      : "insufficient anchor integrity";

  return { primaryAnchor, signalState, reviewReadiness };
}

function summarizeRequestSignal(request: RequestFields, derived: DerivedModel): string {
  const level = derived.likelyLevel;
  const depth = request.preferredDepth || "Not sure";
  if (level === "Level III") return `custom review / ${depth.toLowerCase()}`;
  if (level === "Level II") return `deeper phase review / ${depth.toLowerCase()}`;
  return `structured snapshot / ${depth.toLowerCase()}`;
}

function summarizeFreySignal(report: FreyReportReady): string {
  const density = report.phase_density >= 0.75 ? "high density" : report.phase_density >= 0.45 ? "medium density" : "low density";
  const tension = report.harmonic_tension >= 0.75 ? "high tension" : report.harmonic_tension >= 0.45 ? "medium tension" : "low tension";
  const resonance = report.resonance_level >= 0.75 ? "high resonance" : report.resonance_level >= 0.45 ? "medium resonance" : "low resonance";
  return `${density} / ${tension} / ${resonance}`;
}

function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function sanitizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().slice(0, 254);
}

function sanitizeSubjectType(value: unknown): SubjectType | "" {
  return isValidSubjectType(value) ? value : "";
}

function sanitizePreferredDepth(value: unknown): PreferredDepth | "" {
  return isValidPreferredDepth(value) ? value : "";
}

function sanitizeNormalizedDates(input: unknown[]): NormalizedDateEntry[] {
  return input
    .filter((item) => item && typeof item === "object")
    .map((item) => sanitizeNormalizedDateEntry(item as Partial<NormalizedDateEntry>))
    .filter(Boolean) as NormalizedDateEntry[];
}

function sanitizeNormalizedDateEntry(item: Partial<NormalizedDateEntry>): NormalizedDateEntry | null {
  const status: DateStatus = isValidDateStatus(item.status) ? item.status : "empty";
  const role: DateRole | null = isValidDateRole(item.role) ? item.role : null;
  if (!role) return null;

  return {
    id: sanitizeText(item.id, 120),
    role,
    label: sanitizeText(item.label, 120),
    raw: typeof item.raw === "string" ? item.raw.trim().slice(0, 120) : null,
    iso: isIsoDate(item.iso) ? item.iso : null,
    human: typeof item.human === "string" ? item.human.trim().slice(0, 120) : null,
    status,
    required: Boolean(item.required),
    confirmed: Boolean(item.confirmed),
    ambiguousCandidates: Array.isArray(item.ambiguousCandidates)
      ? item.ambiguousCandidates
          .filter((c) => c && typeof c === "object")
          .map((c) => ({
            iso: isIsoDate((c as any).iso) ? (c as any).iso : "",
            human: sanitizeText((c as any).human, 120),
          }))
          .filter((c) => Boolean(c.iso) && Boolean(c.human))
      : [],
  };
}

function sanitizeDerivedModel(input: unknown): DerivedModel {
  const fallback: DerivedModel = {
    anchorIntegrity: "partial",
    criticalMissingFields: [],
    entitiesCount: "",
    timeScope: "",
    sourceMaterialLevel: "",
    likelyLevel: "Manual classification required",
    manualEscalation: true,
    manualEscalationReasons: [],
  };

  if (!input || typeof input !== "object") return fallback;
  const d = input as Partial<DerivedModel>;

  return {
    anchorIntegrity: isValidAnchorIntegrity(d.anchorIntegrity) ? d.anchorIntegrity : fallback.anchorIntegrity,
    criticalMissingFields: Array.isArray(d.criticalMissingFields)
      ? d.criticalMissingFields.filter((v) => typeof v === "string").map((v) => sanitizeText(v, 80))
      : [],
    entitiesCount: isValidEntitiesCount(d.entitiesCount) ? d.entitiesCount : "",
    timeScope: isValidTimeScope(d.timeScope) ? d.timeScope : "",
    sourceMaterialLevel: isValidSourceMaterialLevel(d.sourceMaterialLevel) ? d.sourceMaterialLevel : "",
    likelyLevel: isValidLikelyLevel(d.likelyLevel) ? d.likelyLevel : fallback.likelyLevel,
    manualEscalation: Boolean(d.manualEscalation),
    manualEscalationReasons: Array.isArray(d.manualEscalationReasons)
      ? d.manualEscalationReasons.filter((v) => typeof v === "string").map((v) => sanitizeText(v, 120))
      : [],
  };
}

function sanitizeRequestTemporalMeta(input: unknown) {
  const meta = (input ?? {}) as Partial<AccessSubmitRequestBodyV1["requestTemporalMeta"]>;

  return {
    accessEntryAt: isIsoDateTime(meta.accessEntryAt) ? meta.accessEntryAt : null,
    draftStartedAt: isIsoDateTime(meta.draftStartedAt) ? meta.draftStartedAt : null,
    dateConfirmationCompletedAt: isIsoDateTime(meta.dateConfirmationCompletedAt) ? meta.dateConfirmationCompletedAt : null,
    requestSubmittedAt: null,
    accessEntrySource: isValidAccessEntrySource(meta.accessEntrySource) ? meta.accessEntrySource : "unknown",
    resumeCount: isNonNegativeInteger(meta.resumeCount) ? meta.resumeCount : 0,
    draftDurationMs: isNonNegativeInteger(meta.draftDurationMs) ? meta.draftDurationMs : null,
    correctionRequested: Boolean(meta.correctionRequested),
  };
}

function sanitizeSubjectPayload(subjectType: SubjectType, payload: unknown): SubjectPayload {
  const p = (payload ?? {}) as Record<string, any>;

  if (subjectType === "Person") {
    return {
      fullNameOrIdentifier: sanitizeText(p.fullNameOrIdentifier, 120),
      birthDateRaw: sanitizeText(p.birthDateRaw, 120),
      birthTimeRaw: sanitizeText(p.birthTimeRaw, 80),
      birthPlaceRaw: sanitizeText(p.birthPlaceRaw, 120),
    };
  }

  if (subjectType === "Relationship") {
    return {
      personA: {
        name: sanitizeText(p.personA?.name, 120),
        birthDateRaw: sanitizeText(p.personA?.birthDateRaw, 120),
        birthTimeRaw: sanitizeText(p.personA?.birthTimeRaw, 80),
        birthPlaceRaw: sanitizeText(p.personA?.birthPlaceRaw, 120),
      },
      personB: {
        name: sanitizeText(p.personB?.name, 120),
        birthDateRaw: sanitizeText(p.personB?.birthDateRaw, 120),
        birthTimeRaw: sanitizeText(p.personB?.birthTimeRaw, 80),
        birthPlaceRaw: sanitizeText(p.personB?.birthPlaceRaw, 120),
      },
      relationshipStartDateRaw: sanitizeText(p.relationshipStartDateRaw, 120),
    };
  }

  if (subjectType === "Project") {
    return {
      projectName: sanitizeText(p.projectName, 160),
      startDateRaw: sanitizeText(p.startDateRaw, 120),
      milestoneDateRaw: sanitizeText(p.milestoneDateRaw, 120),
    };
  }

  if (subjectType === "Business / Organization") {
    return {
      organizationName: sanitizeText(p.organizationName, 160),
      registrationOrStartDateRaw: sanitizeText(p.registrationOrStartDateRaw, 120),
      keyEventDateRaw: sanitizeText(p.keyEventDateRaw, 120),
    };
  }

  if (subjectType === "Event / Period") {
    return {
      eventTitle: sanitizeText(p.eventTitle, 160),
      eventDateRaw: sanitizeText(p.eventDateRaw, 120),
      periodStartRaw: sanitizeText(p.periodStartRaw, 120),
      periodEndRaw: sanitizeText(p.periodEndRaw, 120),
    };
  }

  if (subjectType === "Mixed / Not sure") {
    return {
      primarySubject: sanitizeText(p.primarySubject, 160),
      knownDatesRaw: sanitizeText(p.knownDatesRaw, 800),
    };
  }

  return {};
}

function withCanonicalSubmittedAt(meta: AccessSubmitRequestBodyV1["requestTemporalMeta"], submittedAt: string) {
  return {
    ...meta,
    requestSubmittedAt: submittedAt,
    draftDurationMs:
      meta.draftStartedAt && isIsoDateTime(meta.draftStartedAt)
        ? Math.max(0, new Date(submittedAt).getTime() - new Date(meta.draftStartedAt).getTime())
        : meta.draftDurationMs ?? null,
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidSubjectType(value: unknown): value is SubjectType {
  return value === "Person" || value === "Relationship" || value === "Project" || value === "Business / Organization" || value === "Event / Period" || value === "Mixed / Not sure";
}

function isValidPreferredDepth(value: unknown): value is PreferredDepth {
  return value === "Structured Snapshot" || value === "Deep Phase Analysis" || value === "Custom Analytical Work" || value === "Not sure";
}

function isValidDateStatus(value: unknown): value is DateStatus {
  return value === "empty" || value === "parsed" || value === "ambiguous" || value === "confirmed" || value === "locked";
}

function isValidDateRole(value: unknown): value is DateRole {
  return value === "birth_date" || value === "person_a_birth_date" || value === "person_b_birth_date" || value === "relationship_start_date" || value === "project_start_date" || value === "milestone_date" || value === "registration_date" || value === "key_event_date" || value === "event_date" || value === "period_start" || value === "period_end" || value === "custom_known_date";
}

function isValidAnchorIntegrity(value: unknown): value is AnchorIntegrity {
  return value === "complete" || value === "partial" || value === "insufficient";
}

function isValidEntitiesCount(value: unknown): value is EntitiesCount | "" {
  return value === "" || value === "1" || value === "2" || value === "3+" || value === "Not sure";
}

function isValidTimeScope(value: unknown): value is TimeScope | "" {
  return value === "" || value === "One date / one point" || value === "Short period" || value === "Several phases" || value === "Extended / unclear";
}

function isValidSourceMaterialLevel(value: unknown): value is SourceMaterialLevel | "" {
  return value === "" || value === "None" || value === "Short notes" || value === "Documents / links" || value === "Multiple materials";
}

function isValidLikelyLevel(value: unknown): value is LikelyLevel {
  return value === "Level I" || value === "Level II" || value === "Level III" || value === "Manual classification required";
}

function isValidAccessEntrySource(value: unknown): value is AccessEntrySource {
  return value === "/" || value === "/frey" || value === "/faq" || value === "/reading" || value === "/investors" || value === "/access" || value === "direct" || value === "unknown";
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isIsoDateTime(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function fail(errorCode: AccessSubmitValidationFailure["errorCode"], errorMessage: string): AccessSubmitValidationFailure {
  return { ok: false, errorCode, errorMessage };
}

function randomBase36(length: number): string {
  let out = "";
  while (out.length < length) out += Math.random().toString(36).slice(2);
  return out.slice(0, length);
}
