import "server-only";

import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import {
  getAllTemplateFields,
  submissionHasAttentionItems,
  type ChecklistFieldType,
  type ChecklistSubmissionAnswer,
  type ChecklistSubmissionRecord,
  type ChecklistTemplateField,
  type ChecklistTemplateRecord,
  type ChecklistTemplateScope,
  type ChecklistTemplateSection,
} from "@/lib/checklist/types";

const SCOPES: ChecklistTemplateScope[] = ["fleet", "station", "equipment", "general"];

const FIELD_TYPES: ChecklistFieldType[] = [
  "pass_fail",
  "pass_fail_na",
  "yes_no",
  "checkbox",
  "text",
  "number",
  "select",
  "photo",
  "signature",
];

export class ChecklistValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChecklistValidationError";
  }
}

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readScope(value: unknown): ChecklistTemplateScope {
  if (typeof value === "string" && SCOPES.includes(value as ChecklistTemplateScope)) {
    return value as ChecklistTemplateScope;
  }
  return "general";
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readField(value: unknown): ChecklistTemplateField | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (typeof data.id !== "string" || !data.id.trim()) return null;
  if (typeof data.label !== "string" || !data.label.trim()) return null;
  if (typeof data.type !== "string" || !FIELD_TYPES.includes(data.type as ChecklistFieldType)) {
    return null;
  }

  const options = readStringArray(data.options);
  const helpText =
    typeof data.helpText === "string"
      ? data.helpText.trim() || null
      : data.helpText === null
        ? null
        : null;

  return {
    id: data.id.trim(),
    label: data.label.trim(),
    type: data.type as ChecklistFieldType,
    required: data.required === true,
    sortOrder:
      typeof data.sortOrder === "number" && Number.isFinite(data.sortOrder) ? data.sortOrder : 999,
    options: options.length > 0 ? options : undefined,
    helpText,
  };
}

function readSections(value: unknown): ChecklistTemplateSection[] {
  if (!Array.isArray(value)) return [];

  const sections: ChecklistTemplateSection[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const data = item as Record<string, unknown>;
    if (typeof data.id !== "string" || !data.id.trim()) continue;
    if (typeof data.title !== "string" || !data.title.trim()) continue;

    const fields = Array.isArray(data.fields)
      ? data.fields
          .map((field) => readField(field))
          .filter((field): field is ChecklistTemplateField => field !== null)
          .sort((a, b) => a.sortOrder - b.sortOrder)
      : [];

    sections.push({
      id: data.id.trim(),
      title: data.title.trim(),
      description:
        typeof data.description === "string"
          ? data.description.trim() || null
          : data.description === null
            ? null
            : null,
      sortOrder:
        typeof data.sortOrder === "number" && Number.isFinite(data.sortOrder)
          ? data.sortOrder
          : 999,
      fields,
    });
  }

  return sections.sort((a, b) => a.sortOrder - b.sortOrder);
}

function readAnswerValue(value: unknown): string | boolean | number | string[] | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return null;
}

function readAnswers(value: unknown): ChecklistSubmissionAnswer[] {
  if (!Array.isArray(value)) return [];

  const answers: ChecklistSubmissionAnswer[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const data = item as Record<string, unknown>;
    if (typeof data.fieldId !== "string" || !data.fieldId.trim()) continue;
    if (typeof data.sectionId !== "string" || !data.sectionId.trim()) continue;

    const photoFileIds = readStringArray(data.photoFileIds);

    answers.push({
      fieldId: data.fieldId.trim(),
      sectionId: data.sectionId.trim(),
      value: readAnswerValue(data.value),
      photoFileIds: photoFileIds.length > 0 ? photoFileIds : undefined,
    });
  }

  return answers;
}

