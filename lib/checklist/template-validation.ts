import type { ChecklistTemplateFormState } from "@/lib/checklist/types";

export type TemplateValidationIssue = {
  id: string;
  message: string;
};

export function getTemplateValidationIssues(
  form: ChecklistTemplateFormState
): TemplateValidationIssue[] {
  const issues: TemplateValidationIssue[] = [];

  if (!form.name.trim()) {
    issues.push({ id: "name", message: "Missing template name" });
  }

  if (form.sections.length === 0) {
    issues.push({ id: "sections", message: "Add at least one section" });
  }

  form.sections.forEach((section, sectionIndex) => {
    const sectionLabel = section.title.trim() || `Section ${sectionIndex + 1}`;

    if (!section.title.trim()) {
      issues.push({
        id: `section-title-${section.id}`,
        message: `Missing section title (section ${sectionIndex + 1})`,
      });
    }

    if (section.fields.length === 0) {
      issues.push({
        id: `section-fields-${section.id}`,
        message: `Section "${sectionLabel}" has no fields`,
      });
    }

    section.fields.forEach((field, fieldIndex) => {
      const fieldLabel = field.label.trim() || `Field ${fieldIndex + 1}`;

      if (!field.label.trim()) {
        issues.push({
          id: `field-label-${field.id}`,
          message: `Required field missing label in "${sectionLabel}"`,
        });
      }

      if (field.type === "select" && (!field.options || field.options.length === 0)) {
        issues.push({
          id: `field-options-${field.id}`,
          message: `Select field "${fieldLabel}" is missing options`,
        });
      }
    });
  });

  return issues;
}

export function isTemplateFormValid(form: ChecklistTemplateFormState): boolean {
  return getTemplateValidationIssues(form).length === 0;
}
