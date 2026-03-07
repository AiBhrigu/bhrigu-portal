export type FormState =
  | "input"
  | "ambiguity"
  | "review"
  | "success"
  | "error";

export type DraftFormState = "input" | "ambiguity" | "review";
export type DraftCurrentStep = "request" | "dates" | "scope" | "review";

export type DraftStatus =
  | "empty"
  | "in_progress"
  | "ready_for_review"
  | "reviewed_not_submitted";

export type SubmitAttemptStatus = "idle" | "submitting" | "failed";

export type SubjectType =
  | "Person"
  | "Relationship"
  | "Project"
  | "Business / Organization"
  | "Event / Period"
  | "Mixed / Not sure";

export type PreferredDepth =
  | "Structured Snapshot"
  | "Deep Phase Analysis"
  | "Custom Analytical Work"
  | "Not sure";

export type EntitiesCount = "1" | "2" | "3+" | "Not sure";

export type TimeScope =
  | "One date / one point"
  | "Short period"
  | "Several phases"
  | "Extended / unclear";

export type SourceMaterialLevel =
  | "None"
  | "Short notes"
  | "Documents / links"
  | "Multiple materials";

export type DateRole =
  | "birth_date"
  | "person_a_birth_date"
  | "person_b_birth_date"
  | "relationship_start_date"
  | "project_start_date"
  | "milestone_date"
  | "registration_date"
  | "key_event_date"
  | "event_date"
  | "period_start"
  | "period_end"
  | "custom_known_date";

export type DateStatus =
  | "empty"
  | "parsed"
  | "ambiguous"
  | "confirmed"
  | "locked";

export type ClientStatus =
  | "pending_manual_review"
  | "correction_requested"
  | "ready_for_confirmation"
  | "processing"
  | "closed";

export type AnchorIntegrity = "complete" | "partial" | "insufficient";

export type LikelyLevel =
  | "Level I"
  | "Level II"
  | "Level III"
  | "Manual classification required";

export type CorrectionWindowStatus =
  | "open"
  | "closed"
  | "locked_for_processing";

export type FreyReportStatus =
  | "ready"
  | "pending"
  | "not_built"
  | "multiple_anchor_review_required";

export type AccessEntrySource =
  | "/"
  | "/frey"
  | "/faq"
  | "/reading"
  | "/investors"
  | "/access"
  | "direct"
  | "unknown";

export interface AmbiguousDateCandidate {
  iso: string;
  human: string;
}

export interface NormalizedDateEntry {
  id: string;
  role: DateRole;
  label: string;
  raw: string | null;
  iso: string | null;
  human: string | null;
  status: DateStatus;
  required: boolean;
  confirmed: boolean;
  ambiguousCandidates: AmbiguousDateCandidate[];
}

export interface RequestFields {
  name: string;
  email: string;
  subjectType: SubjectType | "";
  mainQuestion: string;
  shortDescription: string;
  preferredDepth: PreferredDepth | "";
}

export interface PersonSubjectPayload {
  fullNameOrIdentifier: string;
  birthDateRaw: string;
  birthTimeRaw: string;
  birthPlaceRaw: string;
}

export interface RelationshipPersonPayload {
  name: string;
  birthDateRaw: string;
  birthTimeRaw: string;
  birthPlaceRaw: string;
}

export interface RelationshipSubjectPayload {
  personA: RelationshipPersonPayload;
  personB: RelationshipPersonPayload;
  relationshipStartDateRaw: string;
}

export interface ProjectSubjectPayload {
  projectName: string;
  startDateRaw: string;
  milestoneDateRaw: string;
}

export interface BusinessSubjectPayload {
  organizationName: string;
  registrationOrStartDateRaw: string;
  keyEventDateRaw: string;
}

export interface EventSubjectPayload {
  eventTitle: string;
  eventDateRaw: string;
  periodStartRaw: string;
  periodEndRaw: string;
}

export interface MixedSubjectPayload {
  primarySubject: string;
  knownDatesRaw: string;
}

export type SubjectPayload =
  | PersonSubjectPayload
  | RelationshipSubjectPayload
  | ProjectSubjectPayload
  | BusinessSubjectPayload
  | EventSubjectPayload
  | MixedSubjectPayload
  | Record<string, never>;

export interface ScopeFields {
  entitiesCount: EntitiesCount | "";
  timeScope: TimeScope | "";
  sourceMaterialLevel: SourceMaterialLevel | "";
  referenceLinks: string;
}

export interface ConsentFields {
  manualReviewAccepted: boolean;
  reviewConfirmationAccepted: boolean;
}

export interface FormDataModel {
  request: RequestFields;
  subjectPayload: SubjectPayload;
  scope: ScopeFields;
  consents: ConsentFields;
}

