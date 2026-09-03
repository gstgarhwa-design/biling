import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SalesInvoice, Company } from '../types';
import { formatINR, amountInWords } from '../data/indianStates';

/**
 * Generates a clean, professional, GST-compliant consolidated A4 PDF for sales invoices.
 * Triggers direct browser download.
 */
export function generateBulkSalesInvoicesPdf(
  invoices: SalesInvoice[],
  company: Company | null,
  periodLabel: string = ''
) {
  if (!invoices || invoices.length === 0) {
    alert('No invoices available for bulk PDF generation.');
    return;
  }

  // Create A4 PDF document in portrait mode
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  invoices.forEach((inv, index) => {
    if (index > 0) {
      doc.addPage();
    }

    let cursorY = 14;

    // Header Bar with Company Name
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(10, cursorY, pageWidth - 20, 18, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text((company?.name || 'BUSINESS ENTITY').toUpperCase(), 14, cursorY + 7);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const compGstin = company?.gstin ? `GSTIN: ${company.gstin}` : '';
    const compState = company?.state ? `State: ${company.state} (${company.stateCode || ''})` : '';
    doc.text(`${compGstin}  |  ${compState}`, 14, cursorY + 13);

    // Document Title on top right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TAX INVOICE', pageWidth - 14, cursorY + 8, { align: 'right' });
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('(Original for Recipient)', pageWidth - 14, cursorY + 13, { align: 'right' });

    cursorY += 22;

    // Invoice Meta & e-Invoice IRN Details Box
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.setLineWidth(0.2);
    doc.rect(10, cursorY, pageWidth - 20, inv.irn ? 24 : 18, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice No: ${inv.invoiceNo}`, 14, cursorY + 5.5);
    doc.text(`Date: ${inv.date}`, 75, cursorY + 5.5);
    doc.text(`Due Date: ${inv.dueDate || 'Immediate'}`, 135, cursorY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Payment Mode: ${inv.paymentMode || 'CREDIT'}`, 14, cursorY + 11.5);
    doc.text(`Payment Status: ${inv.paymentStatus || 'UNPAID'}`, 75, cursorY + 11.5);
    doc.text(`Compliance: ${inv.irnStatus || 'REGULAR'}`, 135, cursorY + 11.5);

    // If e-Invoice / IRN is present
    if (inv.irn) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 58, 138); // Blue
      doc.text(`IRN: ${inv.irn.substring(0, 48)}...`, 14, cursorY + 17);
      if (inv.ackNo) {
        doc.text(`Ack No: ${inv.ackNo} | Ack Date: ${inv.ackDate || ''}`, 14, cursorY + 21);
      }
    }

    cursorY += inv.irn ? 28 : 22;

    // Billing and Shipping Details (2 Columns)
    const colWidth = (pageWidth - 24) / 2;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.rect(10, cursorY, colWidth, 24, 'D');
    doc.rect(14 + colWidth, cursorY, colWidth, 24, 'D');

    // Bill To
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('BILL TO (CUSTOMER):', 13, cursorY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(inv.customerName || 'Cash Customer', 13, cursorY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`GSTIN: ${inv.customerGstin || 'Unregistered / Consumer'}`, 13, cursorY + 15.5);
    doc.text(`State: ${inv.customerStateCode || ''} | Address: ${(inv.billingAddress || '').substring(0, 35)}`, 13, cursorY + 20);

    // Ship To / Supplier Meta
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('DISPATCH / SUPPLIER DETAILS:', 17 + colWidth, cursorY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Supplier: ${company?.name || ''}`, 17 + colWidth, cursorY + 10.5);
    doc.text(`Address: ${(company?.address || '').substring(0, 38)}`, 17 + colWidth, cursorY + 15.5);
    doc.text(`Place of Supply: ${inv.customerStateCode || company?.stateCode || '27'}-State`, 17 + colWidth, cursorY + 20);

    cursorY += 28;

    // Line Items Table
    const tableRows = (inv.items || []).map((item, idx) => {
      const taxRate = item.gstRate || 18;
      const taxVal = (item.taxableValue * taxRate) / 100;
      return [
        idx + 1,
        item.name,
        item.hsnSac || '-',
        `${item.qty} ${item.unit || 'PCS'}`,
        formatINR(item.rate),
        item.discountPercent ? `${item.discountPercent}%` : '-',
        formatINR(item.taxableValue),
        `${taxRate}%`,
        formatINR(taxVal),
        formatINR(item.total || (item.taxableValue + taxVal))
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      margin: { left: 10, right: 10 },
      head: [[
        '#', 'Description of Goods', 'HSN/SAC', 'Qty', 'Rate (₹)', 'Disc', 'Taxable (₹)', 'GST %', 'Tax (₹)', 'Total (₹)'
      ]],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 7 },
        1: { halign: 'left', cellWidth: 46 },
        2: { halign: 'center', cellWidth: 16 },
        3: { halign: 'center', cellWidth: 14 },
        4: { halign: 'right', cellWidth: 18 },
        5: { halign: 'center', cellWidth: 11 },
        6: { halign: 'right', cellWidth: 20 },
        7: { halign: 'center', cellWidth: 14 },
        8: { halign: 'right', cellWidth: 20 },
        9: { halign: 'right', cellWidth: 24 },
      },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 4;

    // If cursor reaches near bottom, add new page
    if (cursorY > pageHeight - 55) {
      doc.addPage();
      cursorY = 15;
    }

    // Totals Box (Right) & Terms/Words (Left)
    const totalsWidth = 75;
    const totalsX = pageWidth - 10 - totalsWidth;

    // Left Column: Amount in words & Bank
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('TOTAL AMOUNT IN WORDS:', 12, cursorY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const words = amountInWords(inv.grandTotal);
    const splitWords = doc.splitTextToSize(words, totalsX - 18);
    doc.text(splitWords, 12, cursorY + 9);

    // Bank Details if available
    if (company?.bankName) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Bank: ${company.bankName} | A/C: ${company.accountNo || '-'} | IFSC: ${company.ifsc || '-'}`, 12, cursorY + 21);
    }

    // Right Column: Summary Table
    doc.setFillColor(248, 250, 252);
    doc.rect(totalsX, cursorY, totalsWidth, 34, 'FD');
    doc.setDrawColor(203, 213, 225);
    doc.rect(totalsX, cursorY, totalsWidth, 34, 'D');

    let sumY = cursorY + 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Taxable Value:', totalsX + 4, sumY);
    doc.text(formatINR(inv.taxableAmount), totalsX + totalsWidth - 4, sumY, { align: 'right' });

    sumY += 5;
    if (inv.igst > 0) {
      doc.text('IGST (Integrated Tax):', totalsX + 4, sumY);
      doc.text(formatINR(inv.igst), totalsX + totalsWidth - 4, sumY, { align: 'right' });
    } else {
      doc.text('CGST (Central Tax):', totalsX + 4, sumY);
      doc.text(formatINR(inv.cgst), totalsX + totalsWidth - 4, sumY, { align: 'right' });
      sumY += 4.5;
      doc.text('SGST (State Tax):', totalsX + 4, sumY);
      doc.text(formatINR(inv.sgst), totalsX + totalsWidth - 4, sumY, { align: 'right' });
    }

    sumY += 5;
    doc.text('Round Off:', totalsX + 4, sumY);
    doc.text(formatINR(inv.roundOff || 0), totalsX + totalsWidth - 4, sumY, { align: 'right' });

    sumY += 6;
    doc.setFillColor(30, 41, 59);
    doc.rect(totalsX, sumY - 4, totalsWidth, 8.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('GRAND TOTAL (₹):', totalsX + 4, sumY + 1.5);
    doc.text(formatINR(inv.grandTotal), totalsX + totalsWidth - 4, sumY + 1.5, { align: 'right' });

    // Footer Signatures
    const footerY = pageHeight - 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Terms: Goods once sold will not be returned. Subject to local jurisdiction.', 10, footerY);
    doc.setFont('helvetica', 'bold');
    doc.text(`For ${company?.name || 'Authorised Signatory'}`, pageWidth - 10, footerY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text('(Authorised Signatory)', pageWidth - 10, footerY + 5, { align: 'right' });
  });

  // Trigger browser download
  const cleanPeriod = (periodLabel || 'FY').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Sales_Invoices_Bulk_${company?.gstin || 'GST'}_${cleanPeriod}.pdf`;
  doc.save(filename);
}
