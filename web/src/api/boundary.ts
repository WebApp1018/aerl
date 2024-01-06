import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/supabase/types";

const boundaryUrl = process.env.NEXT_PUBLIC_BOUNDARY_URL ?? "";

/**
 * Response format
 *
 */
export interface BoundaryResponseSuccess<T> {
  data: T;
  error: null;
}
export interface BoundaryResponseFailure {
  data: null;
  error: BoundaryError;
}

export type BoundaryError = {
  type: string;
  message: String;
};

export class BoundaryClient {
  protected boundaryUrl: string;

  constructor(url: string) {
    this.boundaryUrl = url;
  }

  async request(
    path: string,
    method: string,
    payload?: any,
  ): Promise<BoundaryResponseSuccess<any> | BoundaryResponseFailure> {
    const supabase = createPagesBrowserClient<Database>();
    const auth = await supabase.auth.getSession();

    // Handle auth error
    if (auth.error) {
      console.error("BOUNDARY API ERROR: " + auth.error.message);
      return {
        data: null,
        error: {
          type: "auth",
          message: "Error getting authentication token for boundary request.",
        },
      };
    }

    const url = `${this.boundaryUrl}/${path}`;

    // Make boundary request
    const response = await fetch(url, {
      method: method,
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.data.session?.access_token}`,
      },
      body: payload ? JSON.stringify(payload) : null, // Convert the JSON data to a string
    });

    if (!response.ok) {
      console.error(
        `BOUNDARY API ERROR\n Code: ${response.status}\n message: ${response.statusText}`,
      );
      return {
        data: null,
        error: {
          type: "request",
          message: `Error contacting boundary: ${response.statusText}`,
        },
      };
    }

    return {
      data: await response.json(),
      error: null,
    };
  }
}

export const boundary = new BoundaryClient(boundaryUrl);
