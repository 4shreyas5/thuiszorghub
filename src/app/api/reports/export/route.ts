import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

interface ExportRequest {
  reportType: string;
  format: "csv" | "excel" | "pdf";
  filters: Record<string, any>;
  data: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body: ExportRequest = await request.json();
    const { reportType, format, filters, data } = body;
    const organizationId = userData.organization_id;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "csv") {
      const result = generateCSV(data, reportType);
      content = result.content;
      filename = `${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = "text/csv";
    } else if (format === "excel") {
      // For Excel, we'll return CSV data - real Excel generation would require a library
      const result = generateCSV(data, reportType);
      content = result.content;
      filename = `${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = "application/vnd.ms-excel";
    } else if (format === "pdf") {
      // For PDF, return plain text format that can be converted on client side
      const result = generatePDFText(data, reportType);
      content = result;
      filename = `${reportType}-${new Date().toISOString().split('T')[0]}.txt`;
      mimeType = "text/plain";
    } else {
      return NextResponse.json(
        { error: "Invalid export format" },
        { status: 400 }
      );
    }

    // Log export
    await supabase
      .from("report_audit_logs")
      .insert({
        organization_id: organizationId,
        user_id: user.id,
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateCSV(data: Record<string, any>, reportType: string): { content: string } {
  let rows: string[][] = [];
  let headers: string[] = [];

  if (reportType === "operational") {
    headers = [
      "Metric",
      "Value",
    ];
    rows = [
      ["Total Scheduled", data.data?.totalScheduled?.toString() || "0"],
      ["Completion Rate %", data.data?.completionRate?.toString() || "0"],
      ["Completed", data.data?.completed?.toString() || "0"],
      ["Cancelled", data.data?.cancelled?.toString() || "0"],
      ["No Shows", data.data?.noShows?.toString() || "0"],
      ["Average Duration (minutes)", data.data?.avgDuration?.toString() || "0"],
      ["Active Employees", data.data?.uniqueEmployees?.toString() || "0"],
      ["Active Clients", data.data?.uniqueClients?.toString() || "0"],
      ["Assignments", data.data?.assignmentCount?.toString() || "0"],
    ];
  } else if (reportType === "financial") {
    headers = [
      "Metric",
      "Amount (€)",
    ];
    rows = [
      ["Total Revenue", data.data?.totalRevenue?.toString() || "0"],
      ["Total Paid", data.data?.totalPaid?.toString() || "0"],
      ["Total Outstanding", data.data?.totalOutstanding?.toString() || "0"],
      ["Overdue Amount", data.data?.overdueAmount?.toString() || "0"],
      ["Number of Invoices", data.data?.invoiceCount?.toString() || "0"],
      ["Average Invoice Value", data.data?.avgInvoiceValue?.toString() || "0"],
    ];
  } else if (reportType === "employees") {
    headers = ["Employee Name", "Email", "Billable Hours", "Completed Visits", "Total Revenue", "Utilization %"];
    const metrics = data.data?.employeeMetrics || {};
    rows = Object.entries(metrics).map(([, emp]: [string, any]) => [
      emp.name,
      emp.email,
      emp.billableHours?.toString() || "0",
      emp.completedVisits?.toString() || "0",
      `€${emp.totalRevenue?.toString() || "0"}`,
      `${((emp.billableHours || 0) / 40 * 100).toFixed(2)}%`,
    ]);
  } else if (reportType === "clients") {
    headers = ["Client Name", "Email", "Risk Level", "Completed Visits", "Outstanding Balance", "Average Monthly Cost"];
    const metrics = data.data?.clientMetrics || {};
    rows = Object.entries(metrics).map(([, client]: [string, any]) => [
      client.name,
      client.email,
      client.riskLevel || "Unknown",
      client.completedVisits?.toString() || "0",
      `€${client.outstanding?.toString() || "0"}`,
      `€${client.avgMonthlyCost?.toString() || "0"}`,
    ]);
  } else if (reportType === "careplans") {
    headers = ["Care Plan ID", "Status", "Total Goals", "Completed Goals", "Total Tasks", "Completed Tasks", "Review Compliance %"];
    const metrics = data.data?.carePlanMetrics || {};
    rows = Object.entries(metrics).map(([id, plan]: [string, any]) => [
      id,
      plan.status,
      plan.totalGoals?.toString() || "0",
      plan.completedGoals?.toString() || "0",
      plan.totalTasks?.toString() || "0",
      plan.completedTasks?.toString() || "0",
      `${plan.reviewCompliancePercent?.toString() || "0"}%`,
    ]);
  }

  // Generate CSV
  const csvContent = [
    headers.map(h => `"${h}"`).join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
  ].join("\n");

  return { content: csvContent };
}

function generatePDFText(data: Record<string, any>, reportType: string): string {
  const timestamp = new Date().toLocaleString();
  let text = `REPORT: ${reportType.toUpperCase()}\nGenerated: ${timestamp}\n${"=".repeat(50)}\n\n`;

  if (reportType === "operational") {
    text += `Operational Metrics Report\n\n`;
    text += `Total Scheduled Visits: ${data.data?.totalScheduled || 0}\n`;
    text += `Completion Rate: ${data.data?.completionRate?.toFixed(2) || 0}%\n`;
    text += `Completed: ${data.data?.completed || 0}\n`;
    text += `Cancelled: ${data.data?.cancelled || 0}\n`;
    text += `No Shows: ${data.data?.noShows || 0}\n`;
    text += `Average Duration: ${data.data?.avgDuration || 0} minutes\n`;
    text += `Active Employees: ${data.data?.uniqueEmployees || 0}\n`;
    text += `Active Clients: ${data.data?.uniqueClients || 0}\n`;
  } else if (reportType === "financial") {
    text += `Financial Report\n\n`;
    text += `Total Revenue: €${data.data?.totalRevenue || 0}\n`;
    text += `Total Paid: €${data.data?.totalPaid || 0}\n`;
    text += `Total Outstanding: €${data.data?.totalOutstanding || 0}\n`;
    text += `Overdue Amount: €${data.data?.overdueAmount || 0}\n`;
    text += `Number of Invoices: ${data.data?.invoiceCount || 0}\n`;
    text += `Average Invoice Value: €${data.data?.avgInvoiceValue || 0}\n`;
  }

  return text;
}

function getRowCount(data: Record<string, any>, reportType: string): number {
  if (reportType === "employees") {
    return Object.keys(data.data?.employeeMetrics || {}).length;
  }
  if (reportType === "clients") {
    return Object.keys(data.data?.clientMetrics || {}).length;
  }
  if (reportType === "careplans") {
    return Object.keys(data.data?.carePlanMetrics || {}).length;
  }
  return data.data?.summary?.totalPlans || data.data?.invoiceCount || 1;
}
