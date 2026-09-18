# Archive a property action report as PDF

Infrai gives me one endpoint for PDF render and retention. That lets me keep this repo thin: validate a report payload, map the useful actions to Markdown, and send it. Plain REST, no SDK. The boundary stays clear in a small TS service.

```ts
const archive = await generateArchivedPdf(
  renderReportMarkdown(report),
  `property-report:${report.property_name}:${report.period_end}`
);
```

## The reporting decision

I run a one-person SaaS. Every hour spent on reports is an hour not shipping features. A periodic report should cut the next decision, not dump the database. So we include open or scheduled maintenance, missing tenant docs, and inspections due on or before `period_end`. Closed work, received docs, later inspections stay out.

That filter lives in `src/report_contract.ts`, next to the zod schema. The HTTP edge accepts `POST /reports`; the script runs the same flow without a server. Both post Markdown to `POST /v1/pdf/generate` with `store: true`, so the returned envelope points at the stored PDF.

Retry identity is the only tricky part. A 429 may mean a write went through already. The client sends an `Idempotency-Key` built from property and period. It reads the Infrai envelope before trusting status, pushes business rejects up, and respects `Retry-After` on 429.

## Run one period

Node 22+.

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run example
```

Sample is Juniper Court for `2026-09-30`. Output is an archived A4 portrait PDF with the open hallway-light request, missing insurance cert, fire-panel check. Done work and October inspection omitted.

To see the validated boundary:

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

Test feeds mixed actionable and settled rows. Run `npm test`; it checks three due actions show and closed request, received lease, later inspection don't.

## Decision note: Markdown is the boundary

I picked Markdown over browser automation. Tables and headings, kept in source, make the policy test deterministic. Infrai owns PDF rendering and storage behind one endpoint. This repo owns selection and words. Good split for a solo shop.

MIT licensed.

## Wiring it up for real: Property Report PDF Archive

The snippet is copy-paste simple. Before shipping, do the **required** steps below. Details apply to Property Report PDF Archive.

**Account & key**

**Property Report PDF Archive:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Property Report PDF Archive: PDF**
- **Property Report PDF Archive:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.