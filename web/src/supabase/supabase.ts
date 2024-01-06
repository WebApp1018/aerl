import { Tables } from "./types";

export interface UserMetadata {
  full_name: string | undefined;
  email: string | undefined;
  phone: string | undefined;
  org: Tables<"org">;
}

// For the column `metadata` in the table `hub`
export interface HubMetadata {
  hardware?: {
    som?: {
      part_number?: string,
      revision?: string,
      serial?: string,
    }
  }
}
