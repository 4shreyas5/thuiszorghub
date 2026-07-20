import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireAuth, requirePermission } from "@/core/permissions/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "billing.view");
    if (permError) return permError;

    const { data: invoice } = await supabase
      .from("invoices")
      .select(
        `*,
        items:invoice_items(*),
        client:clients(first_name, last_name, email, phone),
        branch:branches(name),
        organization:organizations(name)`
      )
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const pdfBytes = await generateInvoicePdf(invoice);
    const pdfBuffer = Buffer.from(pdfBytes);
    const filename = `${invoice.invoice_number}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.length),
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return NextResponse.json({ error: "Failed to generate invoice PDF" }, { status: 500 });
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function generateInvoicePdf(invoice: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 50;
  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  const black = rgb(0.1, 0.1, 0.1);
  const gray = rgb(0.45, 0.45, 0.45);

  const draw = (text: string, x: number, size: number, useFont = font, color = black) => {
    page.drawText(text, { x, y, size, font: useFont, color });
  };

  const formatMoney = (value: unknown) => `EUR ${Number(value || 0).toFixed(2)}`;
  const formatDate = (value: unknown) =>
    value ? new Date(String(value)).toLocaleDateString("nl-NL") : "-";

  draw(invoice.organization?.name || "Invoice", margin, 18, bold);
  draw("INVOICE", pageWidth - margin - 90, 18, bold);
  y -= 30;

  draw(`Invoice #: ${invoice.invoice_number}`, margin, 10, font, gray);
  y -= 14;
  draw(`Invoice date: ${formatDate(invoice.invoice_date)}`, margin, 10, font, gray);
  y -= 14;
  draw(`Due date: ${formatDate(invoice.due_date)}`, margin, 10, font, gray);
  y -= 14;
  draw(`Status: ${String(invoice.status || "").toUpperCase()}`, margin, 10, font, gray);
  y -= 30;

  draw("Bill to", margin, 11, bold);
  y -= 16;
  const clientName = invoice.client
    ? `${invoice.client.first_name || ""} ${invoice.client.last_name || ""}`.trim()
    : "Unknown client";
  draw(clientName || "Unknown client", margin, 10);
  y -= 14;
  if (invoice.client?.email) {
    draw(invoice.client.email, margin, 10, font, gray);
    y -= 14;
  }
  if (invoice.branch?.name) {
    draw(`Branch: ${invoice.branch.name}`, margin, 10, font, gray);
    y -= 14;
  }
  y -= 16;

  // Line items table header
  const colDesc = margin;
  const colQty = margin + 260;
  const colRate = margin + 330;
  const colTotal = pageWidth - margin - 70;

  draw("Description", colDesc, 10, bold);
  draw("Qty", colQty, 10, bold);
  draw("Rate", colRate, 10, bold);
  draw("Amount", colTotal, 10, bold);
  y -= 6;
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 0.5,
    color: gray,
  });
  y -= 16;

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  for (const item of items) {
    if (y < margin + 100) {
      // Simple single-page layout is enough for the realistic line-item
      // counts here; guard against overflow by truncating rather than
      // silently drawing off the page edge.
      draw("...", colDesc, 9, font, gray);
      break;
    }
    const description = String(item.description || "").slice(0, 45);
    draw(description, colDesc, 9);
    draw(String(Number(item.quantity || 0).toFixed(2)), colQty, 9);
    draw(formatMoney(item.unit_price), colRate, 9);
    draw(formatMoney(item.total_amount), colTotal, 9);
    y -= 16;
  }

  y -= 10;
  page.drawLine({
    start: { x: colRate, y },
    end: { x: pageWidth - margin, y },
    thickness: 0.5,
    color: gray,
  });
  y -= 18;

  draw("Subtotal", colRate, 10, font, gray);
  draw(formatMoney(invoice.subtotal), colTotal, 10);
  y -= 16;
  draw(`VAT (${Number(invoice.vat_percentage || 0)}%)`, colRate, 10, font, gray);
  draw(formatMoney(invoice.vat_amount), colTotal, 10);
  y -= 16;
  draw("Total", colRate, 11, bold);
  draw(formatMoney(invoice.total_amount), colTotal, 11, bold);
  y -= 16;
  draw("Paid", colRate, 10, font, gray);
  draw(formatMoney(invoice.paid_amount), colTotal, 10);
  y -= 16;
  draw("Balance due", colRate, 10, bold);
  draw(formatMoney(invoice.remaining_balance), colTotal, 10, bold);

  if (invoice.notes) {
    y -= 40;
    draw("Notes", margin, 10, bold);
    y -= 14;
    draw(String(invoice.notes).slice(0, 110), margin, 9, font, gray);
  }

  return pdfDoc.save();
}
