import Head from "next/head";
import Link from "next/link";
import { useMemo } from "react";

import { useAccessStateController } from "../lib/access-state-controller";
import type {
  ClientStatus,
  DraftSubmitAttempt,
  EntitiesCount,
  EventSubjectPayload,
  FormDataModel,
  MixedSubjectPayload,
  NormalizedDateEntry,
  PreferredDepth,
  ProjectSubjectPayload,
  RelationshipSubjectPayload,
  ReviewDateItem,
  SourceMaterialLevel,
  SubjectPayload,
  SubjectType,
  TimeScope,
  PersonSubjectPayload,
  BusinessSubjectPayload,
  AccessSubmissionModel,
} from "../lib/access-models";

export default function AccessPage() {
  const controller = useAccessStateController();

  const {
    submission,
    currentStep,
    submitAttempt,
    notices,
    restore,
    updateFormData,
    setCurrentStep,
    continueFromRequest,
    continueFromDates,
    continueFromScope,
    continueDraft,
    discardDraftAndStartOver,
    resolveDateAmbiguity,
    confirmReview,
    revokeReviewConfirmation,
    submitRequest,
    clearSubmitError,
  } = controller;

  const subjectType = submission.formData.request.subjectType;
  const blockingIssues = submission.reviewData.blockingIssues;
  const canSubmit = submission.reviewData.canSubmit;

  const primaryCtaLabel = useMemo(() => {
    if (submitAttempt.status === "submitting") return "Submitting...";
    return "Submit request";
  }, [submitAttempt.status]);

  return (
    <>
      <Head>
        <title>Structured Access · BHRIGU</title>
        <meta
          name="description"
          content="Structured access for manual analytical requests with controlled review."
        />
      </Head>

      <main className="accessPage">
        <section className="shell">
          <HeaderBlock />
          <IntroBlock />

          <AccessNotices
            draftSavedVisible={notices.draftSavedVisible}
            isOffline={notices.isOffline}
            justRestored={notices.justRestored}
            submitAttempt={submitAttempt}
          />

          {restore.isRestoring ? (
            <LoadingBlock />
          ) : restore.showRestorePrompt && restore.restoreDraft ? (
            <RestoreDraftBlock
              savedAt={restore.restoreDraft.savedAt}
              onContinue={continueDraft}
              onStartOver={discardDraftAndStartOver}
            />
          ) : (
            <>
              <FormProgress currentStep={currentStep} formState={submission.formState} />

              {submission.formState === "input" && (
                <>
                  {currentStep === "request" && (
                    <RequestStep
                      formData={submission.formData}
                      updateFormData={updateFormData}
                      onContinue={() => {
                        clearSubmitError();
                        continueFromRequest();
                      }}
                    />
                  )}

                  {currentStep === "dates" && (
                    <DatesStep
                      subjectType={subjectType}
                      formData={submission.formData}
                      normalizedDates={submission.normalizedDates}
                      updateFormData={updateFormData}
                      onBack={() => setCurrentStep("request")}
                      onContinue={() => {
                        clearSubmitError();
                        const hasAmbiguous = submission.normalizedDates.dates.some(
                          (d) => d.status === "ambiguous"
                        );
                        if (hasAmbiguous) {
                          controller.setFormState("ambiguity");
                          return;
                        }
                        continueFromDates();
                      }}
                    />
                  )}

                  {currentStep === "scope" && (
                    <ScopeStep
                      formData={submission.formData}
                      updateFormData={updateFormData}
                      onBack={() => setCurrentStep("dates")}
                      onContinue={() => {
                        clearSubmitError();
                        continueFromScope();
                      }}
                    />
                  )}
                </>
              )}

              {submission.formState === "ambiguity" && (
                <AmbiguityState
                  dates={submission.normalizedDates.dates}
                  onResolve={(dateId, selectedIso) => {
                    resolveDateAmbiguity(dateId, selectedIso);
                  }}
                  onBack={() => {
                    controller.setFormState("input");
                    setCurrentStep("dates");
                  }}
                />
              )}

              {submission.formState === "review" && (
                <ReviewStep
                  submission={submission}
                  blockingIssues={blockingIssues}
                  canSubmit={canSubmit}
                  submitLabel={primaryCtaLabel}
                  isSubmitting={submitAttempt.status === "submitting"}
                  onEditRequest={() => {
                    revokeReviewConfirmation();
                    controller.setFormState("input");
                    setCurrentStep("request");
                  }}
                  onEditDates={() => {
                    revokeReviewConfirmation();
                    controller.setFormState("input");
                    setCurrentStep("dates");
                  }}
                  onEditScope={() => {
                    revokeReviewConfirmation();
                    controller.setFormState("input");
                    setCurrentStep("scope");
                  }}
                  onConfirmReview={confirmReview}
                  onSubmit={submitRequest}
                />
              )}

              {submission.formState === "success" && submission.clientView && (
                <SuccessStep clientView={submission.clientView} />
              )}
            </>
          )}
        </section>

        <style jsx>{`
          .accessPage {
            min-height: 100vh;
            padding: 32px 18px 64px;
            background:
              radial-gradient(circle at top, rgba(255,255,255,0.06), transparent 32%),
              linear-gradient(180deg, #07111b 0%, #091522 100%);
            color: #eaf1f7;
          }

          .shell {
            width: 100%;
            max-width: 860px;
            margin: 0 auto;
          }

          .panel {
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.04);
            border-radius: 18px;
            padding: 20px;
            backdrop-filter: blur(10px);
          }

          .stack {
            display: grid;
            gap: 14px;
          }

          .muted {
            color: rgba(234,241,247,0.72);
            margin: 0;
          }

          .tiny {
            font-size: 12px;
            color: rgba(234,241,247,0.6);
          }

          .sectionTitle {
            font-size: 13px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: rgba(234,241,247,0.72);
            margin: 0 0 8px;
          }

          .heroTitle {
            font-size: clamp(30px, 4vw, 46px);
            line-height: 1.02;
            letter-spacing: -0.04em;
            margin: 0;
          }

          .heroText {
            max-width: 720px;
            font-size: 16px;
            line-height: 1.65;
            color: rgba(234,241,247,0.82);
            margin: 0;
          }

          .grid2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .grid3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }

          label.field {
            display: grid;
            gap: 8px;
          }

          label.field span {
            font-size: 13px;
            color: rgba(234,241,247,0.82);
          }

          input,
          textarea,
          select {
            width: 100%;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(7,17,27,0.72);
            color: #eaf1f7;
            padding: 12px 14px;
            outline: none;
            box-sizing: border-box;
          }

          textarea {
            min-height: 110px;
            resize: vertical;
          }

          .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
          }

          .btnPrimary,
          .btnSecondary,
          .btnGhost {
            border-radius: 999px;
            padding: 12px 18px;
            font-size: 14px;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .btnPrimary {
            border: 1px solid rgba(255,255,255,0.14);
            background: rgba(255,255,255,0.94);
            color: #091522;
          }

          .btnSecondary {
            border: 1px solid rgba(255,255,255,0.14);
            background: rgba(255,255,255,0.06);
            color: #eaf1f7;
          }

          .btnGhost {
            border: 0;
            background: transparent;
            color: rgba(234,241,247,0.7);
            padding-left: 0;
            padding-right: 0;
          }

          .progress {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 22px 0;
          }

          .progressStep {
            padding: 8px 12px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.1);
            color: rgba(234,241,247,0.66);
            font-size: 12px;
          }

          .progressStepActive {
            color: #eaf1f7;
            border-color: rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.08);
          }

          .notice {
            margin: 14px 0;
            border-radius: 14px;
            padding: 12px 14px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.04);
          }

          .noticeError {
            border-color: rgba(255,140,140,0.22);
            background: rgba(120,16,16,0.18);
          }

          .reviewBlock {
            display: grid;
            gap: 18px;
          }

          .reviewItem {
            display: grid;
            gap: 4px;
            padding: 12px 0;
            border-top: 1px solid rgba(255,255,255,0.08);
          }

          .reviewItem:first-child {
            border-top: 0;
            padding-top: 0;
          }

          .reviewLabel {
            font-size: 13px;
            color: rgba(234,241,247,0.68);
          }

          .reviewValue {
            font-size: 15px;
            color: #eaf1f7;
          }

          .iso {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 12px;
            color: rgba(234,241,247,0.6);
          }

          .list {
            margin: 0;
            padding-left: 18px;
            display: grid;
            gap: 8px;
            color: rgba(234,241,247,0.8);
          }

          .errorList {
            margin: 0;
            padding-left: 18px;
            color: #ffd2d2;
            display: grid;
            gap: 8px;
          }

          @media (max-width: 760px) {
            .grid2,
            .grid3 {
              grid-template-columns: 1fr;
            }

            .accessPage {
              padding: 22px 14px 42px;
            }

            .panel {
              padding: 16px;
            }
          }
        `}</style>
      </main>
    </>
  );
}

