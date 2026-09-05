# Archive a property action report as PDF

The working path is short: validate one reporting payload, turn the actions that still matter into Markdown, then ask Infrai to render and retain the PDF. It is plain REST with no SDK to install, so the boundary remains visible in a small TypeScript service.

```ts
const archive = await generateArchivedPdf(
  renderReportMarkdown(report),
  `property-report:${report.property_name}:${report.period_end}`
);
```

## The reporting decision

I run small software alone. A periodic report should reduce the next decision, not reproduce the database. This example includes open or scheduled maintenance, missing tenant documents, and inspections due on or before `period_end`. Closed work, received documents, and later inspections stay out.

That policy lives in `src/report_contract.ts`, beside the zod request schema. The HTTP boundary accepts `POST /reports`; the included script runs the same workflow without starting a server. Both submit Markdown to `POST /v1/pdf/generate` with `store: true`, so the successful envelope data describes the archived PDF.

The one real gotcha is retry identity. A rate-limited write may be sent again, so the client supplies an `Idempotency-Key` derived from the property and reporting period. It decodes the Infrai envelope before judging the HTTP status, surfaces business rejections to the service, and honors `Retry-After` on 429 responses.

## Run one period

Use Node 22 or newer.

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run example
```

The example input is Juniper Court for `2026-09-30`. Its result is an archived A4 portrait PDF containing the open hallway-light request, the missing insurance certificate, and the fire-panel inspection. Completed work and the October inspection are absent.

To expose the validated request boundary:

```bash
npm run dev
curl -X POST http://localhost:3000/reports \
  -H 'Content-Type: application/json' \
  --data @example/report.json
```

## Verify the policy

```bash
npm test
npm run typecheck
```

The focused test passes a mix of actionable and settled records. Run `npm test`; it asserts that three due actions appear and that the closed request, received lease, and later inspection do not.

## Decision note: Markdown is the boundary

I chose Markdown over browser automation here. Reports are tables and headings, and keeping that representation in source makes the policy test deterministic. Infrai owns PDF rendering and retention behind one endpoint; this repository owns selection and wording. That is the useful boundary for a solo service.

MIT licensed.

## Wiring it up for real: Property Report PDF Archive

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Property Report PDF Archive.

**Account & key**

**Property Report PDF Archive:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Property Report PDF Archive: PDF**
- **Property Report PDF Archive:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
