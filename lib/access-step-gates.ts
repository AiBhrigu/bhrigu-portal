import type {
  DraftCurrentStep,
  DraftFormState,
  FormDataModel,
  NormalizedDatesModel,
  ReviewDataModel,
} from "./access-models";

export interface ContinueResult {
  ok: boolean;
  nextStep: DraftCurrentStep;
  nextFormState: DraftFormState;
  blockingIssues: string[];
}

export type ContinueStepTarget = "dates" | "scope" | "review";

export function canMoveFromRequestStep(formData: FormDataModel): string[] {
  const issues: string[] = [];

  if (!formData.request.name.trim()) {
    issues.push("Name is required.");
  }

  if (!formData.request.email.trim()) {
    issues.push("Email is required.");
  }

  if (!formData.request.subjectType) {
    issues.push("Subject type is required.");
  }

  if (!formData.request.mainQuestion.trim()) {
    issues.push("Main question is required.");
  }

  if (!formData.request.shortDescription.trim()) {
    issues.push("Short description is required.");
  }

  if (!formData.request.preferredDepth) {
    issues.push("Preferred depth is required.");
  }

  if (!formData.consents.manualReviewAccepted) {
    issues.push("Manual review confirmation is required.");
  }

  return uniqueStrings(issues);
}

export function canMoveFromDatesStep(
  normalizedDates: NormalizedDatesModel
): string[] {
  const issues: string[] = [];

  for (const date of normalizedDates.dates) {
    if (date.required && date.status === "empty") {
      issues.push(`${date.label} is required.`);
    }

    if (date.required && date.status === "ambiguous") {
      issues.push(`${date.label} requires confirmation.`);
    }
  }

  return uniqueStrings(issues);
}

export function canMoveFromScopeStep(formData: FormDataModel): string[] {
  const issues: string[] = [];

  if (!formData.scope.entitiesCount) {
    issues.push("Entities count is required.");
  }

  if (!formData.scope.timeScope) {
    issues.push("Time scope is required.");
  }

  if (!formData.scope.sourceMaterialLevel) {
    issues.push("Source material level is required.");
  }

  return uniqueStrings(issues);
}

export function buildContinueResult(
  currentStep: DraftCurrentStep,
  targetStep: ContinueStepTarget,
  formData: FormDataModel,
  normalizedDates: NormalizedDatesModel,
  reviewData: ReviewDataModel
): ContinueResult {
  let blockingIssues: string[] = [];

  if (currentStep === "request") {
    blockingIssues = canMoveFromRequestStep(formData);
  }

  if (currentStep === "dates") {
    blockingIssues = canMoveFromDatesStep(normalizedDates);
  }

  if (currentStep === "scope") {
    blockingIssues = canMoveFromScopeStep(formData);
  }

  if (targetStep === "review") {
    blockingIssues = [...blockingIssues, ...reviewData.blockingIssues];
  }

  const deduped = uniqueStrings(blockingIssues);

  return {
    ok: deduped.length === 0,
    nextStep: targetStep,
    nextFormState: targetStep === "review" ? "review" : "input",
    blockingIssues: deduped,
  };
}

export function getStepGateIssues(
  step: DraftCurrentStep,
  formData: FormDataModel,
  normalizedDates: NormalizedDatesModel,
  reviewData: ReviewDataModel
): string[] {
  if (step === "request") {
    return canMoveFromRequestStep(formData);
  }

  if (step === "dates") {
    return canMoveFromDatesStep(normalizedDates);
  }

  if (step === "scope") {
    return canMoveFromScopeStep(formData);
  }

  if (step === "review") {
    return uniqueStrings(reviewData.blockingIssues);
  }

  return [];
}

export function isStepReady(
  step: DraftCurrentStep,
  formData: FormDataModel,
  normalizedDates: NormalizedDatesModel,
  reviewData: ReviewDataModel
): boolean {
  return (
    getStepGateIssues(step, formData, normalizedDates, reviewData).length === 0
  );
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
