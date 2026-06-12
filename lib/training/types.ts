export type TrainingRecordType = "hours" | "certification";

export type TrainingRecord = {
  id: string;
  memberName: string;
  title: string;
  type: TrainingRecordType;
  hours?: number | null;
  completedAt?: string | null;
  expiresAt?: string | null;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type TrainingRecordFormState = {
  id?: string;
  memberName: string;
  title: string;
  type: TrainingRecordType;
  hours: string;
  completedAt: string;
  expiresAt: string;
  notes: string;
};

export const TRAINING_RECORD_TYPES: { value: TrainingRecordType; label: string }[] = [
  { value: "hours", label: "Training hours" },
  { value: "certification", label: "Certification" },
];