function HeaderBlock() {
  return (
    <section className="stack">
      <p className="sectionTitle">Structured Access</p>
      <h1 className="heroTitle">Manual analytical requests with controlled review</h1>
      <p className="heroText">
        This page is for structured analytical work beyond the public interface.
        Requests are reviewed manually before confirmation, pricing, and processing.
      </p>
    </section>
  );
}

function IntroBlock() {
  return (
    <section className="panel stack" style={{ marginTop: 18 }}>
      <p className="muted">
        No instant output. No automated report generation. Each case is scoped before processing.
      </p>
      <p className="muted">
        For exploratory use, begin with Frey. For structured manual work, use the access layer.
      </p>
      <div className="actions">
        <Link href="/frey" className="btnGhost">Open Frey first</Link>
      </div>
    </section>
  );
}

function LoadingBlock() {
  return (
    <section className="panel stack" style={{ marginTop: 18 }}>
      <p className="sectionTitle">Loading</p>
      <p className="muted">Preparing access state.</p>
    </section>
  );
}

function RestoreDraftBlock(props: {
  savedAt: string;
  onContinue: () => void;
  onStartOver: () => void;
}) {
  return (
    <section className="panel stack" style={{ marginTop: 18 }}>
      <p className="sectionTitle">Unfinished request found</p>
      <p className="muted">A previous draft was saved on this device.</p>
      <p className="tiny">Last saved: {formatDisplayDateTime(props.savedAt)}</p>
      <div className="actions">
        <button type="button" className="btnPrimary" onClick={props.onContinue}>
          Continue draft
        </button>
        <button type="button" className="btnSecondary" onClick={props.onStartOver}>
          Start over
        </button>
      </div>
    </section>
  );
}

