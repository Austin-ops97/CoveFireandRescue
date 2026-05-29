"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/site/Badge";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import {
  archiveChecklistTemplate,
  fetchAdminChecklistTemplates,
  saveChecklistTemplate,
} from "@/lib/checklist/client";
import {
  getTemplateValidationIssues,
  isTemplateFormValid,
} from "@/lib/checklist/template-validation";
import {
  CHECKLIST_FIELD_TYPES,
  CHECKLIST_SCOPES,
  getChecklistFieldTypeLabel,
  getChecklistScopeLabel,
  type ChecklistTemplateField,
  type ChecklistTemplateFormState,
  type ChecklistTemplateRecord,
  type ChecklistTemplateSection,
} from "@/lib/checklist/types";

const inputClassName = "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm";

function createField(sortOrder: number): ChecklistTemplateField {
  return {
    id: crypto.randomUUID(),
    label: "",
    type: "pass_fail",
    required: true,
    sortOrder,
    helpText: null,
  };
}

function createSection(sortOrder: number): ChecklistTemplateSection {
  return {
    id: crypto.randomUUID(),
    title: "New section",
    description: null,
    sortOrder,
    fields: [createField(10)],
  };
}

const emptyForm: ChecklistTemplateFormState = {
  name: "",
  description: "",
  scope: "general",
  active: true,
  reusable: true,
  sortOrder: "999",
  sections: [createSection(10)],
};

function recordToForm(record: ChecklistTemplateRecord): ChecklistTemplateFormState {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? "",
    scope: record.scope,
    active: record.active,
    reusable: record.reusable,
    sortOrder: String(record.sortOrder),
    sections: record.sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) => ({ ...field, options: field.options ? [...field.options] : undefined })),
    })),
  };
}

function cloneField(field: ChecklistTemplateField, sortOrder: number): ChecklistTemplateField {
  return {
    ...field,
    id: crypto.randomUUID(),
    label: field.label ? `${field.label} (copy)` : "",
    sortOrder,
    options: field.options ? [...field.options] : undefined,
  };
}

function cloneSection(section: ChecklistTemplateSection, sortOrder: number): ChecklistTemplateSection {
  return {
    id: crypto.randomUUID(),
    title: section.title ? `${section.title} (copy)` : "New section",
    description: section.description ?? null,
    sortOrder,
    fields: section.fields.map((field, index) => cloneField(field, (index + 1) * 10)),
  };
}

function cloneTemplateForm(record: ChecklistTemplateRecord): ChecklistTemplateFormState {
  return {
    name: `Copy of ${record.name}`,
    description: record.description ?? "",
    scope: record.scope,
    active: record.active,
    reusable: record.reusable,
    sortOrder: String(record.sortOrder),
    sections: record.sections.map((section, sectionIndex) => ({
      id: crypto.randomUUID(),
      title: section.title,
      description: section.description ?? null,
      sortOrder: (sectionIndex + 1) * 10,
      fields: section.fields.map((field, fieldIndex) => ({
        ...field,
        id: crypto.randomUUID(),
        options: field.options ? [...field.options] : undefined,
        sortOrder: (fieldIndex + 1) * 10,
      })),
    })),
  };
}

function formatTimestamp(value: unknown): string {
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    }
  }
  return "—";
}

