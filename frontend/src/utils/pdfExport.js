import { jsPDF } from "jspdf";

const PRIMARY = [30, 41, 59];    // #1e293b
const ACCENT  = [99, 102, 241];  // indigo
const GRAY    = [107, 114, 128];
const LIGHT   = [248, 250, 252];
const BORDER  = [229, 231, 235];
const WHITE   = [255, 255, 255];

function initDoc() {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setFont("helvetica");
  return doc;
}

function drawHeader(doc, title, subtitle, accentColor = ACCENT) {
  // Top bar
  doc.setFillColor(...accentColor);
  doc.rect(0, 0, 210, 18, "F");

  doc.setTextColor(...WHITE);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 12);

  if (subtitle) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 210 - 14, 12, { align: "right" });
  }

  // Generated date
  doc.setTextColor(...GRAY);
  doc.setFontSize(7.5);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
    210 - 14, 24, { align: "right" }
  );

  return 30; // y position after header
}

function drawSectionTitle(doc, text, y) {
  doc.setFillColor(...LIGHT);
  doc.roundedRect(14, y, 182, 7, 1, 1, "F");
  doc.setTextColor(...PRIMARY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(text.toUpperCase(), 18, y + 4.8);
  return y + 12;
}

function drawField(doc, label, value, x, y, w = 85) {
  doc.setFillColor(...LIGHT);
  doc.roundedRect(x, y, w, 12, 1.5, 1.5, "F");
  doc.setTextColor(...GRAY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(label.toUpperCase(), x + 3, y + 4);
  doc.setTextColor(...PRIMARY);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  const val = String(value ?? "—");
  doc.text(val.length > 28 ? val.slice(0, 28) + "…" : val, x + 3, y + 9.5);
  return y + 14;
}

function drawTwoFields(doc, f1, f2, y) {
  drawField(doc, f1[0], f1[1], 14, y, 88);
  if (f2) drawField(doc, f2[0], f2[1], 108, y, 88);
  return y + 14;
}

function drawTextBlock(doc, label, text, y) {
  y = drawSectionTitle(doc, label, y);
  doc.setFillColor(250, 250, 252);
  const lines = doc.splitTextToSize(text || "—", 174);
  const h = Math.max(12, lines.length * 5 + 6);
  doc.roundedRect(14, y, 182, h, 1.5, 1.5, "F");
  doc.setDrawColor(...BORDER);
  doc.roundedRect(14, y, 182, h, 1.5, 1.5, "S");
  doc.setTextColor(...GRAY);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text(lines, 18, y + 6);
  return y + h + 6;
}

function drawFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.line(14, 285, 196, 285);
    doc.setTextColor(...GRAY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Jigisha International Vendor Portal", 14, 290);
    doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: "right" });
  }
}