function FormProgress(props: {
  currentStep: "request" | "dates" | "scope" | "review";
  formState: string;
}) {
  const items: Array<"request" | "dates" | "scope" | "review" | "submitted"> = [
    "request",
    "dates",
    "scope",
    "review",
    "submitted",
  ];

  const active = props.formState === "success" ? "submitted" : props.currentStep;

  return (
    <nav className="progress" aria-label="Request progress">
      {items.map((item) => (
        <span key={item} className={`progressStep ${active === item ? "progressStepActive" : ""}`}>
          {labelForStep(item)}
        </span>
      ))}
    </nav>
  );
}

function RequestStep(props: {
  formData: FormDataModel;
  updateFormData: (updater: (prev: FormDataModel) => FormDataModel) => void;
  onContinue: () => void;
}) {
  const { formData, updateFormData, onContinue } = props;

  return (
    <section className="panel stack">
      <p className="sectionTitle">Request</p>

      <div className="grid2">
        <Field
          label="Name"
          value={formData.request.name}
          onChange={(value) =>
            updateFormData((prev) => ({
              ...prev,
              request: { ...prev.request, name: value },
            }))
          }
        />
        <Field
          label="Email"
          value={formData.request.email}
          onChange={(value) =>
            updateFormData((prev) => ({
              ...prev,
              request: { ...prev.request, email: value },
            }))
          }
        />
      </div>

      <SelectField
        label="Subject type"
        value={formData.request.subjectType}
        options={["", "Person", "Relationship", "Project", "Business / Organization", "Event / Period", "Mixed / Not sure"]}
        onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            request: { ...prev.request, subjectType: value as SubjectType | "" },
            subjectPayload: buildEmptySubjectPayload(value as SubjectType | ""),
          }))
        }
      />

      <Field
        label="Main question"
        value={formData.request.mainQuestion}
        onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            request: { ...prev.request, mainQuestion: value },
          }))
        }
      />

      <TextAreaField
        label="Short description"
        value={formData.request.shortDescription}
        onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            request: { ...prev.request, shortDescription: value },
          }))
        }
      />

      <SelectField
        label="Preferred depth"
        value={formData.request.preferredDepth}
        options={["", "Structured Snapshot", "Deep Phase Analysis", "Custom Analytical Work", "Not sure"]}
        onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            request: { ...prev.request, preferredDepth: value as PreferredDepth | "" },
          }))
        }
      />

      <CheckboxRow
        label="I understand that all requests are reviewed manually before confirmation, pricing, and processing."
        checked={formData.consents.manualReviewAccepted}
        onChange={(checked) =>
          updateFormData((prev) => ({
            ...prev,
            consents: { ...prev.consents, manualReviewAccepted: checked },
          }))
        }
      />

      <div className="actions">
        <button type="button" className="btnPrimary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </section>
  );
}

