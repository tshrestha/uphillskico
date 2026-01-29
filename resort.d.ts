export interface Resort {
  name: string;
  pass: "Ikon" | "Epic" | "independent";
  website: string;
  uphillPolicy?: {
    link?: string;
    trailMap?: string;
    note?: string;
    operationalHoursAccess?: boolean;
    schedule?: string;
    cost?: string;
  };
}
