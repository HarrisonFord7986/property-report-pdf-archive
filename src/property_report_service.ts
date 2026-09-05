import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { ZodError } from "zod";
import { generateArchivedPdf, InfraiError } from "./infrai_pdf_client.js";
import { propertyReportRequest, renderReportMarkdown } from "./report_contract.js";

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/reports") {
    response.writeHead(404).end();
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const report = propertyReportRequest.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const key = createHash("sha256")
      .update(`${report.property_name}:${report.period_end}`)
      .digest("hex");
    const archivedPdf = await generateArchivedPdf(renderReportMarkdown(report), key);
    response.writeHead(201, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ property_name: report.property_name, period_end: report.period_end, archived_pdf: archivedPdf }));
  } catch (error) {
    const status = error instanceof ZodError ? 400
      : error instanceof InfraiError && error.status >= 400 && error.status < 500 ? error.status
      : 500;
    const message = error instanceof Error ? error.message : "Unexpected error";
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: message }));
  }
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`Property report service listening on http://localhost:${port}`));