export function serializeChecklistTemplateDoc(doc: DocumentSnapshot): ChecklistTemplateRecord {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    name: typeof data.name === "string" ? data.name : "",
    description:
      typeof data.description === "string"
        ? data.description
        : data.description === null
          ? null
          : null,
    scope: readScope(data.scope),
    active: data.active !== false,
    reusable: data.reusable !== false,
    sortOrder:
      typeof data.sortOrder === "number" && Number.isFinite(data.sortOrder) ? data.sortOrder : 999,
    sections: readSections(data.sections),
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

export function serializeChecklistSubmissionDoc(
  doc: DocumentSnapshot
): ChecklistSubmissionRecord {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    templateId: typeof data.templateId === "string" ? data.templateId : "",
    templateName: typeof data.templateName === "string" ? data.templateName : "",
    scope: readScope(data.scope),
    relatedFleetUnitId:
      typeof data.relatedFleetUnitId === "string"
        ? data.relatedFleetUnitId
        : data.relatedFleetUnitId === null
          ? null
          : null,
    relatedFleetUnitName:
      typeof data.relatedFleetUnitName === "string"
        ? data.relatedFleetUnitName
        : data.relatedFleetUnitName === null
          ? null
          : null,
    submittedBy: typeof data.submittedBy === "string" ? data.submittedBy : "",
    submittedByName:
      typeof data.submittedByName === "string"
        ? data.submittedByName
        : data.submittedByName === null
          ? null
          : null,
    notes: typeof data.notes === "string" ? data.notes : null,
    answers: readAnswers(data.answers),
    photoFileIds: readStringArray(data.photoFileIds),
    submittedAt: serializeTimestamp(data.submittedAt),
  };
}

function parseSortOrder(value: unknown): number {
  if (value === undefined || value === null || value === "") return 999;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 999;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      throw new ChecklistValidationError("Sort order must be a valid number.");
    }
    return parsed;
  }
  throw new ChecklistValidationError("Sort order must be a valid number.");
}

function validateTemplateField(field: unknown, sectionIndex: number, fieldIndex: number): ChecklistTemplateField {
  if (!field || typeof field !== "object") {
    throw new ChecklistValidationError(
      `Section ${sectionIndex + 1}, field ${fieldIndex + 1} is invalid.`
    );
  }

  const payload = field as Record<string, unknown>;

  if (typeof payload.id !== "string" || !payload.id.trim()) {
    throw new ChecklistValidationError(
      `Section ${sectionIndex + 1}, field ${fieldIndex + 1} must have an id.`
    );
  }

  if (typeof payload.label !== "string" || !payload.label.trim()) {
    throw new ChecklistValidationError(
      `Section ${sectionIndex + 1}, field ${fieldIndex + 1} must have a label.`
    );
  }

  const label = payload.label.trim();
  if (label.length > 200) {
    throw new ChecklistValidationError(
      `Section ${sectionIndex + 1}, field ${fieldIndex + 1} label must be 200 characters or fewer.`
    );
  }

  if (
    typeof payload.type !== "string" ||
    !FIELD_TYPES.includes(payload.type as ChecklistFieldType)
  ) {
    throw new ChecklistValidationError(
      `Section ${sectionIndex + 1}, field ${fieldIndex + 1} has an invalid type.`
    );
  }

  const fieldType = payload.type as ChecklistFieldType;

  if (typeof payload.required !== "boolean") {
    throw new ChecklistValidationError(
      `Section ${sectionIndex + 1}, field ${fieldIndex + 1} must specify whether it is required.`
    );
  }

  let options: string[] | undefined;
  if (fieldType === "select") {
    if (!Array.isArray(payload.options) || payload.options.length === 0) {
      throw new ChecklistValidationError(
        `Select field "${label}" must have at least one option.`
      );
    }
    options = payload.options
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
    if (options.length === 0) {
      throw new ChecklistValidationError(`Select field "${label}" must have at least one option.`);
    }
  }

  let helpText: string | null = null;
  if (payload.helpText !== undefined && payload.helpText !== null) {
    if (typeof payload.helpText !== "string") {
      throw new ChecklistValidationError(`Field "${label}" help text must be a string.`);
    }
    helpText = payload.helpText.trim() || null;
    if (helpText && helpText.length > 500) {
      throw new ChecklistValidationError(`Field "${label}" help text must be 500 characters or fewer.`);
    }
  }

  return {
    id: payload.id.trim(),
    label,
    type: fieldType,
    required: payload.required,
    sortOrder: parseSortOrder(payload.sortOrder),
    options,
    helpText,
  };
}

