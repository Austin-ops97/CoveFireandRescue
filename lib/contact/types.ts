export type ContactSubmissionStatus = "new" | "reviewed" | "archived";

export type ContactSubmissionRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  submittedAt?: unknown;
  status: ContactSubmissionStatus;
};

export type ContactFormPayload = {
  name: string;
  email: string;
  phone?: string;
  message: string;
};
