/**
 * Public department information — single source of truth for site content.
 */

export const siteConfig = {
  name: "Cove Fire & Rescue",
  shortName: "Cove Fire & Rescue",
  tagline: "Wild West",
  yearsInService: 54,
  industry: "Fire Department",

  heroHeadline:
    "Protecting Cove and West Chambers County with readiness, training, and volunteer pride.",

  heroStationImage: {
    url: "https://gywtxy56gkl7cfua.public.blob.vercel-storage.com/unnamed-3.jpg",
    alt: "Cove Fire & Rescue Station 91 — fire engines and support vehicles parked in front of the station bays in Cove, Texas.",
  },

  homeApparatusImage: {
    url: "https://gywtxy56gkl7cfua.public.blob.vercel-storage.com/unnamed-4.jpg",
    alt: "Cove Fire & Rescue Tanker 92 and fire apparatus staged during a daytime response, with department branding visible on the vehicles.",
    caption: "Our volunteers and apparatus stand ready to protect Cove and surrounding mutual aid districts.",
  },

  mission:
    "Cove Fire & Rescue serves the west side of Chambers County and surrounding mutual aid districts by providing safe, reliable fire protection and emergency response support.",

  trainingCommitment:
    "Our members train twice each week to sharpen their skills, learn new techniques, and stay ready to serve the community.",

  historyPreview:
    "Cove Fire & Rescue began with volunteers meeting in the Old Cove Community Building and an old fire truck purchased from neighboring Mont Belvieu for $1.00. Built through volunteer labor, fundraising, and community commitment, the department continues to carry forward the same spirit of service today.",

  historyCondensed:
    "Cove Fire & Rescue began when volunteers met in the Old Cove Community Building and towed home a fire truck purchased from Mont Belvieu for $1.00. Built through fundraising, volunteer labor, and shared dedication, the department has carried that same spirit of service forward for more than five decades.",

  serviceArea:
    "Chambers County — including incorporated areas of Cove, unincorporated surrounding areas, and mutual aid districts across the region.",

  heroStats: [
    { label: "54 Years of Service", value: "54+" },
    { label: "Fire & EMS Protection", value: "24/7" },
    { label: "Chambers County", value: "TX" },
    { label: "Volunteer Department", value: "Proud" },
  ] as const,

  contact: {
    publicPhone: "(281) 573-9193",
    publicPhoneTel: "+12815739193",
    publicEmail: "cvfd@chamberstx.gov",
    formEmail: "cvfd@chamberstx.gov",
    primaryContactName: "Brayden Quijano",
    primaryContactEmail: "braydenquijano0@gmail.com",
    primaryContactPhone: "(409) 692-0044",
    address: {
      street: "5735 S FM 565",
      city: "Cove",
      state: "TX",
      zip: "77523",
      full: "5735 S FM 565, Cove, TX 77523",
    },
    showAddressPublicly: true,
  },

  hours: {
    schedule: [
      { day: "Monday", hours: "7:00 PM – 9:00 PM" },
      { day: "Thursday", hours: "7:00 PM – 9:00 PM" },
    ],
    note: "The station is usually unmanned apart from meeting days. Members may be at the station at other times, but nothing is formally scheduled.",
  },

  social: {
    facebook: "https://www.facebook.com/CoveFireandRescue?mibextid=wwXIfr",
    googleBusiness: "https://share.google/a2qxdRvVFjauR8Df5",
    googleRating: 4.4,
    showReviews: false,
  },

  services: [
    {
      id: "fire-protection",
      title: "Fire Protection",
      description:
        "Structural and wildland fire response for Cove and our primary district, with trained volunteers ready when our community calls.",
      featured: true,
    },
    {
      id: "ems-support",
      title: "EMS Protection / Emergency Medical Response Support",
      description:
        "Emergency medical response support alongside our fire operations, working with regional partners to help neighbors in crisis.",
      featured: false,
    },
    {
      id: "mutual-aid",
      title: "Mutual Aid Support",
      description:
        "Coordinated mutual aid for surrounding districts across Chambers County and beyond when additional resources are needed.",
      featured: false,
    },
    {
      id: "community-response",
      title: "Community Emergency Response",
      description:
        "Community-focused emergency response, public safety outreach, and readiness for incidents that affect our residents.",
      featured: false,
    },
  ],

  seo: {
    defaultDescription:
      "Cove Fire & Rescue serves Cove, Texas and the west side of Chambers County with fire protection, emergency response support, department updates, and volunteer service opportunities.",
    keywords: [
      "Cove Fire & Rescue",
      "Cove Fire Department",
      "Cove TX fire department",
      "Chambers County fire department",
      "Fire protection Cove TX",
      "Volunteer fire department Cove TX",
      "Emergency services Chambers County",
    ],
  },

  mapsEmbedUrl:
    "https://www.google.com/maps?q=5735+S+FM+565,+Cove,+TX+77523&output=embed",
} as const;

export const departmentHistory = `One warm summer night, a group of volunteers met in the Old Cove Community Building to form an organization dedicated to providing safety and security for their families and neighbors. Starting with an old broken-down fire truck purchased from neighboring Mont Belvieu for $1.00, which had to be towed back to Cove, the department was built through untold hours of volunteer labor.

Those early volunteers stayed up all night cooking for fundraisers, repaired and maintained that first fire truck, and worked together to build something lasting for the Cove community. Through that shared effort, a special camaraderie developed — the kind that only comes from working for the common good.

Through it all, Cove Volunteer Fire Department has maintained the high standards and volunteer spirit that have always made Cove, Texas, an extraordinary place to live. We honor those first volunteers and founders whose selfless dedication gave today's firefighters, and future generations, a shining example to follow. As long as people like these exist, communities like ours will continue to have the kind of security that only comes when people truly care about each other.`;

export const galleryCategories = [
  { value: "team", label: "Team & Members" },
  { value: "facility", label: "Station & Facility" },
  { value: "behind_scenes", label: "Behind the Scenes" },
  { value: "projects", label: "Projects & Work" },
  { value: "equipment", label: "Equipment & Apparatus" },
  { value: "events", label: "Events & Community" },
] as const;

export type GalleryCategory = (typeof galleryCategories)[number]["value"];
