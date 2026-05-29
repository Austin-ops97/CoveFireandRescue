import type { FieldAnswerState } from "@/lib/checklist/types";
import type { ChecklistTemplateField, ChecklistTemplateRecord } from "@/lib/checklist/types";

export type SubmissionFieldError = {
  fieldId: string;
  sectionId: string;
  message: string;
};

export type SubmissionValidationResult = {
  valid: boolean;
  errors: SubmissionFieldError[];
  fleetUnitError?: string;
};

function isAnswerProvided(
  field: ChecklistTemplateField,
  answer: FieldAnswerState
): boolean {
  if (field.type === "photo") {
    return answer.photoFileIds.length > 0;
  }

  const { value } = answer;
  if (value === null || value === undefined) return false;

  switch (field.type) {
    case "pass_fail":
    case "pass_fail_na":
    case "yes_no":
    case "select":
    case "signature":
      return typeof value === "string" && value.trim().length > 0;
    case "text":
      return typeof value === "string" && value.trim().length > 0;
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "checkbox":
      return typeof value === "boolean";
    default:
      return false;
  }
}

function validateFieldAnswer(
  field: ChecklistTemplateField,
  sectionId: string,
  answer: FieldAnswerState
): SubmissionFieldError | null {
  const provided = isAnswerProvided(field, answer);

  if (field.required && !provided) {
    return {
      fieldId: field.id,
      sectionId,
      message: `${field.label} is required.`,
    };
  }

  if (!provided) return null;

  const { value, photoFileIds } = answer;

  switch (field.type) {
    case "pass_fail":
      if (value !== "pass" && value !== "fail") {
        return { fieldId: field.id, sectionId, message: `${field.label} must be Pass or Fail.` };
      }
      break;
    case "pass_fail_na":
      if (value !== "pass" && value !== "fail" && value !== "na") {
        return {
          fieldId: field.id,
          sectionId,
          message: `${field.label} must be Pass, Fail, or N/A.`,
        };
      }
      break;
    case "yes_no":
      if (value !== "yes" && value !== "no") {
        return { fieldId: field.id, sectionId, message: `${field.label} must be Yes or No.` };
      }
      break;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return { fieldId: field.id, sectionId, message: `${field.label} must be a valid number.` };
      }
      break;
    case "select": {
      if (typeof value !== "string" || !value.trim()) {
        return { fieldId: field.id, sectionId, message: `${field.label} requires a selection.` };
      }
      const options = field.options ?? [];
      if (!options.includes(value)) {
        return { fieldId: field.id, sectionId, message: `${field.label} has an invalid selection.` };
      }
      break;
    }
    case "checkbox":
      if (field.required && value !== true) {
        return { fieldId: field.id, sectionId, message: `${field.label} must be checked.` };
      }
      break;
    case "photo":
      if (field.required && photoFileIds.length === 0) {
        return { fieldId: field.id, sectionId, message: `${field.label} requires at least one photo.` };
      }
      break;
    default:
      break;
  }

  return null;
}

export function validateChecklistSubmissionClient(params: {
  template: ChecklistTemplateRecord;
  relatedFleetUnitId: string;
  answers: Record<string, FieldAnswerState>;
}): SubmissionValidationResult {
  const errors: SubmissionFieldError[] = [];

  if (params.template.scope === "fleet" && !params.relatedFleetUnitId.trim()) {
    return {
      valid: false,
      errors,
      fleetUnitError: "Please select a fleet unit for this checklist.",
    };
  }

  for (const section of params.template.sections) {
    for (const field of section.fields) {
      const answer = params.answers[field.id];
      if (!answer) {
        if (field.required) {
          errors.push({
            fieldId: field.id,
            sectionId: section.id,
            message: `${field.label} is required.`,
          });
        }
        continue;
      }

      const error = validateFieldAnswer(field, section.id, answer);
      if (error) errors.push(error);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function getFirstErrorSectionId(errors: SubmissionFieldError[]): string | null {
  return errors[0]?.sectionId ?? null;
}
