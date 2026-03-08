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
            max-width: 980px;
            margin: 0 auto;
            padding: 14px 0 40px;
          }

          .panel {
            position: relative;
            border: 1px solid rgba(255,255,255,0.14);
            background:
              radial-gradient(circle at top left, rgba(255,255,255,0.065), transparent 34%),
              linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.03));
            box-shadow: 0 24px 60px rgba(0,0,0,0.22);
            border-radius: 22px;
            padding: 28px;
            backdrop-filter: blur(14px);
          }

          .stack {
            display: grid;
            gap: 22px;
          }

          .muted {
            color: rgba(234,241,247,0.72);
            margin: 0;
            line-height: 1.6;
          }

          .tiny {
            font-size: 12px;
            color: rgba(234,241,247,0.6);
            line-height: 1.5;
            margin: 0;
          }

          .sectionTitle {
            font-size: 12px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(234,241,247,0.62);
            margin: 0 0 8px;
          }

          .heroTitle {
            font-size: clamp(34px, 4.8vw, 52px);
            line-height: 1;
            letter-spacing: -0.055em;
            margin: 0;
            max-width: 760px;
          }

          .heroText {
            max-width: 720px;
            font-size: 17px;
            line-height: 1.8;
            color: rgba(234,241,247,0.72);
            margin: 0;
          }

          .grid2 {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
            align-items: start;
          }

          .grid3 {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
            align-items: start;
          }

          .field {
            display: grid;
            gap: 10px;
            align-content: start;
            min-width: 0;
          }

          .fieldLabel {
            min-height: 18px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: rgba(234,241,247,0.58);
            display: block;
          }

          .fieldControl,
          .field textarea,
          .field select,
          .field input {
            width: 100%;
            min-height: 54px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.12);
            background: linear-gradient(180deg, rgba(9,19,31,0.9), rgba(7,16,27,0.86));
            color: #f5f8fc;
            padding: 14px 16px;
            outline: none;
            box-sizing: border-box;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.03),
              0 10px 24px rgba(0,0,0,0.09);
            transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
          }

          .field textarea {
            min-height: 146px;
            resize: none;
            line-height: 1.66;
            padding-top: 15px;
          }

          .field input:focus,
          .field textarea:focus,
          .field select:focus {
            border-color: rgba(255,255,255,0.32);
            background: linear-gradient(180deg, rgba(11,23,37,0.97), rgba(9,20,33,0.95));
            box-shadow:
              0 0 0 4px rgba(255,255,255,0.03),
              0 16px 30px rgba(0,0,0,0.15);
            transform: translateY(-1px);
          }

          .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            align-items: center;
            justify-content: flex-start;
          }

          .noticeStack {
            display: grid;
            gap: 10px;
            min-height: 96px;
            margin-top: 18px;
            align-content: start;
          }

          .statusPanel {
            display: grid;
            gap: 8px;
            min-height: 168px;
            padding: 18px 20px;
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.1);
            background: linear-gradient(180deg, rgba(255,255,255,0.046), rgba(255,255,255,0.03));
          }

          .statusPanelEmpty {
            align-content: center;
          }

          .statusItem {
            display: grid;
            gap: 4px;
            min-height: 52px;
            padding: 10px 0;
            border-top: 1px solid rgba(255,255,255,0.06);
            align-content: start;
          }

          .statusItem:first-child {
            border-top: 0;
            padding-top: 0;
          }

          .statusMeta {
            min-height: 18px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .checkboxField {
            grid-template-columns: 20px minmax(0, 1fr);
            gap: 14px;
            align-items: start;
            padding: 18px 20px;
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.12);
            background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03));
          }

          .checkboxField input {
            width: 16px;
            height: 16px;
            min-height: 16px;
            margin: 3px 0 0;
            accent-color: #eaf1f7;
          }

          .checkboxText {
            font-size: 13px;
            line-height: 1.62;
            color: rgba(234,241,247,0.8);
          }

          .btnPrimary,
          .btnSecondary,
          .btnGhost {
            min-height: 48px;
            border-radius: 999px;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.03em;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
          }

          .btnPrimary {
            border: 1px solid rgba(255,255,255,0.22);
            background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(232,238,244,0.92));
            color: #091522;
            box-shadow: 0 12px 28px rgba(0,0,0,0.16);
          }

          .btnSecondary {
            border: 1px solid rgba(255,255,255,0.14);
            background: linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.04));
            color: #eef4f9;
          }

          .btnGhost {
            border: 1px solid rgba(255,255,255,0.12);
            background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02));
            color: rgba(234,241,247,0.8);
            padding-left: 20px;
            padding-right: 20px;
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
            color: rgba(234,241,247,0.6);
            font-size: 12px;
            background: rgba(255,255,255,0.02);
          }

          .progressStepActive {
            color: #eaf1f7;
            border-color: rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.08);
          }

          .notice {
            min-height: 96px;
            border-radius: 20px;
            padding: 18px 20px;
            border: 1px solid rgba(255,255,255,0.12);
            background:
              radial-gradient(circle at top left, rgba(255,255,255,0.05), transparent 38%),
              linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.034));
            display: grid;
            align-content: center;
            box-sizing: border-box;
          }

          .noticePlaceholder {
            visibility: hidden;
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
            gap: 5px;
            padding: 14px 0;
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
            gap: 10px;
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
              padding: 18px;
              border-radius: 16px;
            }

            .actions {
              flex-direction: column;
              align-items: stretch;
            }

            .btnPrimary,
            .btnSecondary,
            .btnGhost {
              width: 100%;
            }

            .btnGhost {
              padding-left: 18px;
              padding-right: 18px;
              border: 1px solid rgba(255,255,255,0.12);
              border-radius: 999px;
              background: rgba(255,255,255,0.03);
            }

            .statusPanel {
              min-height: 0;
            }

            .noticeStack {
              min-height: 86px;
            }

            .notice {
              min-height: 74px;
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
      <h1 className="heroTitle">A premium intake layer for serious analytical work</h1>
      <p className="heroText">
        Use this page for requests that require careful review, deeper contextual handling,
        and a deliberate analytical response path beyond the public interface.
      </p>
    </section>
  );
}

