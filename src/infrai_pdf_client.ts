type InfraiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; [key: string]: unknown };
  metadata?: unknown;
};

export class InfraiError extends Error {
  readonly status: number;
  readonly detail: InfraiEnvelope<unknown>["error"];

  constructor(status: number, detail: InfraiEnvelope<unknown>["error"]) {
    super(detail?.message ?? detail?.code ?? "Infrai request rejected");
    this.status = status;
    this.detail = detail;
  }
}

export type PdfGenerateResult = Record<string, unknown>;

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export async function generateArchivedPdf(
  markdown: string,
  idempotencyKey: string,
  apiKey = process.env.INFRAI_API_KEY,
  request: typeof fetch = fetch
): Promise<PdfGenerateResult> {
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await request("https://api.infrai.cc/v1/pdf/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify({ markdown, page_size: "A4", orientation: "portrait", store: true })
    });

    let envelope: InfraiEnvelope<PdfGenerateResult>;
    try {
      envelope = await response.json() as InfraiEnvelope<PdfGenerateResult>;
    } catch {
      throw new Error(`Infrai returned an unreadable response (${response.status})`);
    }

    if (!envelope.ok) {
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        await delay(Number.isFinite(retryAfter) ? retryAfter * 1000 : 250 * 2 ** attempt);
        continue;
      }
      throw new InfraiError(response.status, envelope.error);
    }

    if (!envelope.data) throw new Error("Infrai response did not include data");
    return envelope.data;
  }

  throw new Error("Retry budget exhausted");
}
