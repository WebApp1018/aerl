import { boundary } from "@/api/boundary";

// Response from the Prometheus API
interface PrometheusResponse<T> {
  status: "success" | "error";
  data: T;
  errorType?: string;
  error?: string;
  warnings?: string[];
}

// Instant query result
interface QueryResult {
  resultType: "matrix" | "vector" | "scalar" | "string";
  result: any;
}

// Range query reault
interface QueryRangeResult {
  resultType: "matrix";
  result: any;
}

/// Series result
interface SeriesResult {
  [label: string]: string;
}

/// Labels result
type LabelsResult = string[];

/// Label values result
type LabelValuesResult = string[];

/// Exemplar result
interface ExemplarResult {
  resultType: "exemplar";
  result: any;
}

class PrometheusClient {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  // Private method to fetch data from the prometheus API
  private async fetchAPI<T>(
    endpoint: string,
    params: any,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "POST",
  ): Promise<PrometheusResponse<T>> {
    let url = `${this.url}/api/v1${endpoint}?`;

    let paramString: string;

    if (typeof params === "string") {
      paramString = params;
    } else {
      paramString = Object.keys(params)
        .filter((p) => params[p] != undefined)
        .map((key) => `${key}=${params[key]}`)
        .join("&");
    }

    url += paramString;

    const { data, error } = await boundary.request(url.toString(), method);

    if (error) throw new Error(`Prometheus API returned an error`);

    return data;
  }

  /** Instant query */
  async query(
    query: string,
    time?: number | string,
    timeout?: number,
  ): Promise<PrometheusResponse<QueryResult>> {
    if (typeof time == "number") {
      time = Math.round(time);
    }

    const params = { query, time, timeout };
    return this.fetchAPI("/query", params);
  }

  /** Range query */
  async queryRange(
    query: string,
    start: number | string,
    end: number | string,
    step: number,
    timeout?: number,
  ): Promise<PrometheusResponse<QueryRangeResult>> {
    if (typeof start == "number") {
      start = Math.round(start);
    }

    if (typeof end == "number") {
      end = Math.round(end);
    }

    const params = { query, start, end, step, timeout };
    return this.fetchAPI("/query_range", params);
  }

  /** Series query */
  async series(
    match: string[],
    start: number | string,
    end: number | string,
  ): Promise<PrometheusResponse<SeriesResult[]>> {
    if (typeof start == "number") {
      start = Math.round(start);
    }

    if (typeof end == "number") {
      end = Math.round(end);
    }

    let params = match.map((m) => `match[]=${m}`);
    params.push(`start=${start}`);
    params.push(`end=${end}`);

    return this.fetchAPI("/series", params.join("&"));
  }

  /** Label query */
  async labels(
    start?: number | string,
    end?: number | string,
    match?: string[],
  ): Promise<PrometheusResponse<LabelsResult>> {
    if (typeof start == "number") {
      start = Math.round(start);
    }

    if (typeof end == "number") {
      end = Math.round(end);
    }

    let params = match?.map((m) => `match[]=${m}`) ?? [];
    params.push(`start=${start}`);
    params.push(`end=${end}`);

    return this.fetchAPI("/labels", params);
  }

  /** Label value query */
  async labelValues(
    labelName: string,
    start?: number | string,
    end?: number | string,
    match?: string[],
  ): Promise<PrometheusResponse<LabelValuesResult>> {
    if (typeof start == "number") {
      start = Math.round(start);
    }

    if (typeof end == "number") {
      end = Math.round(end);
    }

    let params = match?.map((m) => `match[]=${m}`) ?? [];
    params.push(`start=${start}`);
    params.push(`end=${end}`);

    return this.fetchAPI(`/label/${labelName}/values`, params);
  }

  /** Exemplar query */
  async queryExemplars(
    expr: string,
    start: number | string,
    end: number | string,
  ): Promise<PrometheusResponse<ExemplarResult>> {
    if (typeof start == "number") {
      start = Math.round(start);
    }

    if (typeof end == "number") {
      end = Math.round(end);
    }

    const params = { query: expr, start, end };
    return this.fetchAPI("/query_exemplars", params);
  }
}

export const prometheus = new PrometheusClient("prometheus");
