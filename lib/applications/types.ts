export type ApplicationStatus = "new" | "reviewed" | "archived";

export type ApplicationRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  addressOrCity: string;
  ageConfirmed: boolean;
  priorExperience: string;
  availability: string;
  reasonForJoining: string;
  consent: boolean;
  submittedAt?: unknown;
  status: ApplicationStatus;
};

export type ApplicationFormPayload = {
  fullName: string;
  email: string;
  phone: string;
  addressOrCity: string;
  ageConfirmed: boolean;
  priorExperience: string;
  availability: string;
  reasonForJoining: string;
  consent: boolean;
};
