import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireAuth, requirePermission } from "@/core/permissions/server";

interface ExportRequest {
  reportType: string;
  format: "csv" | "excel" | "pdf";
  filters: Record<string, unknown>;
  data: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "report.export");
    if (permError) return permError;

    const body: ExportRequest = await request.json();
    const { reportType, format, filters, data } = body;
    const organizationId = context.organizationId;

    // PDF is handled separately from CSV/Excel below: it produces binary
    // bytes (a real PDF document via pdf-lib), not a string, so it can't
    // share the same `content: string` variable/response path.
    if (format === "pdf") {
      const pdfBytes = await generatePDF(data, reportType);
      const filename = `${reportType}-${new Date().toISOString().split("T")[0]}.pdf`;

      await supabase.from("report_audit_logs").insert({
        organization_id: organizationId,
        user_id: context.userId,
        report_type: reportType,
        action: "exported",
        export_format: format,
        filters,
        row_count: getRowCount(data, reportType),
      });

      const pdfBuffer = Buffer.from(pdfBytes);

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": String(pdfBuffer.length),
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "csv") {
      const result = generateCSV(data, reportType);
      content = result.content;
      filename = `${reportType}-${new Date().toISOString().split("T")[0]}.csv`;
      mimeType = "text/csv";
    } else if (format === "excel") {
      // No xlsx-writing library is a dependency of this project, so this
      // produces CSV content rather than a real .xlsx binary. Naming it
      // ".csv" (not ".xlsx") keeps the file honest about its own format -
      // Excel opens CSV natively either way, whereas a ".xlsx"-named file
      // with CSV bytes inside triggers a "format doesn't match extension"
      // warning on open.
      const result = generateCSV(data, reportType);
      content = result.content;
      filename = `${reportType}-${new Date().toISOString().split("T")[0]}.csv`;
      mimeType = "text/csv";
    } else {
      return NextResponse.json({ error: "Invalid export format" }, { status: 400 });
    }

    // Log export
    await supabase.from("report_audit_logs").insert({
      organization_id: organizationId,
      user_id: context.userId,
      report_type: reportType,
      action: "exported",
      export_format: format,
      filters,
      row_count: getRowCount(data, reportType),
    });

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateCSV(data: Record<string, unknown>, reportType: string): { content: string } {
  let rows: string[][] = [];
  let headers: string[] = [];

  const reportData = ((data.data as Record<string, unknown>) || {}) as Record<string, unknown>;

  if (reportType === "operational") {
    headers = ["Metric", "Value"];
    rows = [
      ["Total Scheduled", String(reportData.totalScheduled || "0")],
      ["Completion Rate %", String(reportData.completionRate || "0")],
      ["Completed", String(reportData.completed || "0")],
      ["Cancelled", String(reportData.cancelled || "0")],
      ["No Shows", String(reportData.noShows || "0")],
      ["Average Duration (minutes)", String(reportData.avgDuration || "0")],
      ["Active Employees", String(reportData.uniqueEmployees || "0")],
      ["Active Clients", String(reportData.uniqueClients || "0")],
      ["Assignments", String(reportData.assignmentCount || "0")],
    ];
  } else if (reportType === "financial") {
    headers = ["Metric", "Amount (€)"];
    rows = [
      ["Total Revenue", String(reportData.totalRevenue || "0")],
      ["Total Paid", String(reportData.totalPaid || "0")],
      ["Total Outstanding", String(reportData.totalOutstanding || "0")],
      ["Overdue Amount", String(reportData.overdueAmount || "0")],
      ["Number of Invoices", String(reportData.invoiceCount || "0")],
      ["Average Invoice Value", String(reportData.avgInvoiceValue || "0")],
    ];
  } else if (reportType === "employees") {
    headers = [
      "Employee Name",
      "Email",
      "Billable Hours",
      "Completed Visits",
      "Total Revenue",
      "Utilization %",
    ];
    const metrics =
      (data.data as Record<string, Record<string, unknown>> | undefined)?.employeeMetrics || {};
    rows = Object.entries(metrics).map(([, emp]) => {
      const empData = emp as Record<string, unknown>;
      return [
        String(empData.name || ""),
        String(empData.email || ""),
        String(empData.billableHours || "0"),
        String(empData.completedVisits || "0"),
        `€${empData.totalRevenue || "0"}`,
        `${((((empData.billableHours as number) || 0) / 40) * 100).toFixed(2)}%`,
      ];
    });
  } else if (reportType === "clients") {
    headers = [
      "Client Name",
      "Email",
      "Risk Level",
      "Completed Visits",
      "Outstanding Balance",
      "Average Monthly Cost",
    ];
    const metrics =
      (data.data as Record<string, Record<string, unknown>> | undefined)?.clientMetrics || {};
    rows = Object.entries(metrics).map(([, client]) => {
      const clientData = client as Record<string, unknown>;
      return [
        String(clientData.name || ""),
        String(clientData.email || ""),
        String(clientData.riskLevel || "Unknown"),
        String(clientData.completedVisits || "0"),
        `€${clientData.outstanding || "0"}`,
        `€${clientData.avgMonthlyCost || "0"}`,
      ];
    });
  } else if (reportType === "careplans") {
    headers = [
      "Care Plan ID",
      "Status",
      "Total Goals",
      "Completed Goals",
      "Total Tasks",
      "Completed Tasks",
      "Review Compliance %",
    ];
    const metrics =
      (data.data as Record<string, Record<string, unknown>> | undefined)?.carePlanMetrics || {};
    rows = Object.entries(metrics).map(([id, plan]) => {
      const planData = plan as Record<string, unknown>;
      return [
        id,
        String(planData.status || ""),
        String(planData.totalGoals || "0"),
        String(planData.completedGoals || "0"),
        String(planData.totalTasks || "0"),
        String(planData.completedTasks || "0"),
        `${planData.reviewCompliancePercent || "0"}%`,
      ];
    });
  } else if (reportType === "branch") {
    headers = [
      "Branch",
      "Employees",
      "Clients",
      "Visits",
      "Revenue (€)",
      "Billable Hours",
      "Avg Hourly Rate (€)",
    ];
    const metrics =
      (data.data as Record<string, Record<string, unknown>> | undefined)?.branchMetrics || {};
    rows = Object.entries(metrics).map(([, branch]) => {
      const branchData = branch as Record<string, unknown>;
      return [
        String(branchData.branchName || ""),
        String(branchData.employeeCount || "0"),
        String(branchData.clientCount || "0"),
        String(branchData.visitCount || "0"),
        String(branchData.totalRevenue || "0"),
        String(branchData.billableHours || "0"),
        String(branchData.averageHourlyRate || "0"),
      ];
    });
  }

  // Generate CSV - escape embedded quotes so a cell value containing a
  // double-quote can't break the row's column count.
  const escapeCell = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
  const csvContent = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ].join("\n");

  return { content: csvContent };
}