function DatesStep(props: {
  subjectType: SubjectType | "";
  formData: FormDataModel;
  normalizedDates: { dates: NormalizedDateEntry[] };
  updateFormData: (updater: (prev: FormDataModel) => FormDataModel) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <section className="panel stack">
      <p className="sectionTitle">Relevant dates</p>
      <p className="muted">
        Provide the key dates relevant to this request. You will review all dates before final submission.
      </p>

      <DynamicDateFields
        subjectType={props.subjectType}
        formData={props.formData}
        updateFormData={props.updateFormData}
      />

      <InlineDateStatusList dates={props.normalizedDates.dates} />

      <div className="actions">
        <button type="button" className="btnSecondary" onClick={props.onBack}>
          Back
        </button>
        <button type="button" className="btnPrimary" onClick={props.onContinue}>
          Continue
        </button>
      </div>
    </section>
  );
}

function ScopeStep(props: {
  formData: FormDataModel;
  updateFormData: (updater: (prev: FormDataModel) => FormDataModel) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { formData, updateFormData, onBack, onContinue } = props;

  return (
    <section className="panel stack">
      <p className="sectionTitle">Scope</p>

      <div className="grid3">
        <SelectField
          label="Entities involved"
          value={formData.scope.entitiesCount}
          options={["", "1", "2", "3+", "Not sure"]}
          onChange={(value) =>
            updateFormData((prev) => ({
              ...prev,
              scope: { ...prev.scope, entitiesCount: value as EntitiesCount | "" },
            }))
          }
        />
        <SelectField
          label="Time scope"
          value={formData.scope.timeScope}
          options={["", "One date / one point", "Short period", "Several phases", "Extended / unclear"]}
          onChange={(value) =>
            updateFormData((prev) => ({
              ...prev,
              scope: { ...prev.scope, timeScope: value as TimeScope | "" },
            }))
          }
        />
        <SelectField
          label="Source material"
          value={formData.scope.sourceMaterialLevel}
          options={["", "None", "Short notes", "Documents / links", "Multiple materials"]}
          onChange={(value) =>
            updateFormData((prev) => ({
              ...prev,
              scope: {
                ...prev.scope,
                sourceMaterialLevel: value as SourceMaterialLevel | "",
              },
            }))
          }
        />
      </div>

      <TextAreaField
        label="Links or reference material"
        value={formData.scope.referenceLinks}
        onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            scope: { ...prev.scope, referenceLinks: value },
          }))
        }
      />

      <div className="actions">
        <button type="button" className="btnSecondary" onClick={onBack}>
          Back
        </button>
        <button type="button" className="btnPrimary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </section>
  );
}

