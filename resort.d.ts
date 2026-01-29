export interface Resort {
  name: string;
  pass: "Ikon" | "Epic" | "independent";
  website: string;
  uphillPolicy?: {
    rank?: number;
    link?: string | null;
    trailMap?: string;
    note?: string;
    operationalHoursAccess?: boolean;
    schedule?: string;
    cost?: string;
  };
}