function TemplatePreview({ form }: { form: ChecklistTemplateFormState }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-red">Preview</p>
        <h3 className="mt-1 text-lg font-bold text-brand-charcoal">
          {form.name.trim() || "Untitled template"}
        </h3>
        {form.description.trim() ? (
          <p className="mt-1 text-sm text-brand-gray">{form.description}</p>
        ) : null}
        <p className="mt-2 text-xs text-brand-gray">
          {getChecklistScopeLabel(form.scope)}
          {form.reusable ? " · Reusable" : " · Not reusable"}
          {form.active ? " · Active" : " · Inactive"}
        </p>
      </div>
      {form.sections.map((section, sectionIndex) => (
        <div key={section.id} className="rounded-md border border-gray-200 p-3">
          <h4 className="font-semibold text-brand-charcoal">
            {section.title.trim() || `Section ${sectionIndex + 1}`}
          </h4>
          {section.description?.trim() ? (
            <p className="mt-1 text-xs text-brand-gray">{section.description}</p>
          ) : null}
          <ul className="mt-3 space-y-2">
            {section.fields.map((field) => (
              <li key={field.id} className="rounded-md bg-brand-gray-light/40 px-3 py-2 text-sm">
                <span className="font-medium text-brand-charcoal">
                  {field.label.trim() || "Untitled field"}
                  {field.required ? <span className="text-brand-red"> *</span> : null}
                </span>
                <span className="mt-0.5 block text-xs text-brand-gray">
                  {getChecklistFieldTypeLabel(field.type)}
                  {field.type === "select" && field.options?.length
                    ? ` · ${field.options.join(", ")}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function ChecklistTemplateBuilder() {
  const [templates, setTemplates] = useState<ChecklistTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState<ChecklistTemplateFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fieldCount = useMemo(
    () => form.sections.reduce((sum, section) => sum + section.fields.length, 0),
    [form.sections]
  );

  const validationIssues = useMemo(() => getTemplateValidationIssues(form), [form]);
  const formIsValid = validationIssues.length === 0;

  const loadTemplates = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const items = await fetchAdminChecklistTemplates();
      setTemplates(items);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load templates.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setSaveError(null);
  }

  function handleEdit(record: ChecklistTemplateRecord) {
    setForm(recordToForm(record));
    setEditingId(record.id);
    setSaveError(null);
    setSuccessMessage(null);
  }

  function addSection() {
    setForm((prev) => ({
      ...prev,
      sections: [...prev.sections, createSection((prev.sections.length + 1) * 10)],
    }));
  }

  function removeSection(sectionId: string) {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== sectionId),
    }));
  }

  function addField(sectionId: string) {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              fields: [...section.fields, createField((section.fields.length + 1) * 10)],
            }
          : section
      ),
    }));
  }

  function removeField(sectionId: string, fieldId: string) {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? { ...section, fields: section.fields.filter((field) => field.id !== fieldId) }
          : section
      ),
    }));
  }

  function duplicateSection(sectionId: string) {
    setForm((prev) => {
      const index = prev.sections.findIndex((section) => section.id === sectionId);
      if (index < 0) return prev;
      const source = prev.sections[index];
      const copy = cloneSection(source, (prev.sections.length + 1) * 10);
      const sections = [...prev.sections];
      sections.splice(index + 1, 0, copy);
      return { ...prev, sections };
    });
  }

  function duplicateField(sectionId: string, fieldId: string) {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const index = section.fields.findIndex((field) => field.id === fieldId);
        if (index < 0) return section;
        const copy = cloneField(section.fields[index], (section.fields.length + 1) * 10);
        const fields = [...section.fields];
        fields.splice(index + 1, 0, copy);
        return { ...section, fields };
      }),
    }));
  }

  function handleDuplicateTemplate(record: ChecklistTemplateRecord) {
    setForm(cloneTemplateForm(record));
    setEditingId(null);
    setSaveError(null);
    setSuccessMessage(`Duplicating "${record.name}". Review and save when ready.`);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSuccessMessage(null);

    if (!isTemplateFormValid(form)) {
      setSaveError("Fix validation issues before saving.");
      return;
    }

    setSaving(true);
    try {
      const normalizedSections = form.sections.map((section, sectionIndex) => ({
        ...section,
        title: section.title.trim(),
        description: section.description?.trim() || null,
        sortOrder: (sectionIndex + 1) * 10,
        fields: section.fields.map((field, fieldIndex) => ({
          ...field,
          label: field.label.trim(),
          sortOrder: (fieldIndex + 1) * 10,
          helpText: field.helpText?.trim() || null,
          options:
            field.type === "select"
              ? (field.options ?? []).map((option) => option.trim()).filter(Boolean)
              : undefined,
        })),
      }));

      const saved = await saveChecklistTemplate({
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        sections: normalizedSections,
      });

      await loadTemplates(true);
      if (!editingId) {
        setForm(recordToForm(saved));
        setEditingId(saved.id);
        setSuccessMessage(`Created "${saved.name}".`);
      } else {
        resetForm();
        setSuccessMessage(`Saved "${saved.name}".`);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save template.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(id: string, name: string) {
    if (!window.confirm(`Archive "${name}"? Members will no longer be able to submit this sheet.`)) {
      return;
    }

    setArchivingId(id);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      await archiveChecklistTemplate(id);
      await loadTemplates(true);
      if (editingId === id) resetForm();
      setSuccessMessage(`Archived "${name}".`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to archive template.");
    } finally {
      setArchivingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="border-l-4 border-l-brand-red">
        <p className="text-sm text-brand-gray">
          Templates are reusable sheets. Members can select these forms when submitting inspections
          for apparatus, stations, equipment, safety checks, and custom department needs.
        </p>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-brand-charcoal">Saved templates</h2>
          <p className="mt-1 text-sm text-brand-gray">
            {loading ? "Loading…" : `${templates.length} total`}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || refreshing}
          onClick={() => void loadTemplates(true)}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {successMessage && (
        <Card className="border-l-4 border-l-green-600 bg-green-50/50">
          <p className="text-sm font-medium text-green-900">{successMessage}</p>
        </Card>
      )}

      {loadError && (
        <Card className="border-l-4 border-l-brand-red bg-red-50/40">
          <p className="text-sm font-medium text-brand-charcoal">Could not load templates</p>
          <p className="mt-1 text-sm text-brand-gray">{loadError}</p>
        </Card>
      )}

      <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <h2 className="text-lg font-bold text-brand-charcoal">
            {editingId ? "Edit template" : "New template"}
          </h2>
          <p className="mt-1 text-sm text-brand-gray">
            {fieldCount} field{fieldCount === 1 ? "" : "s"} across {form.sections.length} section
            {form.sections.length === 1 ? "" : "s"}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-semibold text-brand-charcoal">
                  Name <span className="text-brand-red">*</span>
                </label>
                <input
                  id="name"
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className={inputClassName}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-semibold text-brand-charcoal">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={2}
                  maxLength={2000}
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="scope" className="block text-sm font-semibold text-brand-charcoal">
                  Scope
                </label>
                <select
                  id="scope"
                  value={form.scope}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      scope: event.target.value as ChecklistTemplateFormState["scope"],
                    }))
                  }
                  className={inputClassName}
                >
                  {CHECKLIST_SCOPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sortOrder" className="block text-sm font-semibold text-brand-charcoal">
                  Sort Order
                </label>
                <input
                  id="sortOrder"
                  inputMode="numeric"
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, sortOrder: event.target.value }))
                  }
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-charcoal">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, active: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                />
                Active
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-charcoal">
                <input
                  type="checkbox"
                  checked={form.reusable}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, reusable: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                />
                Reusable (members can submit)
              </label>
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-brand-charcoal">Sections</h3>
                <Button type="button" variant="outline" size="sm" onClick={addSection}>
                  Add section
                </Button>
              </div>

              {form.sections.map((section, sectionIndex) => (
                <div
                  key={section.id}
                  className="rounded-md border border-gray-200 bg-brand-gray-light/20 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
                      Section {sectionIndex + 1}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateSection(section.id)}
                      >
                        Duplicate section
                      </Button>
                      {form.sections.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSection(section.id)}
                        >
                          Remove section
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-brand-charcoal">
                        Title <span className="text-brand-red">*</span>
                      </label>
                      <input
                        required
                        maxLength={120}
                        value={section.title}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            sections: prev.sections.map((item) =>
                              item.id === section.id
                                ? { ...item, title: event.target.value }
                                : item
                            ),
                          }))
                        }
                        className={inputClassName}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-charcoal">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        maxLength={1000}
                        value={section.description ?? ""}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            sections: prev.sections.map((item) =>
                              item.id === section.id
                                ? { ...item, description: event.target.value }
                                : item
                            ),
                          }))
                        }
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-brand-charcoal">Fields</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addField(section.id)}
                      >
                        Add field
                      </Button>
                    </div>

                    {section.fields.map((field, fieldIndex) => (
                      <div
                        key={field.id}
                        className="rounded-md border border-dashed border-gray-300 bg-white p-3"
                      >
                        <p className="mb-2 text-xs font-semibold text-brand-gray">
                          Field {fieldIndex + 1}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-brand-charcoal">
                              Label <span className="text-brand-red">*</span>
                            </label>
                            <input
                              required
                              maxLength={200}
                              value={field.label}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  sections: prev.sections.map((item) =>
                                    item.id === section.id
                                      ? {
                                          ...item,
                                          fields: item.fields.map((f) =>
                                            f.id === field.id
                                              ? { ...f, label: event.target.value }
                                              : f
                                          ),
                                        }
                                      : item
                                  ),
                                }))
                              }
                              className={inputClassName}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-brand-charcoal">
                              Type
                            </label>
                            <select
                              value={field.type}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  sections: prev.sections.map((item) =>
                                    item.id === section.id
                                      ? {
                                          ...item,
                                          fields: item.fields.map((f) =>
                                            f.id === field.id
                                              ? {
                                                  ...f,
                                                  type: event.target
                                                    .value as ChecklistTemplateField["type"],
                                                  options:
                                                    event.target.value === "select"
                                                      ? f.options ?? [""]
                                                      : undefined,
                                                }
                                              : f
                                          ),
                                        }
                                      : item
                                  ),
                                }))
                              }
                              className={inputClassName}
                            >
                              {CHECKLIST_FIELD_TYPES.map((item) => (
                                <option key={item.value} value={item.value}>
                                  {item.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <label className="mt-6 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-charcoal">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  sections: prev.sections.map((item) =>
                                    item.id === section.id
                                      ? {
                                          ...item,
                                          fields: item.fields.map((f) =>
                                            f.id === field.id
                                              ? { ...f, required: event.target.checked }
                                              : f
                                          ),
                                        }
                                      : item
                                  ),
                                }))
                              }
                              className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                            />
                            Required
                          </label>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-brand-charcoal">
                              Help text
                            </label>
                            <input
                              maxLength={500}
                              value={field.helpText ?? ""}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  sections: prev.sections.map((item) =>
                                    item.id === section.id
                                      ? {
                                          ...item,
                                          fields: item.fields.map((f) =>
                                            f.id === field.id
                                              ? { ...f, helpText: event.target.value }
                                              : f
                                          ),
                                        }
                                      : item
                                  ),
                                }))
                              }
                              className={inputClassName}
                            />
                          </div>
                          {field.type === "select" && (
                            <div className="sm:col-span-2">
                              <label className="block text-sm font-semibold text-brand-charcoal">
                                Options (one per line)
                              </label>
                              <textarea
                                rows={3}
                                value={(field.options ?? []).join("\n")}
                                onChange={(event) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    sections: prev.sections.map((item) =>
                                      item.id === section.id
                                        ? {
                                            ...item,
                                            fields: item.fields.map((f) =>
                                              f.id === field.id
                                                ? {
                                                    ...f,
                                                    options: event.target.value
                                                      .split("\n")
                                                      .map((line) => line.trim())
                                                      .filter(Boolean),
                                                  }
                                                : f
                                            ),
                                          }
                                        : item
                                    ),
                                  }))
                                }
                                className={inputClassName}
                              />
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => duplicateField(section.id, field.id)}
                          >
                            Duplicate field
                          </Button>
                          {section.fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeField(section.id, field.id)}
                            >
                              Remove field
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-gray-200 bg-brand-gray-light/20 p-4">
              <p className="text-sm font-semibold text-brand-charcoal">Validation summary</p>
              {validationIssues.length === 0 ? (
                <p className="mt-1 text-sm text-green-800">Template is valid and ready to save.</p>
              ) : (
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-brand-red">
                  {validationIssues.map((issue) => (
                    <li key={issue.id}>{issue.message}</li>
                  ))}
                </ul>
              )}
            </div>

            {saveError && (
              <p className="text-sm font-medium text-brand-red" role="alert">
                {saveError}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving || !formIsValid}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Create template"}
              </Button>
              {(editingId || form.name) && (
                <Button type="button" variant="ghost" disabled={saving} onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="h-fit xl:sticky xl:top-6">
          <TemplatePreview form={form} />
        </Card>
      </div>

      {!loading && !loadError && templates.length > 0 && (
        <div className="space-y-4">
          {templates.map((template) => {
            const totalFields = template.sections.reduce(
              (sum, section) => sum + section.fields.length,
              0
            );
            return (
              <Card key={template.id} className={!template.active ? "opacity-70" : ""}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        label={template.active ? "Active" : "Archived"}
                        className={
                          template.active
                            ? "bg-green-100 text-green-800"
                            : "bg-brand-gray/20 text-brand-gray"
                        }
                      />
                      <Badge
                        label={getChecklistScopeLabel(template.scope)}
                        className="bg-brand-gray-light text-brand-charcoal"
                      />
                      {!template.reusable && (
                        <Badge label="Not reusable" className="bg-amber-50 text-amber-900" />
                      )}
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-brand-charcoal">{template.name}</h3>
                    {template.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-brand-gray">
                        {template.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-brand-gray">
                      {template.sections.length} sections · {totalFields} fields · Updated{" "}
                      {formatTimestamp(template.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template)}
                    >
                      Duplicate
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      Edit
                    </Button>
                    {template.active && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={archivingId === template.id}
                        onClick={() => void handleArchive(template.id, template.name)}
                      >
                        {archivingId === template.id ? "Archiving…" : "Archive"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
