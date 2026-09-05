import { z } from "zod";

const datedItem = z.object({
  title: z.string().min(1),
  due_date: z.string().date()
});

export const propertyReportRequest = z.object({
  property_name: z.string().min(1),
  period_end: z.string().date(),
  maintenance_requests: z.array(datedItem.extend({
    status: z.enum(["open", "scheduled", "closed"]),
    unit: z.string().min(1)
  })),
  tenant_documents: z.array(datedItem.extend({
    tenant: z.string().min(1),
    status: z.enum(["missing", "received"])
  })),
  inspection_reminders: z.array(datedItem.extend({
    inspector: z.string().min(1)
  }))
});

export type PropertyReportRequest = z.infer<typeof propertyReportRequest>;

export function selectReportActions(input: PropertyReportRequest) {
  return {
    maintenance: input.maintenance_requests.filter((item) => item.status !== "closed"),
    documents: input.tenant_documents.filter((item) => item.status === "missing"),
    inspections: input.inspection_reminders.filter((item) => item.due_date <= input.period_end)
  };
}

export function renderReportMarkdown(input: PropertyReportRequest): string {
  const actions = selectReportActions(input);
  const rows = [
    ...actions.maintenance.map((item) => `| Maintenance | ${item.unit}: ${item.title} | ${item.due_date} |`),
    ...actions.documents.map((item) => `| Tenant document | ${item.tenant}: ${item.title} | ${item.due_date} |`),
    ...actions.inspections.map((item) => `| Inspection | ${item.title} (${item.inspector}) | ${item.due_date} |`)
  ];

  return [
    `# ${input.property_name} property report`,
    `Period ending: ${input.period_end}`,
    "",
    "| Action | Detail | Due |",
    "| --- | --- | --- |",
    ...(rows.length > 0 ? rows : ["| None | No action due this period | - |"])
  ].join("\n");
}
