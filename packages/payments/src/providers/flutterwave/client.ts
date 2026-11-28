export type FlutterwaveClientOptions = {
  secretKey: string;
  publicKey?: string;
  /** Default https://api.flutterwave.com/v3 */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  /** Optional secret hash for webhook verif-hash checks. */
  secretHash?: string;
};

export type FlutterwaveApiResponse<T> = {
  status: string;
  message: string;
  data: T;
};

export class FlutterwaveApiError extends Error {
  readonly statusCode: number;
  readonly body: unknown;

  constructor(message: string, statusCode: number, body: unknown) {
    super(message);
    this.name = 'FlutterwaveApiError';
    this.statusCode = statusCode;
    this.body = body;
  }
}

/**
 * Thin HTTP client for Flutterwave v3.
 * Endpoints documented at https://developer.flutterwave.com (Bearer secret key).
 */
export class FlutterwaveClient {
  readonly secretKey: string;
  readonly publicKey: string | undefined;
  readonly baseUrl: string;
  readonly secretHash: string | undefined;
  private readonly fetchImpl: typeof fetch;

  constructor(options: FlutterwaveClientOptions) {
    if (!options.secretKey?.trim()) {
      throw new Error('FLW_SECRET_KEY is required for FlutterwaveClient.');
    }
    this.secretKey = options.secretKey.trim();
    this.publicKey = options.publicKey?.trim();
    this.baseUrl = (options.baseUrl ?? 'https://api.flutterwave.com/v3').replace(/\/+$/, '');
    this.secretHash = options.secretHash?.trim() || undefined;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  get sandbox(): boolean {
    return this.secretKey.includes('_TEST') || this.secretKey.includes('TEST');
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    options: {
      body?: unknown;
      idempotencyKey?: string;
    } = {},
  ): Promise<FlutterwaveApiResponse<T>> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (options.idempotencyKey) {
      headers['X-Idempotency-Key'] = options.idempotencyKey;
    }

    const response = await this.fetchImpl(url, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    let payload: unknown = null;
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = { raw: text };
      }
    }

    if (!response.ok) {
      const message =
        typeof payload === 'object' &&
        payload !== null &&
        'message' in payload &&
        typeof (payload as { message?: unknown }).message === 'string'
          ? (payload as { message: string }).message
          : `Flutterwave HTTP ${response.status}`;
      throw new FlutterwaveApiError(message, response.status, payload);
    }

    return payload as FlutterwaveApiResponse<T>;
  }
}

export function loadFlutterwaveClientFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl?: typeof fetch,
): FlutterwaveClient {
  return new FlutterwaveClient({
    secretKey: env.FLW_SECRET_KEY ?? '',
    publicKey: env.FLW_PUBLIC_KEY,
    baseUrl: env.FLW_BASE_URL,
    secretHash: env.FLW_SECRET_HASH,
    fetchImpl,
  });
}