// Builds the same report content as generateCSV, as plain text lines, so
// every report type that CSV supports also has real data in its PDF
// (the previous PDF path only ever covered "operational"/"financial").
function buildReportLines(data: Record<string, unknown>, reportType: string): string[] {
  const timestamp = new Date().toLocaleString();
  const lines: string[] = [
    `REPORT: ${reportType.toUpperCase()}`,
    `Generated: ${timestamp}`,
    "=".repeat(50),
    "",
  ];

  const reportData = ((data.data as Record<string, unknown>) || {}) as Record<string, unknown>;

  if (reportType === "operational") {
    lines.push(
      "Operational Metrics Report",
      "",
      `Total Scheduled Visits: ${reportData.totalScheduled || 0}`,
      `Completion Rate: ${((reportData.completionRate as number) || 0).toFixed(2)}%`,
      `Completed: ${reportData.completed || 0}`,
      `Cancelled: ${reportData.cancelled || 0}`,
      `No Shows: ${reportData.noShows || 0}`,
      `Average Duration: ${reportData.avgDuration || 0} minutes`,
      `Active Employees: ${reportData.uniqueEmployees || 0}`,
      `Active Clients: ${reportData.uniqueClients || 0}`,
      `Assignments: ${reportData.assignmentCount || 0}`
    );
  } else if (reportType === "financial") {
    lines.push(
      "Financial Report",
      "",
      `Total Revenue: EUR ${reportData.totalRevenue || 0}`,
      `Total Paid: EUR ${reportData.totalPaid || 0}`,
      `Total Outstanding: EUR ${reportData.totalOutstanding || 0}`,
      `Overdue Amount: EUR ${reportData.overdueAmount || 0}`,
      `Number of Invoices: ${reportData.invoiceCount || 0}`,
      `Average Invoice Value: EUR ${reportData.avgInvoiceValue || 0}`
    );
  } else if (reportType === "employees") {
    lines.push("Employee Report", "");
    const metrics =
      (data.data as Record<string, Record<string, unknown>> | undefined)?.employeeMetrics || {};
    for (const emp of Object.values(metrics)) {
      const e = emp as Record<string, unknown>;
      lines.push(
        `${e.name || ""} (${e.email || ""})`,
        `  Billable Hours: ${e.billableHours || 0}  Completed Visits: ${e.completedVisits || 0}  Revenue: EUR ${e.totalRevenue || 0}`,
        ""
      );
    }
  } else if (reportType === "clients") {
    lines.push("Client Report", "");
    const metrics =
      (data.data as Record<string, Record<string, unknown>> | undefined)?.clientMetrics || {};
    for (const client of Object.values(metrics)) {
      const c = client as Record<string, unknown>;
      lines.push(
        `${c.name || ""} (${c.email || ""})`,
        `  Risk: ${c.riskLevel || "Unknown"}  Completed Visits: ${c.completedVisits || 0}  Outstanding: EUR ${c.outstanding || 0}  Avg Monthly Cost: EUR ${c.avgMonthlyCost || 0}`,
        ""
      );
    }
  } else if (reportType === "careplans") {
    lines.push("Care Plans Report", "");
    const metrics =
      (data.data as Record<string, Record<string, unknown>> | undefined)?.carePlanMetrics || {};
    for (const [id, plan] of Object.entries(metrics)) {
      const p = plan as Record<string, unknown>;
      lines.push(
        `Care Plan ${id} - ${p.status || ""}`,
        `  Goals: ${p.completedGoals || 0}/${p.totalGoals || 0}  Tasks: ${p.completedTasks || 0}/${p.totalTasks || 0}  Review Compliance: ${p.reviewCompliancePercent || 0}%`,
        ""
      );
    }
  } else if (reportType === "branch") {
    lines.push("Branch Performance Report", "");
    const metrics =
      (data.data as Record<string, Record<string, unknown>> | undefined)?.branchMetrics || {};
    for (const branch of Object.values(metrics)) {
      const b = branch as Record<string, unknown>;
      lines.push(
        `${b.branchName || ""}`,
        `  Employees: ${b.employeeCount || 0}  Clients: ${b.clientCount || 0}  Visits: ${b.visitCount || 0}  Revenue: EUR ${b.totalRevenue || 0}  Billable Hours: ${b.billableHours || 0}`,
        ""
      );
    }
  }

  return lines;
}

