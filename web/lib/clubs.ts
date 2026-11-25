export type Club = {
  id: string;
  name: string;
  category: string;
  logoUrl?: string;
  majors: string[];
  description: string;
  commitment: number;
  selectivity: string;
  application: string;
  recruitingWindow?: string;
  website: string;
  events: { date: string; time: string; title: string }[];
};

// Temporary records until the user's club database is connected.
export const clubs: Club[] = [
  {
    id: "uig",
    name: "Undergraduate Investment Group",
    category: "Finance",
    majors: ["Economics", "Business Economics", "Mathematics"],
    description: "",
    commitment: 4,
    selectivity: "Application",
    application: "Applications open",
    website: "",
    events: [],
  },
  {
    id: "acm",
    name: "UCLA ACM",
    category: "STEM",
    majors: ["Computer Science", "Engineering", "Mathematics"],
    description: "",
    commitment: 3,
    selectivity: "Open membership",
    application: "Open to join",
    website: "",
    events: [],
  },
  {
    id: "consulting",
    name: "Bruin Consulting",
    category: "Consulting",
    majors: ["Economics", "Business Economics", "Political Science"],
    description: "",
    commitment: 6,
    selectivity: "Application",
    application: "Applications open",
    website: "",
    events: [],
  },
  {
    id: "ewb",
    name: "Engineers Without Borders at UCLA",
    category: "STEM",
    majors: ["Engineering", "Environmental Science", "Computer Science"],
    description: "",
    commitment: 5,
    selectivity: "Open membership",
    application: "Open to join",
    website: "",
    events: [],
  },
  {
    id: "design",
    name: "Design at UCLA",
    category: "Design",
    majors: ["Design Media Arts", "Computer Science", "Psychology"],
    description: "",
    commitment: 4,
    selectivity: "Application",
    application: "Info session Dec 1",
    website: "",
    events: [],
  },
  {
    id: "uba",
    name: "Undergraduate Business Association",
    category: "Finance",
    majors: ["Business Economics", "Economics", "Psychology"],
    description: "",
    commitment: 2,
    selectivity: "Open membership",
    application: "Open to join",
    website: "",
    events: [],
  },
];

export const categories = ["All clubs", "Finance", "STEM", "Consulting", "Design"];

export const majors = [
  "All majors",
  "Business Economics",
  "Computer Science",
  "Economics",
  "Engineering",
  "Environmental Science",
  "Mathematics",
  "Political Science",
  "Psychology",
];