function AmbiguityState(props: {
  dates: NormalizedDateEntry[];
  onResolve: (dateId: string, selectedIso: string) => void;
  onBack: () => void;
}) {
  const ambiguous = props.dates.find((d) => d.status === "ambiguous");
  if (!ambiguous) return null;

  return (
    <section className="panel stack">
      <p className="sectionTitle">Confirm date</p>
      <p className="muted">
        This date format is ambiguous. Please confirm the correct date before continuing.
      </p>

      <div className="reviewItem">
        <span className="reviewLabel">Entered</span>
        <span className="reviewValue">{ambiguous.raw}</span>
      </div>

      <div className="stack">
        {ambiguous.ambiguousCandidates.map((candidate) => (
          <button
            key={candidate.iso}
            type="button"
            className="btnSecondary"
            onClick={() => props.onResolve(ambiguous.id, candidate.iso)}
          >
            {candidate.human} — {candidate.iso}
          </button>
        ))}
      </div>

      <div className="actions">
        <button type="button" className="btnGhost" onClick={props.onBack}>
          Back
        </button>
      </div>
    </section>
  );
}

function ReviewStep(props: {
  submission: AccessSubmissionModel;
  blockingIssues: string[];
  canSubmit: boolean;
  submitLabel: string;
  isSubmitting: boolean;
  onEditRequest: () => void;
  onEditDates: () => void;
  onEditScope: () => void;
  onConfirmReview: () => void;
  onSubmit: () => Promise<any>;
}) {
  const { submission } = props;

  return (
    <section className="panel reviewBlock">
      <div className="stack">
        <p className="sectionTitle">Review your request</p>
        <p className="muted">
          Please review all dates and request details carefully. Analytical processing depends on date accuracy.
        </p>
      </div>

      {props.blockingIssues.length > 0 && (
        <div className="notice noticeError">
          <ul className="errorList">
            {props.blockingIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <ReviewGroup
        title="Request summary"
        rows={[
          ["Subject type", submission.reviewData.requestSummary.subjectType || "Not set"],
          ["Main question", submission.reviewData.requestSummary.mainQuestion || "Not set"],
          ["Preferred depth", submission.reviewData.requestSummary.preferredDepth || "Not set"],
        ]}
      />

      <ReviewDates dates={submission.reviewData.verifiedDates} />

      <ReviewGroup
        title="Scope summary"
        rows={[
          ["Entities involved", submission.reviewData.scopeSummary.entitiesCount || "Not set"],
          ["Time scope", submission.reviewData.scopeSummary.timeScope || "Not set"],
          ["Source material", submission.reviewData.scopeSummary.sourceMaterialLevel || "Not set"],
        ]}
      />

      {submission.reviewData.completenessNotes.length > 0 && (
        <div className="stack">
          <p className="sectionTitle">Completeness notes</p>
          <ul className="list">
            {submission.reviewData.completenessNotes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <CheckboxRow
        label="I confirm that the submitted dates and request details are correct."
        checked={submission.formData.consents.reviewConfirmationAccepted}
        onChange={(checked) => {
          if (checked) props.onConfirmReview();
        }}
      />

      <div className="actions">
        <button type="button" className="btnGhost" onClick={props.onEditRequest}>
          Edit request
        </button>
        <button type="button" className="btnGhost" onClick={props.onEditDates}>
          Edit dates
        </button>
        <button type="button" className="btnGhost" onClick={props.onEditScope}>
          Edit scope
        </button>
      </div>

      <div className="actions">
        <button
          type="button"
          className="btnPrimary"
          disabled={!props.canSubmit || props.isSubmitting}
          onClick={props.onSubmit}
        >
          {props.submitLabel}
        </button>
      </div>
    </section>
  );
}

function SuccessStep(props: { clientView: AccessSubmissionModel["clientView"] }) {
  const clientView = props.clientView;
  if (!clientView) return null;

  return (
    <section className="panel stack">
      <p className="sectionTitle">Request received</p>
      <p className="muted">Your request has been submitted for manual review.</p>
      <p className="muted">
        Level, scope, pricing, and processing are confirmed only after review.
      </p>

      <ReviewGroup
        title="Status"
        rows={[
          ["Request ID", clientView.requestId],
          ["Status", formatClientStatus(clientView.status)],
          ["Submitted", formatDisplayDateTime(clientView.submittedAt)],
          ["Subject type", clientView.subjectType || "Not set"],
        ]}
      />

      {clientView.submittedDates.length > 0 && (
        <div className="stack">
          <p className="sectionTitle">Submitted dates</p>
          {clientView.submittedDates.map((item) => (
            <div key={`${item.label}-${item.iso}`} className="reviewItem">
              <span className="reviewLabel">{item.label}</span>
              <span className="reviewValue">{item.human}</span>
              <span className="iso">{item.iso}</span>
            </div>
          ))}
        </div>
      )}

      <div className="stack">
        <p className="sectionTitle">Next steps</p>
        <ol className="list">
          {clientView.nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="notice">
        <p className="muted">
          If you notice a date error, reply to the confirmation email before processing begins.
        </p>
      </div>

      <div className="actions">
        <Link href="/access" className="btnSecondary">Return to Access</Link>
        <Link href="/frey" className="btnGhost">Open Frey</Link>
      </div>
    </section>
  );
}

function ReviewGroup(props: { title: string; rows: Array<[string, string]> }) {
  return (
    <div className="stack">
      <p className="sectionTitle">{props.title}</p>
      {props.rows.map(([label, value]) => (
        <div key={label} className="reviewItem">
          <span className="reviewLabel">{label}</span>
          <span className="reviewValue">{value}</span>
        </div>
      ))}
    </div>
  );
}

function ReviewDates(props: { dates: ReviewDateItem[] }) {
  return (
    <div className="stack">
      <p className="sectionTitle">Verified dates</p>
      {props.dates.map((date) => (
        <div key={date.label} className="reviewItem">
          <span className="reviewLabel">{date.label}</span>
          <span className="reviewValue">{date.human || "Not provided"}</span>
          {date.iso ? <span className="iso">{date.iso}</span> : null}
        </div>
      ))}
    </div>
  );
}

function InlineDateStatusList(props: { dates: NormalizedDateEntry[] }) {
  if (!props.dates.length) return null;

  return (
    <div className="stack">
      {props.dates.map((date) => (
        <div key={date.id} className="reviewItem">
          <span className="reviewLabel">{date.label}</span>
          {date.status === "parsed" && date.human ? (
            <span className="tiny">Parsed as: {date.human}</span>
          ) : null}
          {date.status === "ambiguous" ? (
            <span className="tiny">This date format requires confirmation.</span>
          ) : null}
          {date.status === "empty" && date.required ? (
            <span className="tiny">{date.label} is required for this request type.</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function DynamicDateFields(props: {
  subjectType: SubjectType | "";
  formData: FormDataModel;
  updateFormData: (updater: (prev: FormDataModel) => FormDataModel) => void;
}) {
  const { subjectType, formData, updateFormData } = props;

  if (subjectType === "Person") {
    const p = formData.subjectPayload as PersonSubjectPayload;
    return (
      <div className="grid2">
        <Field label="Full name or identifier" value={p.fullNameOrIdentifier || ""} onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            subjectPayload: { ...(prev.subjectPayload as Record<string, unknown>), fullNameOrIdentifier: value } as SubjectPayload,
          }))
        } />
        <Field label="Date of birth" value={p.birthDateRaw || ""} onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            subjectPayload: { ...(prev.subjectPayload as Record<string, unknown>), birthDateRaw: value } as SubjectPayload,
          }))
        } />
        <Field label="Birth time" value={p.birthTimeRaw || ""} onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            subjectPayload: { ...(prev.subjectPayload as Record<string, unknown>), birthTimeRaw: value } as SubjectPayload,
          }))
        } />
        <Field label="Birth place" value={p.birthPlaceRaw || ""} onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            subjectPayload: { ...(prev.subjectPayload as Record<string, unknown>), birthPlaceRaw: value } as SubjectPayload,
          }))
        } />
      </div>
    );
  }

  if (subjectType === "Relationship") {
    const p = formData.subjectPayload as RelationshipSubjectPayload;
    return (
      <div className="stack">
        <div className="grid2">
          <Field label="Person A name or identifier" value={p.personA?.name || ""} onChange={(value) =>
            updateFormData((prev) => ({
              ...prev,
              subjectPayload: {
                ...(prev.subjectPayload as Record<string, unknown>),
                personA: { ...(p.personA || {}), name: value },
              } as SubjectPayload,
            }))
          } />
          <Field label="Person A date of birth" value={p.personA?.birthDateRaw || ""} onChange={(value) =>
            updateFormData((prev) => ({
              ...prev,
              subjectPayload: {
                ...(prev.subjectPayload as Record<string, unknown>),
                personA: { ...(p.personA || {}), birthDateRaw: value },
              } as SubjectPayload,
            }))
          } />
          <Field label="Person B name or identifier" value={p.personB?.name || ""} onChange={(value) =>
            updateFormData((prev) => ({
              ...prev,
              subjectPayload: {
                ...(prev.subjectPayload as Record<string, unknown>),
                personB: { ...(p.personB || {}), name: value },
              } as SubjectPayload,
            }))
          } />
          <Field label="Person B date of birth" value={p.personB?.birthDateRaw || ""} onChange={(value) =>
            updateFormData((prev) => ({
              ...prev,
              subjectPayload: {
                ...(prev.subjectPayload as Record<string, unknown>),
                personB: { ...(p.personB || {}), birthDateRaw: value },
              } as SubjectPayload,
            }))
          } />
          <Field label="Relationship start date" value={p.relationshipStartDateRaw || ""} onChange={(value) =>
            updateFormData((prev) => ({
              ...prev,
              subjectPayload: {
                ...(prev.subjectPayload as Record<string, unknown>),
                relationshipStartDateRaw: value,
              } as SubjectPayload,
            }))
          } />
        </div>
      </div>
    );
  }

  if (subjectType === "Project") {
    const p = formData.subjectPayload as ProjectSubjectPayload;
    return (
      <div className="grid2">
        <Field label="Project name" value={p.projectName || ""} onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            subjectPayload: { ...(prev.subjectPayload as Record<string, unknown>), projectName: value } as SubjectPayload,
          }))
        } />
        <Field label="Start date" value={p.startDateRaw || ""} onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            subjectPayload: { ...(prev.subjectPayload as Record<string, unknown>), startDateRaw: value } as SubjectPayload,
          }))
        } />
        <Field label="Key milestone date" value={p.milestoneDateRaw || ""} onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            subjectPayload: { ...(prev.subjectPayload as Record<string, unknown>), milestoneDateRaw: value } as SubjectPayload,
          }))
        } />
      </div>
    );
  }

  if (subjectType === "Business / Organization") {
    const p = formData.subjectPayload as BusinessSubjectPayload;
    return (
      <div className="grid2">
        <Field label="Business or organization name" value={p.organizationName || ""} onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            subjectPayload: { ...(prev.subjectPayload as Record<string, unknown>), organizationName: value } as SubjectPayload,
          }))
        } />
        <Field label="Registration or start date" value={p.registrationOrStartDateRaw || ""} onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            subjectPayload: { ...(prev.subjectPayload as Record<string, unknown>), registrationOrStartDateRaw: value } as SubjectPayload,
          }))
        } />
        <Field label="Key event date" value={p.keyEventDateRaw || ""} onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            subjectPayload: { ...(prev.subjectPayload as Record<string, unknown>), keyEventDateRaw: value } as SubjectPayload,
          }))
        } />
      </div>
    );
  }

  if (subjectType === "Event / Period") {
    const p = formData.subjectPayload as EventSubjectPayload;
    return (
      <div className="grid2">
        <Field label="Event title or identifier" value={p.eventTitle || ""} onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            subjectPayload: { ...(prev.subjectPayload as Record<string, unknown>), eventTitle: value } as SubjectPayload,
          }))
        } />
        <Field label="Event date" value={p.eventDateRaw || ""} onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            subjectPayload: { ...(prev.subjectPayload as Record<string, unknown>), eventDateRaw: value } as SubjectPayload,
          }))
        } />
        <Field label="Period start" value={p.periodStartRaw || ""} onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            subjectPayload: { ...(prev.subjectPayload as Record<string, unknown>), periodStartRaw: value } as SubjectPayload,
          }))
        } />
        <Field label="Period end" value={p.periodEndRaw || ""} onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            subjectPayload: { ...(prev.subjectPayload as Record<string, unknown>), periodEndRaw: value } as SubjectPayload,
          }))
        } />
      </div>
    );
  }

  if (subjectType === "Mixed / Not sure") {
    const p = formData.subjectPayload as MixedSubjectPayload;
    return (
      <div className="stack">
        <Field label="Primary subject" value={p.primarySubject || ""} onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            subjectPayload: { ...(prev.subjectPayload as Record<string, unknown>), primarySubject: value } as SubjectPayload,
          }))
        } />
        <TextAreaField label="Known dates" value={p.knownDatesRaw || ""} onChange={(value) =>
          updateFormData((prev) => ({
            ...prev,
            subjectPayload: { ...(prev.subjectPayload as Record<string, unknown>), knownDatesRaw: value } as SubjectPayload,
          }))
        } />
      </div>
    );
  }

  return <p className="tiny">Select a subject type to continue.</p>;
}

