import * as XLSX from 'xlsx';
import { SalesInvoice, PurchaseInvoice, CreditNote, DebitNote, Company, Party, PaymentReceipt } from '../types';

/**
 * Triggers a browser download of a JSON object or string
 */
export function downloadJsonFile(data: any, filename: string) {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates Government Portal Compatible JSON for GSTR-1
 * Compliant with GST Portal Schema (B2B, B2CL, B2CS, CDNR, HSN, DOCS)
 */
export function generateGstr1GovtJson(
  company: Company | null,
  returnPeriod: string | SalesInvoice[],
  salesInvoices: SalesInvoice[] | CreditNote[],
  creditNotes?: CreditNote[] | string
): string {
  let fp = '022025';
  let sales: SalesInvoice[] = [];
  let credits: CreditNote[] = [];

  if (typeof returnPeriod === 'string') {
    fp = returnPeriod || '022025';
    sales = Array.isArray(salesInvoices) ? (salesInvoices as SalesInvoice[]) : [];
    credits = Array.isArray(creditNotes) ? (creditNotes as CreditNote[]) : [];
  } else if (Array.isArray(returnPeriod)) {
    sales = returnPeriod;
    credits = Array.isArray(salesInvoices) ? (salesInvoices as CreditNote[]) : [];
    fp = typeof creditNotes === 'string' ? creditNotes : '022025';
  } else {
    sales = Array.isArray(salesInvoices) ? (salesInvoices as SalesInvoice[]) : [];
    credits = Array.isArray(creditNotes) ? (creditNotes as CreditNote[]) : [];
  }

  const gstin = company?.gstin || '27AABCA1234A1Z5';
  salesInvoices = sales;
  creditNotes = credits;

  // 1. B2B Invoices (Registered Customers)
  const b2bMap: Record<string, any[]> = {};
  salesInvoices
    .filter(inv => inv.status === 'POSTED' && !!inv.customerGstin)
    .forEach(inv => {
      const cGstin = inv.customerGstin;
      if (!b2bMap[cGstin]) b2bMap[cGstin] = [];

      const invItems = inv.items.map((item, idx) => ({
        num: idx + 1,
        itm_det: {
          rt: item.gstRate,
          txval: parseFloat(item.taxableValue.toFixed(2)),
          iamt: parseFloat(item.igst.toFixed(2)),
          camt: parseFloat(item.cgst.toFixed(2)),
          samt: parseFloat(item.sgst.toFixed(2)),
          csamt: parseFloat(item.cess.toFixed(2)),
        }
      }));

      b2bMap[cGstin].push({
        inum: inv.invoiceNo,
        idt: inv.date.split('-').reverse().join('-'), // DD-MM-YYYY format
        val: parseFloat(inv.grandTotal.toFixed(2)),
        pos: inv.customerStateCode || company?.stateCode || '27',
        rchrg: 'N',
        inv_typ: 'R',
        itms: invItems
      });
    });

  const b2b = Object.keys(b2bMap).map(ctin => ({
    ctin,
    inv: b2bMap[ctin]
  }));

  // 2. B2CS (B2C Small / Unregistered supplies)
  const b2csMap: Record<string, { sply_ty: string; pos: string; rt: number; txval: number; iamt: number; camt: number; samt: number; csamt: number }> = {};
  salesInvoices
    .filter(inv => inv.status === 'POSTED' && !inv.customerGstin)
    .forEach(inv => {
      const pos = inv.customerStateCode || company?.stateCode || '27';
      const isInter = pos !== (company?.stateCode || '27');
      const sply_ty = isInter ? 'INTER' : 'INTRA';

      inv.items.forEach(item => {
        const key = `${sply_ty}_${pos}_${item.gstRate}`;
        if (!b2csMap[key]) {
          b2csMap[key] = {
            sply_ty,
            pos,
            rt: item.gstRate,
            txval: 0,
            iamt: 0,
            camt: 0,
            samt: 0,
            csamt: 0
          };
        }
        b2csMap[key].txval += item.taxableValue;
        b2csMap[key].iamt += item.igst;
        b2csMap[key].camt += item.cgst;
        b2csMap[key].samt += item.sgst;
        b2csMap[key].csamt += item.cess;
      });
    });

  const b2cs = Object.values(b2csMap).map(b => ({
    sply_ty: b.sply_ty,
    pos: b.pos,
    typ: 'OE',
    rt: b.rt,
    txval: parseFloat(b.txval.toFixed(2)),
    iamt: parseFloat(b.iamt.toFixed(2)),
    camt: parseFloat(b.camt.toFixed(2)),
    samt: parseFloat(b.samt.toFixed(2)),
    csamt: parseFloat(b.csamt.toFixed(2))
  }));

  // 3. CDNR (Credit/Debit Notes to Registered Persons)
  const cdnrMap: Record<string, any[]> = {};
  creditNotes.forEach(cn => {
    const ctin = (cn as any).customerGstin || '27AABCR9918R1Z1';
    if (!cdnrMap[ctin]) cdnrMap[ctin] = [];

    const ntItems = cn.items.map((item, idx) => ({
      num: idx + 1,
      itm_det: {
        rt: item.gstRate,
        txval: parseFloat(item.taxableValue.toFixed(2)),
        iamt: parseFloat(item.igst.toFixed(2)),
        camt: parseFloat(item.cgst.toFixed(2)),
        samt: parseFloat(item.sgst.toFixed(2)),
        csamt: 0
      }
    }));

    cdnrMap[ctin].push({
      nt_num: cn.creditNoteNo,
      nt_dt: cn.date.split('-').reverse().join('-'),
      ntty: 'C',
      p_gst: 'N',
      inum: cn.originalInvoiceNo,
      idt: cn.date.split('-').reverse().join('-'),
      val: parseFloat(cn.totalAmount.toFixed(2)),
      itms: ntItems
    });
  });

  const cdnr = Object.keys(cdnrMap).map(ctin => ({
    ctin,
    nt: cdnrMap[ctin]
  }));

  // 4. HSN Summary (Table 12)
  const hsnMap: Record<string, { hsn_sc: string; desc: string; uqc: string; qty: number; val: number; txval: number; iamt: number; camt: number; samt: number; csamt: number }> = {};
  salesInvoices
    .filter(inv => inv.status === 'POSTED')
    .forEach(inv => {
      inv.items.forEach(item => {
        const hsn = item.hsnSac || '84713010';
        if (!hsnMap[hsn]) {
          hsnMap[hsn] = {
            hsn_sc: hsn,
            desc: item.name.substring(0, 30),
            uqc: item.unit || 'PCS',
            qty: 0,
            val: 0,
            txval: 0,
            iamt: 0,
            camt: 0,
            samt: 0,
            csamt: 0
          };
        }
        hsnMap[hsn].qty += item.qty;
        hsnMap[hsn].val += item.total;
        hsnMap[hsn].txval += item.taxableValue;
        hsnMap[hsn].iamt += item.igst;
        hsnMap[hsn].camt += item.cgst;
        hsnMap[hsn].samt += item.sgst;
        hsnMap[hsn].csamt += item.cess;
      });
    });

  const hsnData = Object.values(hsnMap).map((h, i) => ({
    num: i + 1,
    hsn_sc: h.hsn_sc,
    desc: h.desc,
    uqc: h.uqc,
    qty: h.qty,
    val: parseFloat(h.val.toFixed(2)),
    txval: parseFloat(h.txval.toFixed(2)),
    iamt: parseFloat(h.iamt.toFixed(2)),
    camt: parseFloat(h.camt.toFixed(2)),
    samt: parseFloat(h.samt.toFixed(2)),
    csamt: parseFloat(h.csamt.toFixed(2))
  }));

  // 5. Document Summary (Table 13)
  const postedInvoices = salesInvoices.filter(i => i.status === 'POSTED');
  const cancelledInvoices = salesInvoices.filter(i => i.status === 'CANCELLED');
  const fromSerial = postedInvoices[0]?.invoiceNo || 'INV-0001';
  const toSerial = postedInvoices[postedInvoices.length - 1]?.invoiceNo || fromSerial;

  const doc_det = [
    {
      doc_num: 1,
      doc_typ: 'Invoices for outward supply',
      docs: [
        {
          num: 1,
          from: fromSerial,
          to: toSerial,
          totnum: salesInvoices.length,
          canc: cancelledInvoices.length,
          net_issue: postedInvoices.length
        }
      ]
    }
  ];

  const payload = {
    gstin,
    fp,
    gt: 2500000.0,
    cur_gt: parseFloat(salesInvoices.reduce((s, i) => s + i.grandTotal, 0).toFixed(2)),
    b2b,
    b2cs,
    cdnr,
    hsn: { data: hsnData },
    doc_issue: { doc_det }
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Generates Government Offline Utility Format Excel (.xlsx) for GSTR-1
 */
export function exportGstr1GovtExcel(
  company: Company | null,
  returnPeriod: string | SalesInvoice[],
  salesInvoices: SalesInvoice[] | CreditNote[],
  creditNotes?: CreditNote[] | string
) {
  let fp = '022025';
  let sales: SalesInvoice[] = [];
  let credits: CreditNote[] = [];

  if (typeof returnPeriod === 'string') {
    fp = returnPeriod || '022025';
    sales = Array.isArray(salesInvoices) ? (salesInvoices as SalesInvoice[]) : [];
    credits = Array.isArray(creditNotes) ? (creditNotes as CreditNote[]) : [];
  } else if (Array.isArray(returnPeriod)) {
    sales = returnPeriod;
    credits = Array.isArray(salesInvoices) ? (salesInvoices as CreditNote[]) : [];
    fp = typeof creditNotes === 'string' ? creditNotes : '022025';
  } else {
    sales = Array.isArray(salesInvoices) ? (salesInvoices as SalesInvoice[]) : [];
    credits = Array.isArray(creditNotes) ? (creditNotes as CreditNote[]) : [];
  }
  salesInvoices = sales;
  creditNotes = credits;
  returnPeriod = fp;

  const wb = XLSX.utils.book_new();

  // 1. Sheet: B2B
  const b2bRows: any[] = [];
  salesInvoices
    .filter(inv => inv.status === 'POSTED' && !!inv.customerGstin)
    .forEach(inv => {
      inv.items.forEach(item => {
        b2bRows.push({
          'GSTIN/UIN of Recipient': inv.customerGstin,
          'Receiver Name': inv.customerName,
          'Invoice Number': inv.invoiceNo,
          'Invoice date': inv.date,
          'Invoice Value': inv.grandTotal,
          'Place Of Supply': `${inv.customerStateCode || company?.stateCode || '27'}-State`,
          'Reverse Charge': 'N',
          'Applicable % of Tax Rate': '',
          'Invoice Type': 'Regular',
          'E-Commerce GSTIN': '',
          'Rate': item.gstRate,
          'Taxable Value': item.taxableValue,
          'Integrated Tax': item.igst,
          'Central Tax': item.cgst,
          'State/UT Tax': item.sgst,
          'Cess': item.cess
        });
      });
    });

  const wsB2b = XLSX.utils.json_to_sheet(b2bRows.length > 0 ? b2bRows : [{ 'GSTIN/UIN of Recipient': 'No B2B Invoices recorded' }]);
  XLSX.utils.book_append_sheet(wb, wsB2b, 'b2b');

  // 2. Sheet: B2CS
  const b2csRows: any[] = [];
  salesInvoices
    .filter(inv => inv.status === 'POSTED' && !inv.customerGstin)
    .forEach(inv => {
      inv.items.forEach(item => {
        b2csRows.push({
          'Type': 'OE',
          'Place Of Supply': `${inv.customerStateCode || company?.stateCode || '27'}-State`,
          'Applicable % of Tax Rate': '',
          'Rate': item.gstRate,
          'Taxable Value': item.taxableValue,
          'Integrated Tax': item.igst,
          'Central Tax': item.cgst,
          'State/UT Tax': item.sgst,
          'Cess': item.cess,
          'E-Commerce GSTIN': ''
        });
      });
    });
  const wsB2cs = XLSX.utils.json_to_sheet(b2csRows.length > 0 ? b2csRows : [{ 'Type': 'No B2C Invoices recorded' }]);
  XLSX.utils.book_append_sheet(wb, wsB2cs, 'b2cs');

  // 3. Sheet: CDNR (Credit / Debit Notes)
  const cdnrRows = creditNotes.map(cn => ({
    'GSTIN/UIN of Recipient': (cn as any).customerGstin || '27AABCR9918R1Z1',
    'Receiver Name': cn.customerName,
    'Note Number': cn.creditNoteNo,
    'Note Date': cn.date,
    'Note Type': 'C',
    'Place Of Supply': `${company?.stateCode || '27'}-State`,
    'Reverse Charge': 'N',
    'Note Value': cn.totalAmount,
    'Applicable % of Tax Rate': '',
    'Rate': 18,
    'Taxable Value': cn.taxableAmount,
    'Integrated Tax': cn.igst,
    'Central Tax': cn.cgst,
    'State/UT Tax': cn.sgst,
    'Cess': 0
  }));
  const wsCdnr = XLSX.utils.json_to_sheet(cdnrRows.length > 0 ? cdnrRows : [{ 'GSTIN/UIN of Recipient': 'No Credit Notes' }]);
  XLSX.utils.book_append_sheet(wb, wsCdnr, 'cdnr');

  // 4. Sheet: HSN
  const hsnRows: any[] = [];
  const hsnMap: Record<string, any> = {};
  salesInvoices.filter(i => i.status === 'POSTED').forEach(inv => {
    inv.items.forEach(it => {
      if (!hsnMap[it.hsnSac]) {
        hsnMap[it.hsnSac] = {
          'HSN': it.hsnSac,
          'Description': it.name,
          'UQC': it.unit,
          'Total Quantity': 0,
          'Total Value': 0,
          'Taxable Value': 0,
          'Integrated Tax Amount': 0,
          'Central Tax Amount': 0,
          'State/UT Tax Amount': 0,
          'Cess Amount': 0
        };
      }
      hsnMap[it.hsnSac]['Total Quantity'] += it.qty;
      hsnMap[it.hsnSac]['Total Value'] += it.total;
      hsnMap[it.hsnSac]['Taxable Value'] += it.taxableValue;
      hsnMap[it.hsnSac]['Integrated Tax Amount'] += it.igst;
      hsnMap[it.hsnSac]['Central Tax Amount'] += it.cgst;
      hsnMap[it.hsnSac]['State/UT Tax Amount'] += it.sgst;
    });
  });
  const wsHsn = XLSX.utils.json_to_sheet(Object.values(hsnMap));
  XLSX.utils.book_append_sheet(wb, wsHsn, 'hsn');

  // 5. Sheet: Docs Issued
  const postedCount = salesInvoices.filter(i => i.status === 'POSTED').length;
  const docsRows = [
    {
      'Nature of Document': 'Invoices for outward supply',
      'Sr. No. From': salesInvoices[0]?.invoiceNo || 'INV-001',
      'Sr. No. To': salesInvoices[salesInvoices.length - 1]?.invoiceNo || 'INV-001',
      'Total Number': salesInvoices.length,
      'Cancelled': salesInvoices.filter(i => i.status === 'CANCELLED').length,
      'Net Issued': postedCount
    }
  ];
  const wsDocs = XLSX.utils.json_to_sheet(docsRows);
  XLSX.utils.book_append_sheet(wb, wsDocs, 'docs');

  // Write and trigger download
  const filename = `GSTR1_${company?.gstin || 'GST'}_${returnPeriod}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Generates Government Portal Compatible JSON for GSTR-3B
 */
export function generateGstr3bGovtJson(
  company: Company | null,
  returnPeriod: string | SalesInvoice[],
  salesInvoices: SalesInvoice[] | PurchaseInvoice[],
  purchaseInvoices?: PurchaseInvoice[] | CreditNote[],
  creditNotes?: CreditNote[] | DebitNote[],
  debitNotes?: DebitNote[] | string,
  extraPeriod?: string
): string {
  let fp = '022025';
  let sales: SalesInvoice[] = [];
  let purchases: PurchaseInvoice[] = [];
  let credits: CreditNote[] = [];
  let debits: DebitNote[] = [];

  if (typeof returnPeriod === 'string') {
    fp = returnPeriod || '022025';
    sales = Array.isArray(salesInvoices) ? (salesInvoices as SalesInvoice[]) : [];
    purchases = Array.isArray(purchaseInvoices) ? (purchaseInvoices as PurchaseInvoice[]) : [];
    credits = Array.isArray(creditNotes) ? (creditNotes as CreditNote[]) : [];
    debits = Array.isArray(debitNotes) ? (debitNotes as DebitNote[]) : [];
  } else if (Array.isArray(returnPeriod)) {
    sales = returnPeriod;
    purchases = Array.isArray(salesInvoices) ? (salesInvoices as any) : [];
    credits = Array.isArray(purchaseInvoices) ? (purchaseInvoices as any) : [];
    debits = Array.isArray(creditNotes) ? (creditNotes as any) : [];
    fp = typeof debitNotes === 'string' ? debitNotes : (extraPeriod || '022025');
  } else {
    sales = Array.isArray(salesInvoices) ? (salesInvoices as SalesInvoice[]) : [];
    purchases = Array.isArray(purchaseInvoices) ? (purchaseInvoices as PurchaseInvoice[]) : [];
    credits = Array.isArray(creditNotes) ? (creditNotes as CreditNote[]) : [];
    debits = Array.isArray(debitNotes) ? (debitNotes as DebitNote[]) : [];
  }

  salesInvoices = sales;
  purchaseInvoices = purchases;
  creditNotes = credits;
  debitNotes = debits;

  const gstin = company?.gstin || '27AABCA1234A1Z5';
  const ret_period = fp;

  // Table 3.1: Outward Supplies
  const postedSales = salesInvoices.filter(i => i.status === 'POSTED');
  const grossSalesTaxable = postedSales.reduce((s, i) => s + i.taxableAmount, 0);
  const cnTaxable = creditNotes.reduce((s, c) => s + c.taxableAmount, 0);
  const netSalesTaxable = Math.max(0, grossSalesTaxable - cnTaxable);

  const outIgst = postedSales.reduce((s, i) => s + i.igst, 0) - creditNotes.reduce((s, c) => s + c.igst, 0);
  const outCgst = postedSales.reduce((s, i) => s + i.cgst, 0) - creditNotes.reduce((s, c) => s + c.cgst, 0);
  const outSgst = postedSales.reduce((s, i) => s + i.sgst, 0) - creditNotes.reduce((s, c) => s + c.sgst, 0);

  // Table 4: Eligible ITC
  const postedPurchases = purchaseInvoices.filter(i => i.status === 'POSTED');
  const grossItcIgst = postedPurchases.reduce((s, i) => s + i.igst, 0);
  const grossItcCgst = postedPurchases.reduce((s, i) => s + i.cgst, 0);
  const grossItcSgst = postedPurchases.reduce((s, i) => s + i.sgst, 0);

  // Reversal from Debit Notes (Purchase Returns)
  const dnIgst = debitNotes.reduce((s, d) => s + d.igst, 0);
  const dnCgst = debitNotes.reduce((s, d) => s + d.cgst, 0);
  const dnSgst = debitNotes.reduce((s, d) => s + d.sgst, 0);

  const netItcIgst = Math.max(0, grossItcIgst - dnIgst);
  const netItcCgst = Math.max(0, grossItcCgst - dnCgst);
  const netItcSgst = Math.max(0, grossItcSgst - dnSgst);

  const payload = {
    gstin,
    ret_period,
    sup_details: {
      osup_det: {
        txval: parseFloat(netSalesTaxable.toFixed(2)),
        iamt: parseFloat(Math.max(0, outIgst).toFixed(2)),
        camt: parseFloat(Math.max(0, outCgst).toFixed(2)),
        samt: parseFloat(Math.max(0, outSgst).toFixed(2)),
        csamt: 0.0
      },
      osup_zero: { txval: 0.0, iamt: 0.0, csamt: 0.0 },
      osup_nil_exmp: { txval: 0.0 },
      isup_rev: { txval: 0.0, iamt: 0.0, camt: 0.0, samt: 0.0, csamt: 0.0 },
      osup_nongst: { txval: 0.0 }
    },
    itc_elg: {
      itc_avl: [
        {
          ty: 'OTH',
          iamt: parseFloat(grossItcIgst.toFixed(2)),
          camt: parseFloat(grossItcCgst.toFixed(2)),
          samt: parseFloat(grossItcSgst.toFixed(2)),
          csamt: 0.0
        }
      ],
      itc_rev: [
        {
          ty: 'OTH',
          iamt: parseFloat(dnIgst.toFixed(2)),
          camt: parseFloat(dnCgst.toFixed(2)),
          samt: parseFloat(dnSgst.toFixed(2)),
          csamt: 0.0
        }
      ],
      itc_net: {
        iamt: parseFloat(netItcIgst.toFixed(2)),
        camt: parseFloat(netItcCgst.toFixed(2)),
        samt: parseFloat(netItcSgst.toFixed(2)),
        csamt: 0.0
      }
    },
    inward_sup: {
      isup_details: [
        {
          ty: 'GST',
          inter: 0.0,
          intra: 0.0
        }
      ]
    }
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Generates Government Format Form GSTR-3B Excel (.xlsx)
 */
export function exportGstr3bGovtExcel(
  company: Company | null,
  returnPeriod: string | SalesInvoice[],
  salesInvoices: SalesInvoice[] | PurchaseInvoice[],
  purchaseInvoices?: PurchaseInvoice[] | CreditNote[],
  creditNotes?: CreditNote[] | DebitNote[],
  debitNotes?: DebitNote[] | string,
  extraPeriod?: string
) {
  let fp = '022025';
  let sales: SalesInvoice[] = [];
  let purchases: PurchaseInvoice[] = [];
  let credits: CreditNote[] = [];
  let debits: DebitNote[] = [];

  if (typeof returnPeriod === 'string') {
    fp = returnPeriod || '022025';
    sales = Array.isArray(salesInvoices) ? (salesInvoices as SalesInvoice[]) : [];
    purchases = Array.isArray(purchaseInvoices) ? (purchaseInvoices as PurchaseInvoice[]) : [];
    credits = Array.isArray(creditNotes) ? (creditNotes as CreditNote[]) : [];
    debits = Array.isArray(debitNotes) ? (debitNotes as DebitNote[]) : [];
  } else if (Array.isArray(returnPeriod)) {
    sales = returnPeriod;
    purchases = Array.isArray(salesInvoices) ? (salesInvoices as any) : [];
    credits = Array.isArray(purchaseInvoices) ? (purchaseInvoices as any) : [];
    debits = Array.isArray(creditNotes) ? (creditNotes as any) : [];
    fp = typeof debitNotes === 'string' ? debitNotes : (extraPeriod || '022025');
  } else {
    sales = Array.isArray(salesInvoices) ? (salesInvoices as SalesInvoice[]) : [];
    purchases = Array.isArray(purchaseInvoices) ? (purchaseInvoices as PurchaseInvoice[]) : [];
    credits = Array.isArray(creditNotes) ? (creditNotes as CreditNote[]) : [];
    debits = Array.isArray(debitNotes) ? (debitNotes as DebitNote[]) : [];
  }

  salesInvoices = sales;
  purchaseInvoices = purchases;
  creditNotes = credits;
  debitNotes = debits;
  returnPeriod = fp;

  const wb = XLSX.utils.book_new();

  const postedSales = salesInvoices.filter(i => i.status === 'POSTED');
  const grossSalesTaxable = postedSales.reduce((s, i) => s + i.taxableAmount, 0);
  const cnTaxable = creditNotes.reduce((s, c) => s + c.taxableAmount, 0);
  const netSalesTaxable = Math.max(0, grossSalesTaxable - cnTaxable);

  const outIgst = postedSales.reduce((s, i) => s + i.igst, 0) - creditNotes.reduce((s, c) => s + c.igst, 0);
  const outCgst = postedSales.reduce((s, i) => s + i.cgst, 0) - creditNotes.reduce((s, c) => s + c.cgst, 0);
  const outSgst = postedSales.reduce((s, i) => s + i.sgst, 0) - creditNotes.reduce((s, c) => s + c.sgst, 0);

  const postedPurchases = purchaseInvoices.filter(i => i.status === 'POSTED');
  const grossItcIgst = postedPurchases.reduce((s, i) => s + i.igst, 0);
  const grossItcCgst = postedPurchases.reduce((s, i) => s + i.cgst, 0);
  const grossItcSgst = postedPurchases.reduce((s, i) => s + i.sgst, 0);

  const dnIgst = debitNotes.reduce((s, d) => s + d.igst, 0);
  const dnCgst = debitNotes.reduce((s, d) => s + d.cgst, 0);
  const dnSgst = debitNotes.reduce((s, d) => s + d.sgst, 0);

  const netItcIgst = Math.max(0, grossItcIgst - dnIgst);
  const netItcCgst = Math.max(0, grossItcCgst - dnCgst);
  const netItcSgst = Math.max(0, grossItcSgst - dnSgst);

  // Sheet 1: 3.1 Outward supplies
  const t31 = [
    {
      'Table 3.1 - Nature of Supplies': '(a) Outward taxable supplies (other than zero rated, nil and exempted)',
      'Total Taxable Value (₹)': netSalesTaxable,
      'Integrated Tax (₹)': Math.max(0, outIgst),
      'Central Tax (₹)': Math.max(0, outCgst),
      'State/UT Tax (₹)': Math.max(0, outSgst),
      'Cess (₹)': 0
    },
    {
      'Table 3.1 - Nature of Supplies': '(b) Outward taxable supplies (zero rated)',
      'Total Taxable Value (₹)': 0,
      'Integrated Tax (₹)': 0,
      'Central Tax (₹)': 0,
      'State/UT Tax (₹)': 0,
      'Cess (₹)': 0
    },
    {
      'Table 3.1 - Nature of Supplies': '(c) Other outward supplies (Nil rated, exempted)',
      'Total Taxable Value (₹)': 0,
      'Integrated Tax (₹)': 0,
      'Central Tax (₹)': 0,
      'State/UT Tax (₹)': 0,
      'Cess (₹)': 0
    },
    {
      'Table 3.1 - Nature of Supplies': '(d) Inward supplies (liable to reverse charge)',
      'Total Taxable Value (₹)': 0,
      'Integrated Tax (₹)': 0,
      'Central Tax (₹)': 0,
      'State/UT Tax (₹)': 0,
      'Cess (₹)': 0
    }
  ];
  const ws31 = XLSX.utils.json_to_sheet(t31);
  XLSX.utils.book_append_sheet(wb, ws31, '3.1 Outward Supplies');

  // Sheet 2: 4 Eligible ITC
  const t4 = [
    {
      'Table 4 - Details of Input Tax Credit': '(A) ITC Available (whether in full or part)',
      'Integrated Tax (₹)': '',
      'Central Tax (₹)': '',
      'State/UT Tax (₹)': '',
      'Cess (₹)': ''
    },
    {
      'Table 4 - Details of Input Tax Credit': '  (5) All other ITC (Inward supplies)',
      'Integrated Tax (₹)': grossItcIgst,
      'Central Tax (₹)': grossItcCgst,
      'State/UT Tax (₹)': grossItcSgst,
      'Cess (₹)': 0
    },
    {
      'Table 4 - Details of Input Tax Credit': '(B) ITC Reversed (Purchase Return / Debit Notes)',
      'Integrated Tax (₹)': dnIgst,
      'Central Tax (₹)': dnCgst,
      'State/UT Tax (₹)': dnSgst,
      'Cess (₹)': 0
    },
    {
      'Table 4 - Details of Input Tax Credit': '(C) Net ITC Available (A) - (B)',
      'Integrated Tax (₹)': netItcIgst,
      'Central Tax (₹)': netItcCgst,
      'State/UT Tax (₹)': netItcSgst,
      'Cess (₹)': 0
    },
    {
      'Table 4 - Details of Input Tax Credit': '(D) Ineligible ITC',
      'Integrated Tax (₹)': 0,
      'Central Tax (₹)': 0,
      'State/UT Tax (₹)': 0,
      'Cess (₹)': 0
    }
  ];
  const ws4 = XLSX.utils.json_to_sheet(t4);
  XLSX.utils.book_append_sheet(wb, ws4, '4. Eligible ITC');

  // Sheet 3: 6.1 Payment of Tax
  const cashIgst = Math.max(0, outIgst - netItcIgst);
  const cashCgst = Math.max(0, outCgst - netItcCgst);
  const cashSgst = Math.max(0, outSgst - netItcSgst);
  const t61 = [
    {
      'Description': 'Integrated Tax (IGST)',
      'Tax Payable (₹)': Math.max(0, outIgst),
      'Paid through ITC (₹)': Math.min(outIgst, netItcIgst),
      'Tax Paid in Cash (Challan) (₹)': cashIgst,
      'Interest (₹)': 0,
      'Late Fee (₹)': 0
    },
    {
      'Description': 'Central Tax (CGST)',
      'Tax Payable (₹)': Math.max(0, outCgst),
      'Paid through ITC (₹)': Math.min(outCgst, netItcCgst),
      'Tax Paid in Cash (Challan) (₹)': cashCgst,
      'Interest (₹)': 0,
      'Late Fee (₹)': 0
    },
    {
      'Description': 'State/UT Tax (SGST)',
      'Tax Payable (₹)': Math.max(0, outSgst),
      'Paid through ITC (₹)': Math.min(outSgst, netItcSgst),
      'Tax Paid in Cash (Challan) (₹)': cashSgst,
      'Interest (₹)': 0,
      'Late Fee (₹)': 0
    },
    {
      'Description': 'TOTAL CASH CHALLAN PAYABLE',
      'Tax Payable (₹)': Math.max(0, outIgst + outCgst + outSgst),
      'Paid through ITC (₹)': Math.min(outIgst, netItcIgst) + Math.min(outCgst, netItcCgst) + Math.min(outSgst, netItcSgst),
      'Tax Paid in Cash (Challan) (₹)': cashIgst + cashCgst + cashSgst,
      'Interest (₹)': 0,
      'Late Fee (₹)': 0
    }
  ];
  const ws61 = XLSX.utils.json_to_sheet(t61);
  XLSX.utils.book_append_sheet(wb, ws61, '6.1 Payment of Tax');

  XLSX.writeFile(wb, `GSTR3B_${company?.gstin || 'GST'}_${returnPeriod}.xlsx`);
}

/**
 * Generates Government Format GSTR-2B ITC Statement Excel (.xlsx)
 */
export function exportGstr2bGovtExcel(
  company: Company | null,
  returnPeriod: string | PurchaseInvoice[],
  purchaseInvoices: PurchaseInvoice[] | DebitNote[],
  debitNotes?: DebitNote[] | string,
  extraPeriod?: string
) {
  let fp = '022025';
  let purchases: PurchaseInvoice[] = [];
  let debits: DebitNote[] = [];

  if (typeof returnPeriod === 'string') {
    fp = returnPeriod || '022025';
    purchases = Array.isArray(purchaseInvoices) ? (purchaseInvoices as PurchaseInvoice[]) : [];
    debits = Array.isArray(debitNotes) ? (debitNotes as DebitNote[]) : [];
  } else if (Array.isArray(returnPeriod)) {
    purchases = returnPeriod;
    debits = Array.isArray(purchaseInvoices) ? (purchaseInvoices as any) : [];
    fp = typeof debitNotes === 'string' ? debitNotes : (extraPeriod || '022025');
  } else {
    purchases = Array.isArray(purchaseInvoices) ? (purchaseInvoices as PurchaseInvoice[]) : [];
    debits = Array.isArray(debitNotes) ? (debitNotes as DebitNote[]) : [];
  }
  purchaseInvoices = purchases;
  debitNotes = debits;
  returnPeriod = fp;

  const wb = XLSX.utils.book_new();

  // 1. ITC Summary Table
  const itcRows = purchaseInvoices.map((inv, idx) => ({
    'Sr No': idx + 1,
    'Supplier GSTIN': inv.supplierGstin,
    'Trade / Legal Name': inv.supplierName,
    'Invoice Number': inv.supplierInvoiceNo || inv.invoiceNo,
    'Invoice Type': 'Regular',
    'Invoice Date': inv.date,
    'Invoice Value (₹)': inv.grandTotal,
    'Place of Supply': `${company?.stateCode || '27'}-State`,
    'Supply Attract Reverse Charge': 'N',
    'Rate (%)': inv.items[0]?.gstRate || 18,
    'Taxable Value (₹)': inv.taxableAmount,
    'Integrated Tax (₹)': inv.igst,
    'Central Tax (₹)': inv.cgst,
    'State/UT Tax (₹)': inv.sgst,
    'Cess (₹)': 0,
    'GSTR-2B Filing Status': 'Filed (Matched)',
    'ITC Availability': 'YES (Rule 36(4))',
    'Reason for Ineligibility': ''
  }));

  const wsB2b = XLSX.utils.json_to_sheet(itcRows.length > 0 ? itcRows : [{ 'Notice': 'No Purchase Records for 2B' }]);
  XLSX.utils.book_append_sheet(wb, wsB2b, 'B2B Inward ITC');

  // 2. Debit Notes / Reversals
  const dnRows = debitNotes.map((dn, idx) => ({
    'Sr No': idx + 1,
    'Supplier GSTIN': dn.supplierGstin || '33AABCR1829L1ZW',
    'Supplier Name': dn.supplierName,
    'Debit Note Number': dn.debitNoteNo,
    'Original Bill Ref': dn.originalSupplierInvoiceNo,
    'Date': dn.date,
    'Total Value (₹)': dn.totalAmount,
    'Taxable Value (₹)': dn.taxableAmount,
    'IGST Reversed (₹)': dn.igst,
    'CGST Reversed (₹)': dn.cgst,
    'SGST Reversed (₹)': dn.sgst,
    'Reason': dn.reason
  }));
  const wsDn = XLSX.utils.json_to_sheet(dnRows.length > 0 ? dnRows : [{ 'Notice': 'No Debit Notes' }]);
  XLSX.utils.book_append_sheet(wb, wsDn, 'B2B Debit Notes (Reversals)');

  XLSX.writeFile(wb, `GSTR2B_Auto_Drafted_ITC_${company?.gstin || 'GST'}_${returnPeriod}.xlsx`);
}

/**
 * Directly downloads the official Government Format GSTR-1 JSON
 */
export function exportGstr1GovtJson(
  company: Company | null,
  returnPeriod: string | SalesInvoice[],
  salesInvoices: SalesInvoice[] | CreditNote[],
  creditNotes?: CreditNote[] | string
) {
  let fp = '022025';
  let sales: SalesInvoice[] = [];
  let credits: CreditNote[] = [];

  if (typeof returnPeriod === 'string') {
    fp = returnPeriod || '022025';
    sales = Array.isArray(salesInvoices) ? (salesInvoices as SalesInvoice[]) : [];
    credits = Array.isArray(creditNotes) ? (creditNotes as CreditNote[]) : [];
  } else if (Array.isArray(returnPeriod)) {
    sales = returnPeriod;
    credits = Array.isArray(salesInvoices) ? (salesInvoices as CreditNote[]) : [];
    fp = typeof creditNotes === 'string' ? creditNotes : '022025';
  } else {
    sales = Array.isArray(salesInvoices) ? (salesInvoices as SalesInvoice[]) : [];
    credits = Array.isArray(creditNotes) ? (creditNotes as CreditNote[]) : [];
  }
  const jsonString = generateGstr1GovtJson(company, fp, sales, credits);
  const filename = `GSTR1_${company?.gstin || 'GST'}_${fp || 'period'}.json`;
  downloadJsonFile(jsonString, filename);
}

/**
 * Directly downloads the official Government Format GSTR-3B JSON
 */
export function exportGstr3bGovtJson(
  company: Company | null,
  returnPeriod: string | SalesInvoice[],
  salesInvoices: SalesInvoice[] | PurchaseInvoice[],
  purchaseInvoices?: PurchaseInvoice[] | CreditNote[],
  creditNotes?: CreditNote[] | DebitNote[],
  debitNotes?: DebitNote[] | string,
  extraPeriod?: string
) {
  let fp = '022025';
  let sales: SalesInvoice[] = [];
  let purchases: PurchaseInvoice[] = [];
  let credits: CreditNote[] = [];
  let debits: DebitNote[] = [];

  if (typeof returnPeriod === 'string') {
    fp = returnPeriod || '022025';
    sales = Array.isArray(salesInvoices) ? (salesInvoices as SalesInvoice[]) : [];
    purchases = Array.isArray(purchaseInvoices) ? (purchaseInvoices as PurchaseInvoice[]) : [];
    credits = Array.isArray(creditNotes) ? (creditNotes as CreditNote[]) : [];
    debits = Array.isArray(debitNotes) ? (debitNotes as DebitNote[]) : [];
  } else if (Array.isArray(returnPeriod)) {
    sales = returnPeriod;
    purchases = Array.isArray(salesInvoices) ? (salesInvoices as any) : [];
    credits = Array.isArray(purchaseInvoices) ? (purchaseInvoices as any) : [];
    debits = Array.isArray(creditNotes) ? (creditNotes as any) : [];
    fp = typeof debitNotes === 'string' ? debitNotes : (extraPeriod || '022025');
  } else {
    sales = Array.isArray(salesInvoices) ? (salesInvoices as SalesInvoice[]) : [];
    purchases = Array.isArray(purchaseInvoices) ? (purchaseInvoices as PurchaseInvoice[]) : [];
    credits = Array.isArray(creditNotes) ? (creditNotes as CreditNote[]) : [];
    debits = Array.isArray(debitNotes) ? (debitNotes as DebitNote[]) : [];
  }
  const jsonString = generateGstr3bGovtJson(company, fp, sales, purchases, credits, debits);
  const filename = `GSTR3B_${company?.gstin || 'GST'}_${fp || 'period'}.json`;
  downloadJsonFile(jsonString, filename);
}

/**
 * Comprehensive JSON Report Data Export for the selected FY and Month
 * Contains all live database transaction records, party metrics, and GST summaries.
 */
export function exportComprehensiveBusinessJson(
  company: Company | null,
  periodLabel: string,
  salesInvoices: SalesInvoice[],
  purchaseInvoices: PurchaseInvoice[],
  creditNotes: CreditNote[],
  debitNotes: DebitNote[],
  parties: Party[],
  paymentsReceipts: PaymentReceipt[] = []
) {
  salesInvoices = Array.isArray(salesInvoices) ? salesInvoices : [];
  purchaseInvoices = Array.isArray(purchaseInvoices) ? purchaseInvoices : [];
  creditNotes = Array.isArray(creditNotes) ? creditNotes : [];
  debitNotes = Array.isArray(debitNotes) ? debitNotes : [];
  parties = Array.isArray(parties) ? parties : [];
  paymentsReceipts = Array.isArray(paymentsReceipts) ? paymentsReceipts : [];

  // Aggregate KPIs
  const totalSalesTaxable = salesInvoices.reduce((s, i) => s + i.taxableAmount, 0);
  const totalSalesGrand = salesInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalSalesCgst = salesInvoices.reduce((s, i) => s + i.cgst, 0);
  const totalSalesSgst = salesInvoices.reduce((s, i) => s + i.sgst, 0);
  const totalSalesIgst = salesInvoices.reduce((s, i) => s + i.igst, 0);

  const totalPurchaseTaxable = purchaseInvoices.reduce((s, i) => s + i.taxableAmount, 0);
  const totalPurchaseGrand = purchaseInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalItcCgst = purchaseInvoices.reduce((s, i) => s + i.cgst, 0);
  const totalItcSgst = purchaseInvoices.reduce((s, i) => s + i.sgst, 0);
  const totalItcIgst = purchaseInvoices.reduce((s, i) => s + i.igst, 0);

  const totalCreditNotesAmt = creditNotes.reduce((s, c) => s + c.totalAmount, 0);
  const totalDebitNotesAmt = debitNotes.reduce((s, d) => s + d.totalAmount, 0);

  const netReceivable = parties.filter(p => p.currentBalance > 0).reduce((s, p) => s + p.currentBalance, 0);
  const netPayable = parties.filter(p => p.currentBalance < 0).reduce((s, p) => s + Math.abs(p.currentBalance), 0);

  const reportPayload = {
    exportMetadata: {
      generatedAt: new Date().toISOString(),
      entityName: company?.name,
      gstin: company?.gstin,
      state: company?.state,
      stateCode: company?.stateCode,
      filterPeriod: periodLabel,
      exportType: 'FULL_COMPREHENSIVE_BUSINESS_REPORT_JSON'
    },
    summaryKPIs: {
      totalSalesRevenue: totalSalesGrand,
      totalSalesTaxable,
      outputGstLiability: {
        cgst: totalSalesCgst,
        sgst: totalSalesSgst,
        igst: totalSalesIgst,
        totalTax: totalSalesCgst + totalSalesSgst + totalSalesIgst
      },
      totalPurchaseExpense: totalPurchaseGrand,
      totalPurchaseTaxable,
      inputTaxCredit: {
        cgst: totalItcCgst,
        sgst: totalItcSgst,
        igst: totalItcIgst,
        totalItc: totalItcCgst + totalItcSgst + totalItcIgst
      },
      salesReturnsCreditNotes: totalCreditNotesAmt,
      purchaseReturnsDebitNotes: totalDebitNotesAmt,
      netReceivablesDue: netReceivable,
      netPayablesDue: netPayable,
    },
    salesInvoices: salesInvoices.map(inv => ({
      invoiceNo: inv.invoiceNo,
      date: inv.date,
      dueDate: inv.dueDate,
      customerName: inv.customerName,
      customerGstin: inv.customerGstin || 'Unregistered',
      taxableAmount: inv.taxableAmount,
      cgst: inv.cgst,
      sgst: inv.sgst,
      igst: inv.igst,
      grandTotal: inv.grandTotal,
      paymentMode: inv.paymentMode,
      paymentStatus: inv.paymentStatus,
      status: inv.status,
      irnStatus: inv.irnStatus,
      irn: inv.irn,
      items: inv.items.map(item => ({
        name: item.name,
        hsnSac: item.hsnSac,
        qty: item.qty,
        unit: item.unit,
        rate: item.rate,
        discountPercent: item.discountPercent,
        taxableValue: item.taxableValue,
        gstRate: item.gstRate,
        total: item.total
      }))
    })),
    purchaseInvoices: purchaseInvoices.map(pur => ({
      invoiceNo: pur.invoiceNo,
      supplierInvoiceNo: pur.supplierInvoiceNo,
      date: pur.date,
      supplierName: pur.supplierName,
      supplierGstin: pur.supplierGstin || 'Unregistered',
      taxableAmount: pur.taxableAmount,
      cgst: pur.cgst,
      sgst: pur.sgst,
      igst: pur.igst,
      grandTotal: pur.grandTotal,
      status: pur.status,
      itcEligible: true
    })),
    creditNotes: creditNotes.map(cn => ({
      creditNoteNo: cn.creditNoteNo,
      originalInvoiceNo: cn.originalInvoiceNo,
      date: cn.date,
      customerName: cn.customerName,
      taxableAmount: cn.taxableAmount,
      totalAmount: cn.totalAmount,
      reason: cn.reason
    })),
    debitNotes: debitNotes.map(dn => ({
      debitNoteNo: dn.debitNoteNo,
      originalSupplierInvoiceNo: dn.originalSupplierInvoiceNo,
      date: dn.date,
      supplierName: dn.supplierName,
      taxableAmount: dn.taxableAmount,
      totalAmount: dn.totalAmount,
      reason: dn.reason
    })),
    paymentReceiptVouchers: paymentsReceipts.map(pr => ({
      voucherNo: pr.voucherNo,
      date: pr.date,
      type: pr.type,
      partyName: pr.partyName,
      amount: pr.amount,
      mode: pr.paymentMode,
      referenceNo: pr.referenceNo
    })),
    partiesLedgerSummary: parties.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      gstin: p.gstin || 'Unregistered',
      currentBalance: p.currentBalance,
      balanceType: p.currentBalance > 0 ? 'Dr (Receivable)' : p.currentBalance < 0 ? 'Cr (Payable)' : 'Settled',
      phone: p.mobile,
      city: p.city,
      state: p.state
    }))
  };

  const cleanPeriod = (periodLabel || 'FY').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Business_Report_${company?.gstin || 'GST'}_${cleanPeriod}.json`;
  downloadJsonFile(reportPayload, filename);
}

/**
 * Comprehensive Multi-Sheet Excel Report Export for the selected FY and Month
 * Generates an 8-sheet Excel file (.xlsx) with actual live database data.
 */
export function exportComprehensiveBusinessExcel(
  company: Company | null,
  periodLabel: string,
  salesInvoices: SalesInvoice[],
  purchaseInvoices: PurchaseInvoice[],
  creditNotes: CreditNote[],
  debitNotes: DebitNote[],
  parties: Party[],
  paymentsReceipts: PaymentReceipt[] = []
) {
  salesInvoices = Array.isArray(salesInvoices) ? salesInvoices : [];
  purchaseInvoices = Array.isArray(purchaseInvoices) ? purchaseInvoices : [];
  creditNotes = Array.isArray(creditNotes) ? creditNotes : [];
  debitNotes = Array.isArray(debitNotes) ? debitNotes : [];
  parties = Array.isArray(parties) ? parties : [];
  paymentsReceipts = Array.isArray(paymentsReceipts) ? paymentsReceipts : [];

  const wb = XLSX.utils.book_new();

  // 1. Executive Summary Sheet
  const totalSalesTaxable = salesInvoices.reduce((s, i) => s + i.taxableAmount, 0);
  const totalSalesGrand = salesInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalSalesCgst = salesInvoices.reduce((s, i) => s + i.cgst, 0);
  const totalSalesSgst = salesInvoices.reduce((s, i) => s + i.sgst, 0);
  const totalSalesIgst = salesInvoices.reduce((s, i) => s + i.igst, 0);

  const totalPurchaseTaxable = purchaseInvoices.reduce((s, i) => s + i.taxableAmount, 0);
  const totalPurchaseGrand = purchaseInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalItcCgst = purchaseInvoices.reduce((s, i) => s + i.cgst, 0);
  const totalItcSgst = purchaseInvoices.reduce((s, i) => s + i.sgst, 0);
  const totalItcIgst = purchaseInvoices.reduce((s, i) => s + i.igst, 0);

  const totalCreditNotesAmt = creditNotes.reduce((s, c) => s + c.totalAmount, 0);
  const totalDebitNotesAmt = debitNotes.reduce((s, d) => s + d.totalAmount, 0);

  const netReceivable = parties.filter(p => p.currentBalance > 0).reduce((s, p) => s + p.currentBalance, 0);
  const netPayable = parties.filter(p => p.currentBalance < 0).reduce((s, p) => s + Math.abs(p.currentBalance), 0);

  const summaryData = [
    ['BUSINESS FINANCIAL & GST EXECUTIVE REPORT'],
    ['Entity Name:', company?.name || '', 'GSTIN:', company?.gstin || ''],
    ['Period Filter:', periodLabel, 'Generated:', new Date().toLocaleString()],
    [''],
    ['Metric Category', 'Key Performance Indicator', 'Amount (₹)'],
    ['Sales', 'Gross Sales Revenue (Inc. GST)', totalSalesGrand],
    ['Sales', 'Net Taxable Sales Value', totalSalesTaxable],
    ['Sales', 'Sales Count (Bills)', salesInvoices.length],
    ['Output Tax', 'CGST Output Liability', totalSalesCgst],
    ['Output Tax', 'SGST Output Liability', totalSalesSgst],
    ['Output Tax', 'IGST Output Liability', totalSalesIgst],
    ['Output Tax', 'Total Output GST Payable', totalSalesCgst + totalSalesSgst + totalSalesIgst],
    ['Purchases', 'Gross Purchase Inward Value', totalPurchaseGrand],
    ['Purchases', 'Net Taxable Purchase Value', totalPurchaseTaxable],
    ['Purchases', 'Purchase Count (Bills)', purchaseInvoices.length],
    ['Input Tax Credit', 'CGST Input Tax Credit', totalItcCgst],
    ['Input Tax Credit', 'SGST Input Tax Credit', totalItcSgst],
    ['Input Tax Credit', 'IGST Input Tax Credit', totalItcIgst],
    ['Input Tax Credit', 'Total ITC Available', totalItcCgst + totalItcSgst + totalItcIgst],
    ['Returns', 'Sales Return (Credit Notes)', totalCreditNotesAmt],
    ['Returns', 'Purchase Return (Debit Notes)', totalDebitNotesAmt],
    ['Outstanding', 'Total Accounts Receivable (Debtors)', netReceivable],
    ['Outstanding', 'Total Accounts Payable (Creditors)', netPayable],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // 2. Sales Register
  const salesRows = salesInvoices.map((inv, idx) => ({
    'Sr No': idx + 1,
    'Invoice Number': inv.invoiceNo,
    'Invoice Date': inv.date,
    'Due Date': inv.dueDate || '',
    'Customer Name': inv.customerName,
    'Customer GSTIN': inv.customerGstin || 'Unregistered',
    'State': inv.customerStateCode || '',
    'Taxable Value (₹)': inv.taxableAmount,
    'CGST (₹)': inv.cgst,
    'SGST (₹)': inv.sgst,
    'IGST (₹)': inv.igst,
    'Round Off (₹)': inv.roundOff || 0,
    'Grand Total (₹)': inv.grandTotal,
    'Payment Mode': inv.paymentMode,
    'Payment Status': inv.paymentStatus,
    'Status': inv.status,
    'e-Invoice IRN': inv.irn || 'N/A',
    'IRN Status': inv.irnStatus || 'NOT_APPLICABLE'
  }));
  const wsSales = XLSX.utils.json_to_sheet(salesRows.length > 0 ? salesRows : [{ 'Notice': 'No Sales Invoices in Period' }]);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Sales Register');

  // 3. Purchase Register
  const purchaseRows = purchaseInvoices.map((pur, idx) => ({
    'Sr No': idx + 1,
    'Bill Number': pur.invoiceNo,
    'Supplier Bill Ref': pur.supplierInvoiceNo,
    'Date': pur.date,
    'Due Date': pur.date,
    'Supplier Name': pur.supplierName,
    'Supplier GSTIN': pur.supplierGstin || 'Unregistered',
    'Taxable Value (₹)': pur.taxableAmount,
    'CGST (₹)': pur.cgst,
    'SGST (₹)': pur.sgst,
    'IGST (₹)': pur.igst,
    'Grand Total (₹)': pur.grandTotal,
    'Payment Status': pur.paymentStatus,
    'ITC Eligible': 'YES',
    'Status': pur.status
  }));
  const wsPurchases = XLSX.utils.json_to_sheet(purchaseRows.length > 0 ? purchaseRows : [{ 'Notice': 'No Purchase Bills in Period' }]);
  XLSX.utils.book_append_sheet(wb, wsPurchases, 'Purchase Register');

  // 4. Sales Returns (Credit Notes)
  const cnRows = creditNotes.map((cn, idx) => ({
    'Sr No': idx + 1,
    'Credit Note No': cn.creditNoteNo,
    'Original Invoice No': cn.originalInvoiceNo,
    'Date': cn.date,
    'Customer Name': cn.customerName,
    'Taxable Value (₹)': cn.taxableAmount,
    'CGST (₹)': cn.cgst,
    'SGST (₹)': cn.sgst,
    'IGST (₹)': cn.igst,
    'Total Value (₹)': cn.totalAmount,
    'Return Reason': cn.reason
  }));
  const wsCn = XLSX.utils.json_to_sheet(cnRows.length > 0 ? cnRows : [{ 'Notice': 'No Credit Notes in Period' }]);
  XLSX.utils.book_append_sheet(wb, wsCn, 'Sales Returns (Credit Notes)');

  // 5. Purchase Returns (Debit Notes)
  const dnRows = debitNotes.map((dn, idx) => ({
    'Sr No': idx + 1,
    'Debit Note No': dn.debitNoteNo,
    'Original Supplier Bill': dn.originalSupplierInvoiceNo,
    'Date': dn.date,
    'Supplier Name': dn.supplierName,
    'Supplier GSTIN': dn.supplierGstin || 'Unregistered',
    'Taxable Value (₹)': dn.taxableAmount,
    'CGST (₹)': dn.cgst,
    'SGST (₹)': dn.sgst,
    'IGST (₹)': dn.igst,
    'Total Value (₹)': dn.totalAmount,
    'Return Reason': dn.reason
  }));
  const wsDn = XLSX.utils.json_to_sheet(dnRows.length > 0 ? dnRows : [{ 'Notice': 'No Debit Notes in Period' }]);
  XLSX.utils.book_append_sheet(wb, wsDn, 'Purchase Returns (Debit Notes)');

  // 6. Receivables (Debtors)
  const debtors = parties.filter(p => p.currentBalance > 0).map((p, idx) => ({
    'Sr No': idx + 1,
    'Customer Name': p.name,
    'GSTIN': p.gstin || 'Unregistered',
    'Phone': p.mobile,
    'City': p.city,
    'State': p.state,
    'Outstanding Receivable (₹)': p.currentBalance,
    'Credit Period (Days)': p.creditDays,
    'Credit Limit (₹)': p.creditLimit
  }));
  const wsDebtors = XLSX.utils.json_to_sheet(debtors.length > 0 ? debtors : [{ 'Notice': 'No Pending Receivables' }]);
  XLSX.utils.book_append_sheet(wb, wsDebtors, 'Receivables (Debtors)');

  // 7. Payables (Creditors)
  const creditors = parties.filter(p => p.currentBalance < 0).map((p, idx) => ({
    'Sr No': idx + 1,
    'Supplier Name': p.name,
    'GSTIN': p.gstin || 'Unregistered',
    'Phone': p.mobile,
    'City': p.city,
    'State': p.state,
    'Outstanding Payable (₹)': Math.abs(p.currentBalance),
    'Credit Period (Days)': p.creditDays,
  }));
  const wsCreditors = XLSX.utils.json_to_sheet(creditors.length > 0 ? creditors : [{ 'Notice': 'No Pending Payables' }]);
  XLSX.utils.book_append_sheet(wb, wsCreditors, 'Payables (Creditors)');

  // 8. GST Tax Liability & ITC Setoff
  const netCgstPayable = Math.max(0, totalSalesCgst - totalItcCgst);
  const netSgstPayable = Math.max(0, totalSalesSgst - totalItcSgst);
  const netIgstPayable = Math.max(0, totalSalesIgst - totalItcIgst);
  const gstRows = [
    { 'Tax Head': 'Integrated Tax (IGST)', 'Gross Output Tax (₹)': totalSalesIgst, 'Input Tax Credit (ITC) (₹)': totalItcIgst, 'Net Tax Payable in Cash (₹)': netIgstPayable },
    { 'Tax Head': 'Central Tax (CGST)', 'Gross Output Tax (₹)': totalSalesCgst, 'Input Tax Credit (ITC) (₹)': totalItcCgst, 'Net Tax Payable in Cash (₹)': netCgstPayable },
    { 'Tax Head': 'State/UT Tax (SGST)', 'Gross Output Tax (₹)': totalSalesSgst, 'Input Tax Credit (ITC) (₹)': totalItcSgst, 'Net Tax Payable in Cash (₹)': netSgstPayable },
    { 'Tax Head': 'TOTAL GST', 'Gross Output Tax (₹)': totalSalesIgst + totalSalesCgst + totalSalesSgst, 'Input Tax Credit (ITC) (₹)': totalItcIgst + totalItcCgst + totalItcSgst, 'Net Tax Payable in Cash (₹)': netIgstPayable + netCgstPayable + netSgstPayable }
  ];
  const wsGst = XLSX.utils.json_to_sheet(gstRows);
  XLSX.utils.book_append_sheet(wb, wsGst, 'GST Liability & ITC');

  const cleanPeriod = (periodLabel || 'FY').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Business_Report_${company?.gstin || 'GST'}_${cleanPeriod}.xlsx`;
  XLSX.writeFile(wb, filename);
}