function validateTemplateSection(section: unknown, index: number): ChecklistTemplateSection {
  if (!section || typeof section !== "object") {
    throw new ChecklistValidationError(`Section ${index + 1} is invalid.`);
  }

  const payload = section as Record<string, unknown>;

  if (typeof payload.id !== "string" || !payload.id.trim()) {
    throw new ChecklistValidationError(`Section ${index + 1} must have an id.`);
  }

  if (typeof payload.title !== "string" || !payload.title.trim()) {
    throw new ChecklistValidationError(`Section ${index + 1} must have a title.`);
  }

  const title = payload.title.trim();
  if (title.length > 120) {
    throw new ChecklistValidationError(`Section ${index + 1} title must be 120 characters or fewer.`);
  }

  let description: string | null = null;
  if (payload.description !== undefined && payload.description !== null) {
    if (typeof payload.description !== "string") {
      throw new ChecklistValidationError(`Section ${index + 1} description must be a string.`);
    }
    description = payload.description.trim() || null;
    if (description && description.length > 1000) {
      throw new ChecklistValidationError(
        `Section ${index + 1} description must be 1000 characters or fewer.`
      );
    }
  }

  if (!Array.isArray(payload.fields) || payload.fields.length === 0) {
    throw new ChecklistValidationError(`Section "${title}" must have at least one field.`);
  }

  const fields = payload.fields.map((field, fieldIndex) =>
    validateTemplateField(field, index, fieldIndex)
  );

  const fieldIds = new Set<string>();
  for (const field of fields) {
    if (fieldIds.has(field.id)) {
      throw new ChecklistValidationError(`Duplicate field id "${field.id}" in section "${title}".`);
    }
    fieldIds.add(field.id);
  }

  fields.sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: payload.id.trim(),
    title,
    description,
    sortOrder: parseSortOrder(payload.sortOrder),
    fields,
  };
}

export function validateChecklistTemplatePayload(input: unknown): {
  name: string;
  description: string | null;
  scope: ChecklistTemplateScope;
  active: boolean;
  reusable: boolean;
  sortOrder: number;
  sections: ChecklistTemplateSection[];
} {
  if (!input || typeof input !== "object") {
    throw new ChecklistValidationError("Invalid template payload.");
  }

  const payload = input as Record<string, unknown>;

  if (typeof payload.name !== "string" || !payload.name.trim()) {
    throw new ChecklistValidationError("Template name is required.");
  }

  const name = payload.name.trim();
  if (name.length > 120) {
    throw new ChecklistValidationError("Template name must be 120 characters or fewer.");
  }

  let description: string | null = null;
  if (payload.description !== undefined && payload.description !== null) {
    if (typeof payload.description !== "string") {
      throw new ChecklistValidationError("Description must be a string.");
    }
    description = payload.description.trim() || null;
    if (description && description.length > 2000) {
      throw new ChecklistValidationError("Description must be 2000 characters or fewer.");
    }
  }

  if (typeof payload.scope !== "string" || !SCOPES.includes(payload.scope as ChecklistTemplateScope)) {
    throw new ChecklistValidationError("Scope must be fleet, station, equipment, or general.");
  }

  if (typeof payload.active !== "boolean") {
    throw new ChecklistValidationError("Active must be a boolean.");
  }

  if (typeof payload.reusable !== "boolean") {
    throw new ChecklistValidationError("Reusable must be a boolean.");
  }

  const sortOrder = parseSortOrder(payload.sortOrder);

  if (!Array.isArray(payload.sections) || payload.sections.length === 0) {
    throw new ChecklistValidationError("At least one section is required.");
  }

  const sections = payload.sections.map((section, index) => validateTemplateSection(section, index));
  sections.sort((a, b) => a.sortOrder - b.sortOrder);

  const sectionIds = new Set<string>();
  for (const section of sections) {
    if (sectionIds.has(section.id)) {
      throw new ChecklistValidationError("Section ids must be unique within a template.");
    }
    sectionIds.add(section.id);
  }

  return {
    name,
    description,
    scope: payload.scope as ChecklistTemplateScope,
    active: payload.active,
    reusable: payload.reusable,
    sortOrder,
    sections,
  };
}