function IntroBlock() {
  return (
    <section className="panel stack" style={{ marginTop: 18 }}>
      <p className="muted">
        Frey is the open exploration layer. Access is the reviewed intake layer for structured, higher-trust analytical work.
      </p>
      <p className="muted">
        Every submission is logged, reviewed manually, and confirmed only after scope, timing, and pricing are clarified with care.
      </p>
      <p className="tiny">Manual review protects context quality, timing clarity, and final analytical precision.</p>
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
      <p className="muted">Preparing your reviewed access workspace.</p>
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
      <p className="muted">A previous request draft was saved on this device.</p>
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

      <div className="grid2" data-access-row="two">
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
        Add the dates that define this request. You will verify them before final submission.
      </p>

      <DynamicDateFields
        subjectType={props.subjectType}
        formData={props.formData}
        updateFormData={props.updateFormData}
      />

      <div className="stack">
        <p className="sectionTitle">Date checks</p>
        <InlineDateStatusList dates={props.normalizedDates.dates} />
      </div>

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

      <div className="grid3" data-access-row="three">
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
      <p className="muted">Your request has been received and placed into manual review.</p>
      <p className="muted">
        Review usually begins within 24–48 hours. Scope, timing, and pricing are confirmed after that review.
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
  if (!props.dates.length) {
    return (
      <div className="statusPanel statusPanelEmpty">
        <p className="tiny">Date checks will appear here as you complete the required fields.</p>
      </div>
    );
  }

  return (
    <div className="statusPanel">
      {props.dates.map((date) => {
        let meta = "Waiting for input.";

        if (date.status === "parsed" && date.human) {
          meta = `Parsed: ${date.human}`;
        } else if (date.status === "ambiguous") {
          meta = "Date format needs confirmation.";
        } else if (date.status === "empty" && date.required) {
          meta = "Required for this request type.";
        } else if (date.status === "empty" && !date.required) {
          meta = "Optional field.";
        }

        return (
          <div key={date.id} className="statusItem">
            <span className="reviewLabel">{date.label}</span>
            <span className="tiny statusMeta" title={meta}>{meta}</span>
          </div>
        );
      })}
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
      <div className="grid2" data-access-row="two">
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
        <div className="grid2" data-access-row="two">
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
      <div className="grid2" data-access-row="two">
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
      <div className="grid2" data-access-row="two">
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
      <div className="grid2" data-access-row="two">
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
      <span className="fieldLabel">{props.label}</span>
      <input className="fieldControl" value={props.value} onChange={(e) => props.onChange(e.target.value)} />
    </label>
  );
}

function TextAreaField(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span className="fieldLabel">{props.label}</span>
      <textarea className="fieldControl" value={props.value} onChange={(e) => props.onChange(e.target.value)} />
    </label>
  );
}

function SelectField(props: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span className="fieldLabel">{props.label}</span>
      <select className="fieldControl" value={props.value} onChange={(e) => props.onChange(e.target.value)}>
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
    <label className="field checkboxField">
      <span aria-hidden="true">
        <input
          type="checkbox"
          checked={props.checked}
          onChange={(e) => props.onChange(e.target.checked)}
        />
      </span>
      <span className="checkboxText">{props.label}</span>
    </label>
  );
}

function AccessNotices(props: {
  draftSavedVisible: boolean;
  isOffline: boolean;
  justRestored: boolean;
  submitAttempt: DraftSubmitAttempt;
}) {
  const activeNotice = props.submitAttempt.status === "failed" && props.submitAttempt.lastErrorMessage
    ? (
        <NoticeBlock
          tone="error"
          title="Submission did not complete"
          message={props.submitAttempt.lastErrorMessage}
        />
      )
    : props.isOffline
    ? (
        <NoticeBlock
          tone="soft"
          title="Connection held"
          message="Your draft remains safely stored on this device while the connection recovers."
        />
      )
    : props.justRestored
    ? (
        <NoticeBlock
          tone="soft"
          title="Connection restored"
          message="You can continue your request without losing the current draft."
        />
      )
    : null;

  return (
    <div className="noticeStack" aria-live="polite">
      {activeNotice ?? <div className="notice noticePlaceholder" aria-hidden="true" />}
    </div>
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