function Field(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <input value={props.value} onChange={(e) => props.onChange(e.target.value)} />
    </label>
  );
}

function TextAreaField(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <textarea value={props.value} onChange={(e) => props.onChange(e.target.value)} />
    </label>
  );
}

function SelectField(props: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <select value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {props.options.map((option) => (
          <option key={option} value={option}>
            {option || "Select"}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxRow(props: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="field" style={{ gridTemplateColumns: "20px 1fr", alignItems: "start" }}>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        style={{ width: 16, height: 16, marginTop: 3 }}
      />
      <span>{props.label}</span>
    </label>
  );
}

function AccessNotices(props: {
  draftSavedVisible: boolean;
  isOffline: boolean;
  justRestored: boolean;
  submitAttempt: DraftSubmitAttempt;
}) {
  return (
    <>
      {props.draftSavedVisible && (
        <NoticeBlock tone="soft" message="Draft saved on this device." />
      )}

      {props.isOffline && (
        <NoticeBlock
          tone="soft"
          title="Connection lost"
          message="Your draft remains saved on this device."
        />
      )}

      {props.justRestored && (
        <NoticeBlock
          tone="soft"
          title="Connection restored"
          message="You can continue your request."
        />
      )}

      {props.submitAttempt.status === "failed" && props.submitAttempt.lastErrorMessage && (
        <NoticeBlock
          tone="error"
          title="Submission did not complete"
          message={props.submitAttempt.lastErrorMessage}
        />
      )}
    </>
  );
}

function NoticeBlock(props: { title?: string; message: string; tone: "soft" | "error" }) {
  return (
    <div className={`notice ${props.tone === "error" ? "noticeError" : ""}`}>
      {props.title ? <p className="sectionTitle" style={{ marginBottom: 6 }}>{props.title}</p> : null}
      <p className="muted">{props.message}</p>
    </div>
  );
}

function labelForStep(step: "request" | "dates" | "scope" | "review" | "submitted") {
  switch (step) {
    case "request":
      return "Request";
    case "dates":
      return "Relevant Dates";
    case "scope":
      return "Scope";
    case "review":
      return "Review";
    case "submitted":
      return "Submitted";
  }
}

function formatDisplayDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatClientStatus(status: ClientStatus) {
  switch (status) {
    case "pending_manual_review":
      return "Pending manual review";
    case "correction_requested":
      return "Correction requested";
    case "ready_for_confirmation":
      return "Ready for confirmation";
    case "processing":
      return "Processing";
    case "closed":
      return "Closed";
  }
}

function buildEmptySubjectPayload(subjectType: SubjectType | ""): SubjectPayload {
  switch (subjectType) {
    case "Person":
      return {
        fullNameOrIdentifier: "",
        birthDateRaw: "",
        birthTimeRaw: "",
        birthPlaceRaw: "",
      };
    case "Relationship":
      return {
        personA: { name: "", birthDateRaw: "", birthTimeRaw: "", birthPlaceRaw: "" },
        personB: { name: "", birthDateRaw: "", birthTimeRaw: "", birthPlaceRaw: "" },
        relationshipStartDateRaw: "",
      };
    case "Project":
      return {
        projectName: "",
        startDateRaw: "",
        milestoneDateRaw: "",
      };
    case "Business / Organization":
      return {
        organizationName: "",
        registrationOrStartDateRaw: "",
        keyEventDateRaw: "",
      };
    case "Event / Period":
      return {
        eventTitle: "",
        eventDateRaw: "",
        periodStartRaw: "",
        periodEndRaw: "",
      };
    case "Mixed / Not sure":
      return {
        primarySubject: "",
        knownDatesRaw: "",
      };
    default:
      return {};
  }
}