function isAnswerProvided(
  field: ChecklistTemplateField,
  value: string | boolean | number | string[] | null,
  photoFileIds?: string[]
): boolean {
  if (field.type === "photo") {
    const ids = photoFileIds ?? [];
    return ids.length > 0;
  }

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

function validateAnswerForField(
  field: ChecklistTemplateField,
  value: string | boolean | number | string[] | null,
  photoFileIds?: string[]
): void {
  if (!isAnswerProvided(field, value, photoFileIds)) {
    if (field.required) {
      throw new ChecklistValidationError(`"${field.label}" is required.`);
    }
    return;
  }

  switch (field.type) {
    case "pass_fail":
      if (value !== "pass" && value !== "fail") {
        throw new ChecklistValidationError(`"${field.label}" must be Pass or Fail.`);
      }
      break;
    case "pass_fail_na":
      if (value !== "pass" && value !== "fail" && value !== "na") {
        throw new ChecklistValidationError(`"${field.label}" must be Pass, Fail, or N/A.`);
      }
      break;
    case "yes_no":
      if (value !== "yes" && value !== "no") {
        throw new ChecklistValidationError(`"${field.label}" must be Yes or No.`);
      }
      break;
    case "text":
    case "signature":
      if (typeof value !== "string" || value.length > 2000) {
        throw new ChecklistValidationError(`"${field.label}" must be valid text.`);
      }
      break;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new ChecklistValidationError(`"${field.label}" must be a valid number.`);
      }
      break;
    case "checkbox":
      if (typeof value !== "boolean") {
        throw new ChecklistValidationError(`"${field.label}" must be checked or unchecked.`);
      }
      if (field.required && value !== true) {
        throw new ChecklistValidationError(`"${field.label}" must be checked.`);
      }
      break;
    case "select": {
      if (typeof value !== "string") {
        throw new ChecklistValidationError(`"${field.label}" must be a valid selection.`);
      }
      const options = field.options ?? [];
      if (!options.includes(value)) {
        throw new ChecklistValidationError(`"${field.label}" has an invalid selection.`);
      }
      break;
    }
    case "photo": {
      const ids = photoFileIds ?? [];
      if (field.required && ids.length === 0) {
        throw new ChecklistValidationError(`"${field.label}" requires at least one photo.`);
      }
      break;
    }
    default:
      break;
  }
}

export function validateChecklistSubmissionPayload(
  input: unknown,
  template: ChecklistTemplateRecord
): {
  templateId: string;
  relatedFleetUnitId: string | null;
  notes: string | null;
  photoFileIds: string[];
  answers: ChecklistSubmissionAnswer[];
} {
  if (!input || typeof input !== "object") {
    throw new ChecklistValidationError("Invalid submission payload.");
  }

  const payload = input as Record<string, unknown>;

  if (typeof payload.templateId !== "string" || !payload.templateId.trim()) {
    throw new ChecklistValidationError("Template id is required.");
  }

  const templateId = payload.templateId.trim();
  if (templateId !== template.id) {
    throw new ChecklistValidationError("Template id does not match the selected template.");
  }

  if (!template.active || !template.reusable) {
    throw new ChecklistValidationError("This checklist template is not available for submission.");
  }

  let relatedFleetUnitId: string | null = null;
  if (payload.relatedFleetUnitId !== undefined && payload.relatedFleetUnitId !== null) {
    if (typeof payload.relatedFleetUnitId !== "string") {
      throw new ChecklistValidationError("Fleet unit id must be a string.");
    }
    relatedFleetUnitId = payload.relatedFleetUnitId.trim() || null;
  }

  if (template.scope === "fleet" && !relatedFleetUnitId) {
    throw new ChecklistValidationError("Please select a fleet unit for this checklist.");
  }

  let notes: string | null = null;
  if (payload.notes !== undefined && payload.notes !== null) {
    if (typeof payload.notes !== "string") {
      throw new ChecklistValidationError("Notes must be a string.");
    }
    notes = payload.notes.trim() || null;
    if (notes && notes.length > 5000) {
      throw new ChecklistValidationError("Notes must be 5000 characters or fewer.");
    }
  }

  let photoFileIds: string[] = [];
  if (payload.photoFileIds !== undefined) {
    if (!Array.isArray(payload.photoFileIds)) {
      throw new ChecklistValidationError("Photo file ids must be an array.");
    }
    photoFileIds = readStringArray(payload.photoFileIds);
    if (photoFileIds.length > 10) {
      throw new ChecklistValidationError("At most 10 general photos are allowed per submission.");
    }
  }

  if (!Array.isArray(payload.answers)) {
    throw new ChecklistValidationError("Answers are required.");
  }

  const answers = readAnswers(payload.answers);
  const allFields = getAllTemplateFields(template);

  if (answers.length !== allFields.length) {
    throw new ChecklistValidationError("Answer count must match the checklist template.");
  }

  const answerMap = new Map(answers.map((answer) => [answer.fieldId, answer]));

  for (const field of allFields) {
    const answer = answerMap.get(field.id);
    if (!answer) {
      throw new ChecklistValidationError(`Missing answer for "${field.label}".`);
    }

    const section = template.sections.find((item) => item.id === answer.sectionId);
    if (!section || !section.fields.some((item) => item.id === field.id)) {
      throw new ChecklistValidationError(`Invalid section for "${field.label}".`);
    }

    validateAnswerForField(field, answer.value, answer.photoFileIds);
  }

  for (const answer of answers) {
    if (!allFields.some((field) => field.id === answer.fieldId)) {
      throw new ChecklistValidationError("Submission includes answers for unknown fields.");
    }
  }

  const normalizedAnswers = allFields.map((field) => {
    const section = template.sections.find((item) => item.fields.some((f) => f.id === field.id))!;
    const answer = answerMap.get(field.id)!;
    return {
      fieldId: field.id,
      sectionId: section.id,
      value: answer.value,
      photoFileIds: answer.photoFileIds,
    };
  });

  return {
    templateId,
    relatedFleetUnitId,
    notes,
    photoFileIds,
    answers: normalizedAnswers,
  };
}