export interface NormalizedDatesModel {
  dates: NormalizedDateEntry[];
}

export interface ReviewDateItem {
  label: string;
  human: string | null;
  iso: string | null;
  status: DateStatus;
}

export interface ReviewRequestSummary {
  subjectType: SubjectType | "";
  mainQuestion: string;
  preferredDepth: PreferredDepth | "";
}

export interface ReviewScopeSummary {
  entitiesCount: EntitiesCount | "";
  timeScope: TimeScope | "";
  sourceMaterialLevel: SourceMaterialLevel | "";
}

export interface ReviewDataModel {
  requestSummary: ReviewRequestSummary;
  verifiedDates: ReviewDateItem[];
  scopeSummary: ReviewScopeSummary;
  completenessNotes: string[];
  blockingIssues: string[];
  canSubmit: boolean;
}

export interface CorrectionWindow {
  status: CorrectionWindowStatus;
  method: "reply_to_email" | "private_link" | "manual_only";
  until: "processing_start" | "review_start" | "custom";
}

export interface ClientSubmittedDate {
  label: string;
  human: string;
  iso: string;
}

export interface ClientViewModel {
  requestId: string;
  status: ClientStatus;
  submittedAt: string;
  subjectType: SubjectType | "";
  mainQuestion: string;
  preferredDepth: PreferredDepth | "";
  submittedDates: ClientSubmittedDate[];
  nextSteps: string[];
  correctionWindow: CorrectionWindow;
}

export interface DerivedModel {
  anchorIntegrity: AnchorIntegrity;
  criticalMissingFields: string[];
  entitiesCount: EntitiesCount | "";
  timeScope: TimeScope | "";
  sourceMaterialLevel: SourceMaterialLevel | "";
  likelyLevel: LikelyLevel;
  manualEscalation: boolean;
  manualEscalationReasons: string[];
}

export interface FreyAnalysisBlock {
  volatility_index: number;
  coherence_score: number;
  phase_bias: number;
}

export interface FreyMetaBlock {
  engine_version: string;
  cci_version: string;
  layer: string;
  timestamp: string;
}

export interface FreyReportReady {
  status: "ready";
  engine: string;
  phase_density: number;
  harmonic_tension: number;
  resonance_level: number;
  eclipse_proximity: number;
  structural_stability: number;
  analysis: FreyAnalysisBlock;
  meta: FreyMetaBlock;
}

export interface FreyReportFallback {
  status: Exclude<FreyReportStatus, "ready">;
  reason: string;
}

export type FreyReport = FreyReportReady | FreyReportFallback | null;

export interface OperatorSummary {
  primaryAnchor: string;
  signalState: string;
  reviewReadiness: string;
}

export interface RequestVerification {
  clientConfirmed: boolean;
  confirmedAt: string | null;
}

export interface OperatorCorrectionWindow {
  status: CorrectionWindowStatus;
  locksOn: "processing_start" | "manual_lock";
}

export interface RequestMeta {
  requestId: string;
  submittedAt: string;
  subjectType: SubjectType | "";
  manualReviewRequired: boolean;
}

export interface RequestTemporalMeta {
  accessEntryAt: string | null;
  draftStartedAt: string | null;
  dateConfirmationCompletedAt: string | null;
  requestSubmittedAt: string | null;
  accessEntrySource: AccessEntrySource;
  resumeCount: number;
  draftDurationMs: number | null;
  correctionRequested: boolean;
}

export interface OperatorPacketModel {
  requestMeta: RequestMeta;
  requestTemporalMeta: RequestTemporalMeta;
  request: RequestFields;
  subjectPayload: SubjectPayload;
  normalizedDates: NormalizedDateEntry[];
  derived: DerivedModel;
  freyReport: FreyReport;
  operatorSummary: OperatorSummary;
  requestVerification: RequestVerification;
  correctionWindow: OperatorCorrectionWindow;
}

export interface AccessTemporalMeta {
  access_entry_at: string | null;
  draft_started_at: string | null;
  date_confirmation_completed_at: string | null;
  request_submitted_at: string | null;
  access_entry_source: AccessEntrySource;
  resume_count: number;
  draft_duration_ms: number | null;
  correction_requested: boolean;
}

export interface DraftSubmitAttempt {
  status: SubmitAttemptStatus;
  lastAttemptAt: string | null;
  lastErrorMessage: string | null;
}

export interface PersistedAccessDraftV1 {
  version: "v1";
  draftId: string;
  savedAt: string;
  formState: DraftFormState;
  currentStep: DraftCurrentStep;
  draftStatus: DraftStatus;
  temporalMeta: AccessTemporalMeta;
  formData: FormDataModel;
  normalizedDates: NormalizedDatesModel;
  reviewData: ReviewDataModel;
  submitAttempt: DraftSubmitAttempt;
}