// ── ORDER PDF ──────────────────────────────────────────────────────────────
export function downloadOrderPDF(order) {
  const doc = initDoc();
  let y = drawHeader(doc, "Order Details", order.id, [37, 99, 235]);

  y = drawSectionTitle(doc, "Order Information", y);
  y = drawTwoFields(doc, ["Order ID", order.id], ["Buyer", order.buyer], y);
  y = drawTwoFields(doc, ["Order Date", order.date || "—"], ["Status", order.status || "—"], y);
  y = drawTwoFields(doc, ["Total Value", order.value ? `Rs. ${Number(order.value).toLocaleString("en-IN")}` : "—"], ["Items", `${order.products?.length || 0} item(s)`], y);
  y += 4;

  if ((order.products || []).length > 0) {
    y = drawSectionTitle(doc, "Order Items", y);

    // Table header
    doc.setFillColor(...PRIMARY);
    doc.rect(14, y, 182, 8, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("Product", 18, y + 5.5);
    doc.text("Qty", 130, y + 5.5);
    doc.text("Price", 175, y + 5.5, { align: "right" });
    y += 8;

    order.products.forEach((p, i) => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
      doc.rect(14, y, 182, 8, "F");
      doc.setTextColor(...PRIMARY);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const name = String(p.name || "—");
      doc.text(name.length > 40 ? name.slice(0, 40) + "…" : name, 18, y + 5.5);
      doc.text(String(p.qty ?? "—"), 130, y + 5.5);
      doc.setFont("helvetica", "bold");
      doc.text(`Rs. ${Number(p.price || 0).toLocaleString("en-IN")}`, 191, y + 5.5, { align: "right" });
      y += 8;
    });

    // Total row
    doc.setFillColor(239, 246, 255);
    doc.rect(14, y, 182, 9, "F");
    doc.setTextColor(...PRIMARY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Total", 18, y + 6);
    doc.text(`Rs. ${Number(order.value || 0).toLocaleString("en-IN")}`, 191, y + 6, { align: "right" });
    y += 13;
  }

  if (order.reason) {
    y = drawTextBlock(doc, "Note / Reason", order.reason, y);
  }

  drawFooter(doc);
  doc.save(`order-${order.id}.pdf`);
}

// ── RFQ PDF ────────────────────────────────────────────────────────────────
export function downloadRFQPDF(rfq) {
  const doc = initDoc();
  let y = drawHeader(doc, "RFQ Details", rfq.id, [124, 58, 237]);

  y = drawSectionTitle(doc, "RFQ Information", y);
  y = drawTwoFields(doc, ["RFQ ID", rfq.id], ["Buyer", rfq.buyer], y);
  y = drawTwoFields(doc, ["Quantity", rfq.qty || rfq.quantity || "—"], ["Category", rfq.category || "—"], y);
  y = drawTwoFields(doc, ["Deadline", rfq.deadline || "—"], ["Status", rfq.status || "—"], y);
  y += 4;

  y = drawTextBlock(doc, "Title / Product", rfq.title || rfq.product || "—", y);

  if (rfq.description) {
    y = drawTextBlock(doc, "Description", rfq.description, y);
  }

  if (rfq.quotedPrice) {
    y = drawSectionTitle(doc, "Quote Submitted", y);
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(14, y, 182, 14, 1.5, 1.5, "F");
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${Number(rfq.quotedPrice).toLocaleString("en-IN")}`, 18, y + 9.5);
    y += 18;
  }

  drawFooter(doc);
  doc.save(`rfq-${rfq.id}.pdf`);
}

// ── PRODUCT / CATALOGUE PDF ────────────────────────────────────────────────
export function downloadProductPDF(p) {
  const doc = initDoc();
  let y = drawHeader(doc, "Product Details", p.sku || p.id, [5, 150, 105]);

  y = drawSectionTitle(doc, "Product Information", y);
  y = drawTwoFields(doc, ["Product Name", p.name], ["Category", p.category?.name || p.category || "—"], y);
  y = drawTwoFields(doc, ["SKU", p.sku || "—"], ["Brand", p.brand || "—"], y);
  y = drawTwoFields(doc, ["Price", p.price ? `Rs. ${Number(p.price).toLocaleString("en-IN")}` : "—"], ["Stock", String(p.stock ?? "—")], y);
  y = drawTwoFields(doc, ["Status", p.status || "—"], ["Min Order Qty", String(p.min_order_qty || "—")], y);
  y += 4;

  if (p.description) {
    y = drawTextBlock(doc, "Description", p.description, y);
  }

  drawFooter(doc);
  doc.save(`product-${p.id || p.sku}.pdf`);
}

// ── LOGISTICS / SHIPMENT PDF ───────────────────────────────────────────────
export function downloadShipmentPDF(item) {
  const doc = initDoc();
  let y = drawHeader(doc, "Shipment Details", item.id, [8, 145, 178]);

  y = drawSectionTitle(doc, "Shipment Information", y);
  y = drawTwoFields(doc, ["Shipment ID", item.id], ["Order ID", item.order_id || "—"], y);
  y = drawTwoFields(doc, ["Carrier", item.carrier || "—"], ["Tracking No.", item.tracking || "—"], y);
  y = drawTwoFields(doc, ["Dispatch Date", item.dispatch_date || "—"], ["Expected Delivery", item.expected_delivery || "—"], y);
  y = drawTwoFields(doc, ["Weight", item.weight || "—"], ["Status", item.status || "—"], y);
  y += 4;

  // Route
  y = drawSectionTitle(doc, "Delivery Route", y);
  doc.setFillColor(240, 253, 254);
  doc.roundedRect(14, y, 182, 14, 1.5, 1.5, "F");
  doc.setDrawColor(165, 243, 252);
  doc.roundedRect(14, y, 182, 14, 1.5, 1.5, "S");
  doc.setTextColor(...PRIMARY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(item.origin || "—", 18, y + 9);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  doc.text("→", 100, y + 9, { align: "center" });
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text(item.destination || "—", 191, y + 9, { align: "right" });
  y += 18;

  // Timeline
  if ((item.timeline || []).length > 0) {
    y = drawSectionTitle(doc, "Shipment Timeline", y);
    item.timeline.forEach((t, i) => {
      if (y > 265) { doc.addPage(); y = 20; }
      const isLast = i === item.timeline.length - 1;
      doc.setFillColor(isLast ? 8 : 229, isLast ? 145 : 231, isLast ? 178 : 235);
      doc.circle(18, y + 4, 2.5, "F");
      if (i < item.timeline.length - 1) {
        doc.setDrawColor(...BORDER);
        doc.line(18, y + 6.5, 18, y + 14);
      }
      doc.setTextColor(...PRIMARY);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text(t.event || "—", 24, y + 4.5);
      doc.setTextColor(...GRAY);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(`${t.location || ""} · ${t.time || ""}`, 24, y + 9);
      y += 14;
    });
  }

  drawFooter(doc);
  doc.save(`shipment-${item.id}.pdf`);
}

// ── PAYMENT PDF (single invoice) ──────────────────────────────────────────
export function downloadPaymentPDF(payment) {
  const doc = initDoc();
  let y = drawHeader(doc, "Payment Invoice", payment.id, [16, 185, 129]);

  y = drawSectionTitle(doc, "Payment Information", y);
  y = drawTwoFields(doc, ["Invoice ID", payment.id], ["Order ID", payment.order_id || "—"], y);
  y = drawTwoFields(doc, ["Buyer", payment.buyer || "—"], ["Payment Mode", payment.mode || "—"], y);
  y = drawTwoFields(doc, ["Status", payment.status || "—"], ["Date", payment.paid_date || payment.due_date || "—"], y);
  y += 4;

  // Amount highlighted box
  y = drawSectionTitle(doc, "Amount", y);
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(14, y, 182, 18, 1.5, 1.5, "F");
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(14, y, 182, 18, 1.5, 1.5, "S");
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const safeAmt = parseInt(String(payment.amount || "0").replace(/,/g, "")) || 0;
  doc.text(`Rs. ${safeAmt.toLocaleString("en-IN")}`, 18, y + 12);
  y += 22;

  if (payment.days_overdue) {
    y = drawTextBlock(doc, "Overdue Notice", `This payment is ${payment.days_overdue} day(s) overdue.`, y);
  }
  if (payment.days_left) {
    y = drawTextBlock(doc, "Payment Due", `Payment is due in ${payment.days_left} day(s).`, y);
  }

  drawFooter(doc);
  doc.save(`invoice-${payment.id}.pdf`);
}

// ── PAYMENTS SUMMARY PDF (full list) ──────────────────────────────────────
export function downloadPaymentsSummaryPDF(payments, totals) {
  const doc = initDoc();
  let y = drawHeader(doc, "Payments Summary", `${payments.length} record(s)`, [16, 185, 129]);

  // Summary stats
  y = drawSectionTitle(doc, "Summary", y);
  y = drawTwoFields(doc, ["Pending Amount", `Rs. ${totals.pending.toLocaleString("en-IN")}`], ["Total Received", `Rs. ${totals.paid.toLocaleString("en-IN")}`], y);
  y = drawTwoFields(doc, ["Overdue Amount", `Rs. ${totals.overdue.toLocaleString("en-IN")}`], ["Total Records", String(payments.length)], y);
  y += 6;

  // Table
  y = drawSectionTitle(doc, "Payment Records", y);

  // Table header
  doc.setFillColor(...PRIMARY);
  doc.rect(14, y, 182, 8, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice ID", 17, y + 5.5);
  doc.text("Order ID", 55, y + 5.5);
  doc.text("Buyer", 90, y + 5.5);
  doc.text("Amount", 133, y + 5.5, { align: "right" });
  doc.text("Date", 143, y + 5.5);
  doc.text("Status", 173, y + 5.5);
  y += 8;

  payments.forEach((p, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
    doc.rect(14, y, 182, 8, "F");
    doc.setTextColor(...PRIMARY);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(String(p.id || "—").slice(0, 12), 17, y + 5.5);
    doc.text(String(p.order_id || "—").slice(0, 12), 55, y + 5.5);
    const buyer = String(p.buyer || "—");
    doc.text(buyer.length > 14 ? buyer.slice(0, 14) + "…" : buyer, 90, y + 5.5);
    const amt = parseInt(String(p.amount || "0").replace(/,/g, "")) || 0;
    doc.setFont("helvetica", "bold");
    doc.text(`Rs.${amt.toLocaleString("en-IN")}`, 133, y + 5.5, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(String(p.paid_date || p.due_date || "—"), 143, y + 5.5);
    const status = String(p.status || "—");
    const sc = status.toLowerCase() === "paid" ? [5, 150, 105] : status.toLowerCase() === "overdue" ? [220, 38, 38] : [180, 120, 0];
    doc.setTextColor(...sc);
    doc.setFont("helvetica", "bold");
    doc.text(status, 173, y + 5.5);
    doc.setTextColor(...PRIMARY);
    y += 8;
  });

  drawFooter(doc);
  doc.save("payments-summary.pdf");
}

// ── LOAN PDF (single application) ────────────────────────────────────────
export function downloadLoanPDF(loan) {
  const doc = initDoc();
  let y = drawHeader(doc, "Loan Application", loan.id, [59, 130, 246]);

  y = drawSectionTitle(doc, "Application Details", y);
  y = drawTwoFields(doc, ["Application ID", loan.id], ["Loan Type", loan.loan_type || loan.purpose?.slice(0, 25) || "—"], y);
  y = drawTwoFields(doc, ["Applied On", loan.applied_on || loan.created_at?.split("T")[0] || "—"], ["Disbursed On", loan.disbursed_on || "—"], y);
  y = drawTwoFields(doc, ["Status", loan.status || "—"], ["Interest Rate", loan.interest_rate || "—"], y);
  y = drawTwoFields(doc, ["Tenure", loan.tenure || "—"], ["Amount", loan.amount ? `Rs. ${loan.amount}` : "—"], y);
  y += 4;

  // Amount highlighted box
  if (loan.amount) {
    y = drawSectionTitle(doc, "Loan Amount", y);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(14, y, 182, 18, 1.5, 1.5, "F");
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(14, y, 182, 18, 1.5, 1.5, "S");
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${loan.amount}`, 18, y + 12);
    y += 22;
  }

  if (loan.purpose) {
    y = drawTextBlock(doc, "Purpose of Loan", loan.purpose, y);
  }

  drawFooter(doc);
  doc.save(`loan-${loan.id}.pdf`);
}