const SCOPE_ORDER: Record<ChecklistTemplateScope, number> = {
  fleet: 0,
  station: 1,
  equipment: 2,
  general: 3,
};

export function sortTemplatesForAdmin(
  templates: ChecklistTemplateRecord[]
): ChecklistTemplateRecord[] {
  return [...templates].sort((a, b) => {
    const aArchived = a.active ? 0 : 1;
    const bArchived = b.active ? 0 : 1;
    if (aArchived !== bArchived) return aArchived - bArchived;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export function sortActiveReusableTemplates(
  templates: ChecklistTemplateRecord[]
): ChecklistTemplateRecord[] {
  return [...templates]
    .filter((template) => template.active && template.reusable)
    .sort((a, b) => {
      const scopeCompare = SCOPE_ORDER[a.scope] - SCOPE_ORDER[b.scope];
      if (scopeCompare !== 0) return scopeCompare;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
}

function submissionTimestamp(value: unknown): number {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function sortSubmissionsNewestFirst(
  submissions: ChecklistSubmissionRecord[]
): ChecklistSubmissionRecord[] {
  return [...submissions].sort(
    (a, b) => submissionTimestamp(b.submittedAt) - submissionTimestamp(a.submittedAt)
  );
}

export type SubmissionFilterParams = {
  templateId?: string;
  scope?: ChecklistTemplateScope;
  relatedFleetUnitId?: string;
  submittedBy?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  attentionOnly?: boolean;
};

export function filterSubmissions(
  submissions: ChecklistSubmissionRecord[],
  filters: SubmissionFilterParams,
  templatesById?: Map<string, ChecklistTemplateRecord>
): ChecklistSubmissionRecord[] {
  const search = filters.search?.trim().toLowerCase() ?? "";
  const fromMs = filters.fromDate ? Date.parse(filters.fromDate) : null;
  const toMs = filters.toDate ? Date.parse(filters.toDate) : null;

  return submissions.filter((submission) => {
    if (filters.templateId && submission.templateId !== filters.templateId) return false;
    if (filters.scope && submission.scope !== filters.scope) return false;
    if (
      filters.relatedFleetUnitId &&
      submission.relatedFleetUnitId !== filters.relatedFleetUnitId
    ) {
      return false;
    }
    if (filters.submittedBy && submission.submittedBy !== filters.submittedBy) return false;

    const submittedMs = submissionTimestamp(submission.submittedAt);
    if (fromMs !== null && !Number.isNaN(fromMs) && submittedMs < fromMs) return false;
    if (toMs !== null && !Number.isNaN(toMs)) {
      const endOfDay = toMs + 24 * 60 * 60 * 1000 - 1;
      if (submittedMs > endOfDay) return false;
    }

    if (filters.attentionOnly) {
      const template = templatesById?.get(submission.templateId);
      if (!submissionHasAttentionItems(submission, template)) return false;
    }

    if (search) {
      const haystack = [
        submission.templateName,
        submission.relatedFleetUnitName ?? "",
        submission.submittedByName ?? "",
        submission.notes ?? "",
        submission.scope,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

export { submissionHasAttentionItems };