export interface DraftRestoreResult {
  found: boolean;
  expired: boolean;
  corrupted: boolean;
  draft: PersistedAccessDraftV1 | null;
}

export interface DraftSaveContext {
  formState: DraftFormState;
  currentStep: DraftCurrentStep;
  formData: FormDataModel;
  normalizedDates: NormalizedDatesModel;
  reviewData: ReviewDataModel;
  draftStatus: DraftStatus;
  submitAttempt: DraftSubmitAttempt;
  temporalMeta: AccessTemporalMeta;
}

export interface DraftLoadOptions {
  storageKey?: string;
  ttlDays?: number;
}

export interface DraftSaveOptions {
  storageKey?: string;
}

export interface DraftExpiryOptions {
  ttlDays?: number;
  nowIso?: string;
}

export interface AccessSubmissionModel {
  formState: FormState;
  formData: FormDataModel;
  normalizedDates: NormalizedDatesModel;
  reviewData: ReviewDataModel;
  clientView: ClientViewModel | null;
  operatorPacket: OperatorPacketModel | null;
  temporalMeta: AccessTemporalMeta;
}

export interface AccessSubmitRequestBodyV1 {
  request: RequestFields;
  subjectPayload: SubjectPayload;
  normalizedDates: NormalizedDateEntry[];
  derived: DerivedModel;
  requestVerification: RequestVerification;
  requestTemporalMeta: RequestTemporalMeta;
}

export interface AccessSubmitValidationSuccess {
  ok: true;
  data: AccessSubmitRequestBodyV1;
}

export interface AccessSubmitValidationFailure {
  ok: false;
  errorCode:
    | "invalid_payload"
    | "missing_required_field"
    | "verification_required"
    | "critical_date_missing"
    | "ambiguous_date_unresolved"
    | "invalid_email"
    | "invalid_subject_type";
  errorMessage: string;
}

export type AccessSubmitValidationResult =
  | AccessSubmitValidationSuccess
  | AccessSubmitValidationFailure;

export interface StoredAccessSubmissionV1 {
  requestId: string;
  createdAt: string;
  updatedAt: string;
  status: ClientStatus;
  request: RequestFields;
  subjectPayload: SubjectPayload;
  normalizedDates: NormalizedDateEntry[];
  derived: DerivedModel;
  requestVerification: RequestVerification;
  requestTemporalMeta: RequestTemporalMeta;
  clientView: ClientViewModel;
  operatorPacket: OperatorPacketModel;
  submissionSource: {
    endpoint: "/api/access/submit";
    version: "v1";
  };
}

export interface AccessSubmissionIndexEntry {
  requestId: string;
  createdAt: string;
  updatedAt: string;
  status: ClientStatus;
  email: string;
  subjectType: SubjectType | "";
  requestPath: string;
}

export interface AccessSubmissionIndexV1 {
  version: "v1";
  updatedAt: string;
  records: AccessSubmissionIndexEntry[];
}

export interface AccessSubmitSuccessResponseV1 {
  ok: true;
  requestId: string;
  submittedAt: string;
  status: "pending_manual_review";
}

export interface AccessSubmitErrorResponseV1 {
  ok: false;
  errorCode:
    | "method_not_allowed"
    | "invalid_payload"
    | "missing_required_field"
    | "verification_required"
    | "critical_date_missing"
    | "ambiguous_date_unresolved"
    | "invalid_email"
    | "invalid_subject_type"
    | "storage_failed"
    | "email_failed"
    | "internal_error";
  errorMessage: string;
}

export type AccessSubmitApiResponse =
  | AccessSubmitSuccessResponseV1
  | AccessSubmitErrorResponseV1;

export interface AccessSubmissionPersistenceAdapter {
  save(record: StoredAccessSubmissionV1): Promise<void>;
  getByRequestId(requestId: string): Promise<StoredAccessSubmissionV1 | null>;
  updateStatus(
    requestId: string,
    status: ClientStatus,
    updatedAt?: string
  ): Promise<StoredAccessSubmissionV1 | null>;
  markCorrectionRequested(
    requestId: string,
    updatedAt?: string
  ): Promise<StoredAccessSubmissionV1 | null>;
}

export interface AccessConfirmationEmailAdapter {
  sendClientConfirmation(input: {
    toEmail: string;
    clientView: ClientViewModel;
    request: RequestFields;
  }): Promise<void>;
}

export interface AccessOperatorEmailAdapter {
  sendOperatorNotification(input: {
    operatorEmail: string;
    requestId: string;
    submittedAt: string;
    operatorPacket: OperatorPacketModel;
  }): Promise<void>;
}
