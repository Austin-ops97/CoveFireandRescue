export type AnnouncementCategory =
  | "Community Notice"
  | "Training"
  | "Burn Ban"
  | "Event"
  | "Department Update";

export interface Announcement {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: AnnouncementCategory;
}

export interface LeadershipMember {
  id: string;
  name: string;
  rank: string;
  bio: string;
}

export interface FleetUnit {
  id: string;
  unitName: string;
  year?: string;
  manufacturer?: string;
  pumpCapacity?: string;
  waterCapacity?: string;
  equipmentNotes?: string;
}