async function generatePDF(data: Record<string, unknown>, reportType: string): Promise<Uint8Array> {
  const lines = buildReportLines(data, reportType);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const lineHeight = fontSize * 1.4;
  const margin = 50;
  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const maxCharsPerLine = 95;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawLine = (line: string) => {
    if (y < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
    y -= lineHeight;
  };

  for (const rawLine of lines) {
    if (rawLine.length <= maxCharsPerLine) {
      drawLine(rawLine);
      continue;
    }
    // Wrap long lines so text never runs off the page edge.
    let remaining = rawLine;
    while (remaining.length > maxCharsPerLine) {
      let breakAt = remaining.lastIndexOf(" ", maxCharsPerLine);
      if (breakAt <= 0) breakAt = maxCharsPerLine;
      drawLine(remaining.slice(0, breakAt));
      remaining = remaining.slice(breakAt).trimStart();
    }
    drawLine(remaining);
  }

  return pdfDoc.save();
}

function getRowCount(data: Record<string, unknown>, reportType: string): number {
  const reportData = (data as Record<string, unknown>).data as Record<string, unknown>;
  if (!reportData) return 1;

  if (reportType === "employees") {
    const metrics = (reportData.employeeMetrics as Record<string, unknown>) || {};
    return Object.keys(metrics).length;
  }
  if (reportType === "clients") {
    const metrics = (reportData.clientMetrics as Record<string, unknown>) || {};
    return Object.keys(metrics).length;
  }
  if (reportType === "careplans") {
    const metrics = (reportData.carePlanMetrics as Record<string, unknown>) || {};
    return Object.keys(metrics).length;
  }
  if (reportType === "branch") {
    const metrics = (reportData.branchMetrics as Record<string, unknown>) || {};
    return Object.keys(metrics).length;
  }
  const summary = (reportData.summary as Record<string, unknown>) || {};
  return (summary.totalPlans as number) || (reportData.invoiceCount as number) || 1;
}
