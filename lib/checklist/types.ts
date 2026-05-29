export type ChecklistTemplateScope = "fleet" | "station" | "equipment" | "general";

export type ChecklistFieldType =
  | "pass_fail"
  | "pass_fail_na"
  | "yes_no"
  | "checkbox"
  | "text"
  | "number"
  | "select"
  | "photo"
  | "signature";

export type ChecklistTemplateField = {
  id: string;
  label: string;
  type: ChecklistFieldType;
  required: boolean;
  sortOrder: number;
  options?: string[];
  helpText?: string | null;
};

export type ChecklistTemplateSection = {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  fields: ChecklistTemplateField[];
};

export type ChecklistTemplateRecord = {
  id: string;
  name: string;
  description?: string | null;
  scope: ChecklistTemplateScope;
  active: boolean;
  reusable: boolean;
  sortOrder: number;
  sections: ChecklistTemplateSection[];
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ChecklistSubmissionAnswer = {
  fieldId: string;
  sectionId: string;
  value: string | boolean | number | string[] | null;
  photoFileIds?: string[];
};

export type ChecklistSubmissionRecord = {
  id: string;
  templateId: string;
  templateName: string;
  scope: ChecklistTemplateScope;
  relatedFleetUnitId?: string | null;
  relatedFleetUnitName?: string | null;
  submittedBy: string;
  submittedByName?: string | null;
  notes?: string | null;
  answers: ChecklistSubmissionAnswer[];
  photoFileIds: string[];
  submittedAt?: unknown;
};

export type ChecklistTemplateFormState = {
  id?: string;
  name: string;
  description: string;
  scope: ChecklistTemplateScope;
  active: boolean;
  reusable: boolean;
  sortOrder: string;
  sections: ChecklistTemplateSection[];
};

export type ChecklistSubmissionPayload = {
  templateId: string;
  relatedFleetUnitId?: string | null;
  notes?: string;
  answers: ChecklistSubmissionAnswer[];
  photoFileIds?: string[];
};

/** Client-side answer state for checklist submission forms */
export type FieldAnswerState = {
  value: string | boolean | number | string[] | null;
  photoFileIds: string[];
  photoPreviews: Record<string, string>;
};

export const CHECKLIST_SCOPES: Array<{ value: ChecklistTemplateScope; label: string }> = [
  { value: "fleet", label: "Fleet / Apparatus" },
  { value: "station", label: "Station" },
  { value: "equipment", label: "Equipment" },
  { value: "general", label: "General" },
];

export const CHECKLIST_FIELD_TYPES: Array<{ value: ChecklistFieldType; label: string }> = [
  { value: "pass_fail", label: "Pass / Fail" },
  { value: "pass_fail_na", label: "Pass / Fail / N/A" },
  { value: "yes_no", label: "Yes / No" },
  { value: "checkbox", label: "Checkbox" },
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "photo", label: "Photo" },
  { value: "signature", label: "Signature (typed name)" },
];

export function getChecklistScopeLabel(scope: ChecklistTemplateScope): string {
  return CHECKLIST_SCOPES.find((item) => item.value === scope)?.label ?? scope;
}

export function getChecklistFieldTypeLabel(type: ChecklistFieldType): string {
  return CHECKLIST_FIELD_TYPES.find((item) => item.value === type)?.label ?? type;
}

export function getAllTemplateFields(
  template: ChecklistTemplateRecord
): ChecklistTemplateField[] {
  return template.sections
    .flatMap((section) => section.fields)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function findTemplateField(
  template: ChecklistTemplateRecord,
  fieldId: string
): { field: ChecklistTemplateField; section: ChecklistTemplateSection } | null {
  for (const section of template.sections) {
    const field = section.fields.find((item) => item.id === fieldId);
    if (field) return { field, section };
  }
  return null;
}

export function answerNeedsAttention(
  field: ChecklistTemplateField,
  value: string | boolean | number | string[] | null
): boolean {
  if (field.type === "pass_fail" || field.type === "pass_fail_na") {
    return value === "fail";
  }
  if (field.type === "yes_no") {
    return value === "no";
  }
  return false;
}

export function submissionHasAttentionItems(
  submission: ChecklistSubmissionRecord,
  template?: ChecklistTemplateRecord | null
): boolean {
  if (!template) {
    return submission.answers.some(
      (answer) => answer.value === "fail" || answer.value === "no"
    );
  }

  return submission.answers.some((answer) => {
    const match = findTemplateField(template, answer.fieldId);
    if (!match) return false;
    return answerNeedsAttention(match.field, answer.value);
  });
}

export function getAttentionAnswers(
  submission: ChecklistSubmissionRecord,
  template?: ChecklistTemplateRecord | null
): Array<{
  fieldId: string;
  sectionId: string;
  label: string;
  value: string | boolean | number | string[] | null;
}> {
  const results: Array<{
    fieldId: string;
    sectionId: string;
    label: string;
    value: string | boolean | number | string[] | null;
  }> = [];

  for (const answer of submission.answers) {
    const match = template ? findTemplateField(template, answer.fieldId) : null;
    const label = match?.field.label ?? answer.fieldId;
    const field = match?.field;
    if (field && answerNeedsAttention(field, answer.value)) {
      results.push({
        fieldId: answer.fieldId,
        sectionId: answer.sectionId,
        label,
        value: answer.value,
      });
    } else if (!field && (answer.value === "fail" || answer.value === "no")) {
      results.push({
        fieldId: answer.fieldId,
        sectionId: answer.sectionId,
        label,
        value: answer.value,
      });
    }
  }

  return results;
}
