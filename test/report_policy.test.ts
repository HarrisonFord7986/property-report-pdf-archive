import assert from "node:assert/strict";
import test from "node:test";
import { propertyReportRequest, renderReportMarkdown } from "../src/report_contract.js";

test("the period report carries only work that needs attention", () => {
  const input = propertyReportRequest.parse({
    property_name: "Juniper Court",
    period_end: "2026-09-30",
    maintenance_requests: [
      { title: "Open leak", due_date: "2026-09-12", status: "open", unit: "2B" },
      { title: "Closed latch", due_date: "2026-09-10", status: "closed", unit: "1A" }
    ],
    tenant_documents: [
      { title: "Insurance", due_date: "2026-09-20", tenant: "M. Chen", status: "missing" },
      { title: "Lease", due_date: "2026-09-01", tenant: "J. Smith", status: "received" }
    ],
    inspection_reminders: [
      { title: "Fire panel", due_date: "2026-09-28", inspector: "North Safety" },
      { title: "Lift", due_date: "2026-10-08", inspector: "Metro Lift" }
    ]
  });

  const markdown = renderReportMarkdown(input);
  assert.match(markdown, /Open leak/);
  assert.match(markdown, /Insurance/);
  assert.match(markdown, /Fire panel/);
  assert.doesNotMatch(markdown, /Closed latch|Lease|Lift/);
});
