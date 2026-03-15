export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const COLORS = {
  bg: "#0A0A0A",
  text: "#E8E0D0",
  accent: "#C4652A",
  secondary: "#6B7F5E",
  muted: "#E8E0D066",
} as const;

export const SUGGESTIONS = [
  "Night markets of Bangkok",
  "Tacos in Oaxaca",
  "Street food in Lagos",
  "Ramen alleys of Tokyo",
  "Hawker centres of Singapore",
  "Bistros of Lyon",
] as const;