// ── LOANS SUMMARY PDF (full list) ────────────────────────────────────────
export function downloadLoansSummaryPDF(loans) {
  const doc = initDoc();
  let y = drawHeader(doc, "Loan Applications Summary", `${loans.length} application(s)`, [59, 130, 246]);

  y = drawSectionTitle(doc, "Applications", y);

  // Table header
  doc.setFillColor(...PRIMARY);
  doc.rect(14, y, 182, 8, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("App ID", 17, y + 5.5);
  doc.text("Type / Purpose", 50, y + 5.5);
  doc.text("Amount", 105, y + 5.5, { align: "right" });
  doc.text("Applied On", 113, y + 5.5);
  doc.text("Status", 152, y + 5.5);
  doc.text("Interest", 185, y + 5.5, { align: "right" });
  y += 8;

  loans.forEach((loan, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
    doc.rect(14, y, 182, 8, "F");
    doc.setTextColor(...PRIMARY);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(String(loan.id || "—").slice(0, 10), 17, y + 5.5);
    const ltype = String(loan.loan_type || loan.purpose || "—");
    doc.text(ltype.length > 22 ? ltype.slice(0, 22) + "…" : ltype, 50, y + 5.5);
    doc.setFont("helvetica", "bold");
    doc.text(loan.amount ? `Rs.${loan.amount}` : "—", 105, y + 5.5, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(String(loan.applied_on || loan.created_at?.split("T")[0] || "—"), 113, y + 5.5);
    const status = String(loan.status || "—");
    const sc = status.toLowerCase() === "approved" || status.toLowerCase() === "disbursed" ? [5, 150, 105] : status.toLowerCase() === "rejected" ? [220, 38, 38] : [180, 120, 0];
    doc.setTextColor(...sc);
    doc.setFont("helvetica", "bold");
    doc.text(status, 152, y + 5.5);
    doc.setTextColor(...PRIMARY);
    doc.setFont("helvetica", "normal");
    doc.text(String(loan.interest_rate || "—"), 185, y + 5.5, { align: "right" });
    y += 8;
  });

  drawFooter(doc);
  doc.save("loans-summary.pdf");
}

// ── RETURN PDF ─────────────────────────────────────────────────────────────
export function downloadReturnPDF(item) {
  const doc = initDoc();
  let y = drawHeader(doc, "Return Details", item.id, [225, 29, 72]);

  y = drawSectionTitle(doc, "Return Information", y);
  y = drawTwoFields(doc, ["Return ID", item.id], ["Order ID", item.order_id || "—"], y);
  y = drawTwoFields(doc, ["Product", item.product || "—"], ["Quantity", String(item.quantity ?? "—")], y);
  y = drawTwoFields(doc, ["Requested On", item.requested_on || "—"], ["Status", item.status || "—"], y);
  y += 4;

  y = drawTextBlock(doc, "Return Reason", item.reason || "No reason provided.", y);

  if (item.refund_amount) {
    y = drawSectionTitle(doc, "Refund", y);
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(14, y, 182, 14, 1.5, 1.5, "F");
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${Number(item.refund_amount).toLocaleString("en-IN")}`, 18, y + 9.5);
    y += 18;
  }

  drawFooter(doc);
  doc.save(`return-${item.id}.pdf`);
}
