import { z } from "zod";

export const analysisFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  education: z.string().min(1, "Education level is required"),
  skills: z
    .array(z.string().min(1))
    .min(1, "At least one skill is required"),
  careerGoal: z
    .string()
    .min(10, "Describe your career goal in at least 10 characters")
    .max(500, "Career goal must be under 500 characters"),
  country: z.string().min(1, "Country is required"),
});

export type AnalysisFormData = z.infer<typeof analysisFormSchema>;

export const educationLevels = [
  { value: "high_school", label: "High School" },
  { value: "undergraduate", label: "Undergraduate Student" },
  { value: "graduate", label: "Graduate Student (Masters/PhD)" },
  { value: "recent_graduate", label: "Recent Graduate" },
  { value: "professional", label: "Working Professional" },
  { value: "self_taught", label: "Self-Taught / No Formal Education" },
] as const;

export const africanCountries = [
  "Algeria",
  "Angola",
  "Benin",
  "Botswana",
  "Burkina Faso",
  "Burundi",
  "Cameroon",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Comoros",
  "Congo",
  "Democratic Republic of the Congo",
  "Djibouti",
  "Egypt",
  "Equatorial Guinea",
  "Eritrea",
  "Ethiopia",
  "Gabon",
  "Gambia",
  "Ghana",
  "Guinea",
  "Guinea-Bissau",
  "Ivory Coast",
  "Kenya",
  "Lesotho",
  "Liberia",
  "Libya",
  "Madagascar",
  "Malawi",
  "Mali",
  "Mauritania",
  "Mauritius",
  "Morocco",
  "Mozambique",
  "Namibia",
  "Niger",
  "Nigeria",
  "Rwanda",
  "Sao Tome and Principe",
  "Senegal",
  "Seychelles",
  "Sierra Leone",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Sudan",
  "Swaziland",
  "Tanzania",
  "Togo",
  "Tunisia",
  "Uganda",
  "Zambia",
  "Zimbabwe",
] as const;
