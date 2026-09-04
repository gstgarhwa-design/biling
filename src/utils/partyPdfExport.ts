import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Party, SalesInvoice, PurchaseInvoice, PaymentReceipt, CreditNote, DebitNote, Company } from '../types';
import { formatINR } from '../data/indianStates';

export interface LedgerEntryForPdf {
  date: string;
  voucherType: string;
  voucherNo: string;
  particulars: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

/**
 * Generates a clean, professional Party Statement / Account Ledger A4 PDF
 */
export function generatePartyStatementPdf({
  party,
  company,
  startDate,
  endDate,
  openingBalance,
  closingBalance,
  totalDebit,
  totalCredit,
  entries
}: {
  party: Party;
  company: Company | null;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
  entries: LedgerEntryForPdf[];
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 14;

  // Header Banner: Company Information
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(10, cursorY, pageWidth - 20, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text((company?.name || 'BUSINESS ENTITY').toUpperCase(), 14, cursorY + 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const compAddr = company?.address ? `${company.address}, ${company.city || ''} ${company.state || ''}` : '';
  const compGstin = company?.gstin ? `GSTIN: ${company.gstin}` : '';
  const compPhone = company?.mobile ? `Mobile: +91 ${company.mobile}` : '';
  doc.text(`${compAddr}`, 14, cursorY + 12);
  doc.text(`${compGstin}  |  ${compPhone}  |  State: ${company?.state || ''} (${company?.stateCode || ''})`, 14, cursorY + 17);

  // Document Title on top right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('STATEMENT OF ACCOUNT', pageWidth - 14, cursorY + 9, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${startDate} to ${endDate}`, pageWidth - 14, cursorY + 15, { align: 'right' });

  cursorY += 26;

  // Party Details Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.rect(10, cursorY, pageWidth - 20, 24, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Party: ${party.name}`, 14, cursorY + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`GSTIN: ${party.gstin || 'Unregistered / B2C'}`, 14, cursorY + 11);
  doc.text(`Address: ${party.billingAddress || `${party.city}, ${party.state}`}`, 14, cursorY + 16);
  doc.text(`State: ${party.state} (Code: ${party.stateCode})  |  PAN: ${party.pan || 'N/A'}`, 14, cursorY + 21);

  // Right side of Party Box: Opening & Closing Balance Highlights
  doc.setFont('helvetica', 'bold');
  doc.text(`Party Type: ${party.type}`, pageWidth - 14, cursorY + 6, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Opening Balance: ${formatINR(Math.abs(openingBalance))} ${openingBalance >= 0 ? 'Dr' : 'Cr'}`, pageWidth - 14, cursorY + 12, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(closingBalance > 0 ? 185 : 15, closingBalance > 0 ? 28 : 23, closingBalance > 0 ? 28 : 42);
  doc.text(`Closing Balance: ${formatINR(Math.abs(closingBalance))} ${closingBalance >= 0 ? 'Dr (Receivable)' : 'Cr (Payable)'}`, pageWidth - 14, cursorY + 18, { align: 'right' });

  cursorY += 28;

  // Transactions autoTable
  const tableRows = entries.map(item => [
    item.date,
    item.voucherType,
    item.voucherNo,
    item.particulars,
    item.debit > 0 ? formatINR(item.debit) : '—',
    item.credit > 0 ? formatINR(item.credit) : '—',
    `${formatINR(Math.abs(item.runningBalance))} ${item.runningBalance >= 0 ? 'Dr' : 'Cr'}`
  ]);

  autoTable(doc, {
    startY: cursorY,
    margin: { left: 10, right: 10 },
    head: [[
      'Date',
      'Type',
      'Voucher No',
      'Particulars / Reference',
      'Debit (Rs)',
      'Credit (Rs)',
      'Balance (Rs)'
    ]],
    body: tableRows,
    foot: [[
      'TOTALS',
      '',
      '',
      `Transactions: ${entries.length}`,
      formatINR(totalDebit),
      formatINR(totalCredit),
      `${formatINR(Math.abs(closingBalance))} ${closingBalance >= 0 ? 'Dr' : 'Cr'}`
    ]],
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 20 },
      2: { cellWidth: 26 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
    },
    didDrawPage: (data) => {
      // Footer page numbering
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Generated from GST Accounting ERP on ${new Date().toLocaleString('en-IN')}  |  Page ${data.pageNumber}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  // Signatory Box if room
  if (finalY < doc.internal.pageSize.getHeight() - 25) {
    doc.setDrawColor(203, 213, 225);
    doc.line(pageWidth - 65, finalY + 15, pageWidth - 15, finalY + 15);
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`For ${company?.name || 'Business Entity'}`, pageWidth - 40, finalY + 19, { align: 'center' });
    doc.setFontSize(7);
    doc.text('Authorized Signatory', pageWidth - 40, finalY + 23, { align: 'center' });
  }

  // Trigger browser download
  const safeName = party.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Statement_${safeName}_${startDate}_to_${endDate}.pdf`);
}

/**
 * Generates an Outstanding Analysis & Bill-by-Bill Ageing PDF
 */
export function generatePartyOutstandingPdf({
  party,
  company,
  invoices,
  asOnDate = new Date().toISOString().substring(0, 10)
}: {
  party: Party;
  company: Company | null;
  invoices: SalesInvoice[];
  asOnDate?: string;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 14;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(10, cursorY, pageWidth - 20, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text((company?.name || 'BUSINESS ENTITY').toUpperCase(), 14, cursorY + 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`GSTIN: ${company?.gstin || ''}  |  State: ${company?.state || ''} (${company?.stateCode || ''})`, 14, cursorY + 13);
  doc.text(`Contact: +91 ${company?.mobile || ''}  |  ${company?.email || ''}`, 14, cursorY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('OUTSTANDING ANALYSIS', pageWidth - 14, cursorY + 9, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`As on: ${asOnDate}`, pageWidth - 14, cursorY + 15, { align: 'right' });

  cursorY += 26;

  // Party Details Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.rect(10, cursorY, pageWidth - 20, 22, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Party: ${party.name}`, 14, cursorY + 6);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`GSTIN: ${party.gstin || 'Unregistered'}  |  PAN: ${party.pan || 'N/A'}`, 14, cursorY + 11);
  doc.text(`Contact: +91 ${party.mobile || 'N/A'}  |  Credit Limit: ${party.creditLimit ? formatINR(party.creditLimit) : 'No Limit'}`, 14, cursorY + 16);

  // Compute Outstanding Invoices & Ageing
  const asOnTime = new Date(asOnDate).getTime();
  const pendingInvoices = invoices.filter(i => {
    if (i.customerId !== party.id) return false;
    if (i.status === 'CANCELLED') return false;
    const paid = i.paidAmount || i.paymentReceived || 0;
    return (i.grandTotal - paid) > 0;
  });

  let bucket0_30 = 0;
  let bucket31_60 = 0;
  let bucket61_90 = 0;
  let bucket90Plus = 0;
  let totalPending = 0;

  const rows = pendingInvoices.map(inv => {
    const paid = inv.paidAmount || inv.paymentReceived || 0;
    const pending = inv.grandTotal - paid;
    totalPending += pending;

    const invTime = new Date(inv.date).getTime();
    const ageDays = Math.max(0, Math.floor((asOnTime - invTime) / (1000 * 60 * 60 * 24)));

    if (ageDays <= 30) bucket0_30 += pending;
    else if (ageDays <= 60) bucket31_60 += pending;
    else if (ageDays <= 90) bucket61_90 += pending;
    else bucket90Plus += pending;

    const dueTime = new Date(inv.dueDate || inv.date).getTime();
    const overdueDays = Math.max(0, Math.floor((asOnTime - dueTime) / (1000 * 60 * 60 * 24)));

    return [
      inv.invoiceNo,
      inv.date,
      inv.dueDate || 'Immediate',
      `${ageDays} days`,
      formatINR(inv.grandTotal),
      formatINR(paid),
      formatINR(pending),
      overdueDays > 0 ? `${overdueDays}d Overdue` : 'Current'
    ];
  });

  // Highlight Balance on top right of box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(185, 28, 28);
  doc.text(`Total Pending: ${formatINR(totalPending)}`, pageWidth - 14, cursorY + 8, { align: 'right' });
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Pending Bills Count: ${pendingInvoices.length}`, pageWidth - 14, cursorY + 14, { align: 'right' });

  cursorY += 26;

  // Ageing Summary Cards row
  const cardW = (pageWidth - 26) / 4;
  const cards = [
    { label: '0 - 30 Days', val: bucket0_30, color: [16, 185, 129] },
    { label: '31 - 60 Days', val: bucket31_60, color: [59, 130, 246] },
    { label: '61 - 90 Days', val: bucket61_90, color: [245, 158, 11] },
    { label: '> 90 Days', val: bucket90Plus, color: [239, 68, 68] }
  ];

  cards.forEach((c, idx) => {
    const x = 10 + idx * (cardW + 2);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(c.color[0], c.color[1], c.color[2]);
    doc.setLineWidth(0.4);
    doc.rect(x, cursorY, cardW, 14, 'FD');

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, x + cardW / 2, cursorY + 4.5, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(formatINR(c.val), x + cardW / 2, cursorY + 10.5, { align: 'center' });
  });

  cursorY += 18;

  // Table of Pending Bills
  autoTable(doc, {
    startY: cursorY,
    margin: { left: 10, right: 10 },
    head: [[
      'Invoice No',
      'Bill Date',
      'Due Date',
      'Age',
      'Bill Total (Rs)',
      'Paid (Rs)',
      'Pending (Rs)',
      'Overdue Status'
    ]],
    body: rows.length > 0 ? rows : [['No pending outstanding invoices found for this party', '', '', '', '', '', '', '']],
    foot: rows.length > 0 ? [[
      'TOTAL OUTSTANDING',
      '',
      '',
      '',
      formatINR(pendingInvoices.reduce((s, i) => s + i.grandTotal, 0)),
      formatINR(pendingInvoices.reduce((s, i) => s + (i.paidAmount || i.paymentReceived || 0), 0)),
      formatINR(totalPending),
      ''
    ]] : undefined,
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [185, 28, 28],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 16 },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 'auto', halign: 'center' }
    },
    didDrawPage: (data) => {
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Generated from GST Accounting ERP on ${new Date().toLocaleString('en-IN')}  |  Page ${data.pageNumber}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }
  });

  const safeName = party.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Outstanding_Analysis_${safeName}_${asOnDate}.pdf`);
}
