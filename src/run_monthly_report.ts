import { generateArchivedPdf } from "./infrai_pdf_client.js";
import { propertyReportRequest, renderReportMarkdown } from "./report_contract.js";

const report = propertyReportRequest.parse({
  property_name: "Juniper Court",
  period_end: "2026-09-30",
  maintenance_requests: [
    { title: "Replace hallway light", due_date: "2026-09-12", status: "open", unit: "2B" },
    { title: "Repair lobby closer", due_date: "2026-09-18", status: "closed", unit: "Lobby" }
  ],
  tenant_documents: [
    { title: "Insurance certificate", due_date: "2026-09-20", tenant: "M. Chen", status: "missing" }
  ],
  inspection_reminders: [
    { title: "Fire panel review", due_date: "2026-09-28", inspector: "North Safety" },
    { title: "Lift inspection", due_date: "2026-10-08", inspector: "Metro Lift" }
  ]
});

const archive = await generateArchivedPdf(
  renderReportMarkdown(report),
  `property-report:${report.property_name}:${report.period_end}`
);
console.log(JSON.stringify({ property_name: report.property_name, period_end: report.period_end, archived_pdf: archive }, null, 2));
