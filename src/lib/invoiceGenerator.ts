import { LOGO, LOGO_KAAPILIBRE, KAPPI, AEKBLUE, CHEMEX } from './brandAssets'
import type { Order, CafeOrder, Cafe } from '@/types'
import { format } from 'date-fns'

// Generate invoice number from order number
export const getInvoiceNumber = (orderNumber: string) =>
  `INV-${orderNumber.replace('KL-', '')}`

// Full invoice HTML — self-contained, works in new window and as email
export const generateInvoiceHTML = (order: Order): string => {
  const invoiceNumber = getInvoiceNumber(order.orderNumber)
  const invoiceDate = format(new Date(order.createdAt), 'dd MMM yyyy')

  const isPaid =
    order.payment?.status === 'paid' || (order.payment?.status as string) === 'success'

  const payStatusColor = isPaid
    ? '#4ade80'
    : order.payment?.status === 'failed'
      ? '#f87171'
      : '#fbbf24'

  const payStatusBg = isPaid
    ? 'rgba(21,128,61,0.1) '
    : order.payment?.status === 'failed'
      ? 'rgba(220,38,38,0.1)'
      : 'rgba(146,64,14,0.1)'

  const payStatusBorder = isPaid
    ? 'rgba(21,128,61,0.2)'
    : order.payment?.status === 'failed'
      ? 'rgba(220,38,38,0.2)'
      : 'rgba(146,64,14,0.2)'

  const payStatusLabel = isPaid
    ? 'Paid'
    : order.payment?.status === 'failed'
      ? 'Failed'
      : 'Pending'

  const itemRows = order.items.map(item => `
    <tr class="inv-tbl-row">
      <td style="padding:16px 20px;border-bottom:1px solid #f3f4f6;vertical-align:middle;">
        <div style="font-weight:600;color:#111827;font-size:14px;">${item.name}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;font-weight:400;">${item.weight || ''} ${item.grind ? `&middot; ${item.grind}` : ''}</div>
      </td>
      <td style="padding:16px 20px;border-bottom:1px solid #f3f4f6;text-align:center;color:#374151;font-size:14px;">${item.qty}</td>
      <td style="padding:16px 20px;border-bottom:1px solid #f3f4f6;text-align:right;color:#374151;font-size:14px;">₹${item.unitPrice.toLocaleString('en-IN')}</td>
      <td style="padding:16px 20px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;color:#111827;font-size:14px;">₹${item.subtotal.toLocaleString('en-IN')}</td>
    </tr>`).join('')

  const paidAt = order.payment?.paidAt
    ? format(new Date(order.payment.paidAt), 'dd MMM yyyy, hh:mm a')
    : null

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Invoice ${invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Outfit', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      -webkit-print-color-adjust: exact;
    }

    /* ── Page shell ── */
    .inv-container {
      width: 210mm;
      min-height: 297mm;
      margin: 40px auto;
      background: #fff;
      box-shadow: 0 20px 50px rgba(0,0,0,0.05);
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ── Background Decors ── */
    .inv-bg-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: url('${LOGO}');
      background-size: cover;
      background-position: center;
      opacity: 0.03;
      pointer-events: none;
      z-index: 0;
    }

    .inv-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    /* ── Header ── */
    .inv-hdr {
      padding: 60px 60px 40px 60px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .inv-logo-wrap {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .inv-logo-img {
      height: 70px;
      width: auto;
      object-fit: contain;
    }

    .inv-brand-info {
      margin-top: 8px;
    }

    .inv-brand-name {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    .inv-brand-tagline {
      font-size: 12px;
      color: #64748b;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 4px;
    }

    .inv-hdr-right {
      text-align: right;
    }

    .inv-title {
      font-family: 'Playfair Display', serif;
      font-size: 48px;
      color: #0f172a;
      line-height: 1;
      margin-bottom: 12px;
    }

    .inv-meta-main {
      font-size: 14px;
      color: #64748b;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .inv-status-pill {
      display: inline-block;
      margin-top: 16px;
      padding: 6px 16px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* ── Body ── */
    .inv-body {
      padding: 0 60px 60px 60px;
      flex-grow: 1;
    }

    .inv-divider {
      height: 1px;
      background: #f1f5f9;
      margin: 40px 0;
    }

    .inv-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 60px;
      margin-bottom: 40px;
    }

    .inv-section-title {
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 16px;
    }

    .inv-address-text {
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
    }

    .inv-address-name {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .inv-details-list {
      display: grid;
      gap: 12px;
    }

    .inv-detail-item {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
    }

    .inv-detail-label {
      color: #64748b;
    }

    .inv-detail-value {
      color: #0f172a;
      font-weight: 500;
    }

    /* ── Table ── */
    .inv-table-container {
      margin-bottom: 40px;
    }

    .inv-table {
      width: 100%;
      border-collapse: collapse;
    }

    .inv-table th {
      padding: 16px 20px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid #f1f5f9;
    }

    .inv-table th.right { text-align: right; }
    .inv-table th.center { text-align: center; }

    /* ── Totals & Payment ── */
    .inv-footer-grid {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 60px;
      align-items: start;
    }

    .inv-payment-box {
      background: #f8fafc;
      padding: 24px;
      border-radius: 16px;
    }

    .inv-payment-item {
      margin-bottom: 16px;
    }

    .inv-payment-item:last-child { margin-bottom: 0; }

    .inv-payment-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .inv-payment-value {
      font-size: 14px;
      color: #0f172a;
      font-weight: 500;
    }

    .inv-totals {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .inv-total-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: #64748b;
    }

    .inv-total-row.grand {
      margin-top: 12px;
      padding-top: 20px;
      border-top: 2px solid #f1f5f9;
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
    }

    /* ── Note ── */
    .inv-note-section {
      margin-top: 40px;
      padding: 20px;
      background: #fffbeb;
      border-left: 4px solid #fbbf24;
      border-radius: 8px;
    }

    .inv-note-text {
      font-size: 13px;
      color: #92400e;
      line-height: 1.5;
    }

    /* ── Bottom Footer ── */
    .inv-bottom-bar {
      padding: 60px;
      background: #0f172a;
      color: #fff;
    }

    .inv-bottom-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .inv-bottom-brand {
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      color: #fff;
    }

    .inv-bottom-info {
      text-align: right;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }

    /* ── Floating Print Button ── */
    .print-btn-container {
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
    }

    .print-btn {
      background: #0f172a;
      color: #fff;
      border: none;
      padding: 16px 32px;
      border-radius: 100px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: 'Outfit', sans-serif;
      transition: all 0.2s;
    }

    .print-btn:hover {
      background: #1e293b;
      transform: translateY(-2px);
    }

    @media print {
      body { background: #fff; }
      .inv-container { margin: 0; box-shadow: none; width: 100%; }
      .print-btn-container { display: none; }
      @page { size: A4; margin: 0; }
    }
  </style>
</head>
<body>

<div class="inv-container">
  <div class="inv-bg-overlay"></div>
  
  <div class="inv-content">
    <!-- Header -->
    <header class="inv-hdr">
      <div class="inv-logo-wrap">
        <img src="${LOGO_KAAPILIBRE}" class="inv-logo-img" alt="KaapiLibre"/>
        <div class="inv-brand-info">
          <div class="inv-brand-tagline">INVOICE</div>
        </div>
      </div>
      
      <div class="inv-hdr-right">
        <h1 class="inv-title">Invoice</h1>
        <div class="inv-meta-main">
          <span>${invoiceNumber}</span>
          <span>Date: ${invoiceDate}</span>
        </div>
        <div class="inv-status-pill" style="background:${payStatusBg}; border:1px solid ${payStatusBorder}; color:${payStatusColor};">
          ${payStatusLabel}
        </div>
      </div>
    </header>

    <div class="inv-body">
      <div class="inv-divider"></div>

      <!-- Grid: Addresses & Details -->
      <div class="inv-grid">
        <div>
          <div class="inv-section-title">Bill To</div>
          <div class="inv-address-text">
            <div class="inv-address-name">${order.customer.name}</div>
            ${order.customer.email}<br/>
            ${order.customer.phone}<br/>
            ${order.shippingAddress}
          </div>
        </div>
        <div>
          <div class="inv-section-title">Invoice Details</div>
          <div class="inv-details-list">
            <div class="inv-detail-item">
              <span class="inv-detail-label">Order No.</span>
              <span class="inv-detail-value">${order.orderNumber}</span>
            </div>
            <div class="inv-detail-item">
              <span class="inv-detail-label">Due Date</span>
              <span class="inv-detail-value">Due on Receipt</span>
            </div>
            <div class="inv-detail-item">
              <span class="inv-detail-label">Reference</span>
              <span class="inv-detail-value">#${order._id.slice(-6).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="inv-table-container">
        <table class="inv-table">
          <thead>
            <tr>
              <th style="width:50%">Product Description</th>
              <th class="center" style="width:10%">Qty</th>
              <th class="right" style="width:20%">Unit Price</th>
              <th class="right" style="width:20%">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
      </div>

      <!-- Footer Grid: Payment & Totals -->
      <div class="inv-footer-grid">
        <div class="inv-payment-box">
          <div class="inv-section-title" style="margin-bottom:20px;">Payment Information</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="inv-payment-item">
              <div class="inv-payment-label">Method</div>
              <div class="inv-payment-value" style="text-transform: capitalize;">${order.payment?.method || 'N/A'}</div>
            </div>
            <div class="inv-payment-item">
              <div class="inv-payment-label">Status</div>
              <div class="inv-payment-value" style="color: ${payStatusColor}; text-transform: capitalize;">${order.payment?.status || 'Pending'}</div>
            </div>
          </div>
          ${order.payment?.transactionId ? `
          <div class="inv-payment-item" style="margin-top:16px;">
            <div class="inv-payment-label">Transaction ID</div>
            <div class="inv-payment-value" style="font-family: monospace; font-size: 12px; color: #64748b;">${order.payment.transactionId}</div>
          </div>` : ''}
          ${paidAt ? `
          <div class="inv-payment-item" style="margin-top:16px;">
            <div class="inv-payment-label">Payment Date</div>
            <div class="inv-payment-value">${paidAt}</div>
          </div>` : ''}
        </div>

        <div class="inv-totals">
          <div class="inv-total-row">
            <span>Subtotal</span>
            <span>₹${order.totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div class="inv-total-row">
            <span>Shipping</span>
            <span style="color: #10b981; font-weight: 600;">Free</span>
          </div>
          <div class="inv-total-row grand">
            <span>Total Amount</span>
            <span>₹${order.totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${order.notes ? `
      <div class="inv-note-section">
        <div class="inv-payment-label" style="color: #b45309; margin-bottom: 8px;">Customer Note</div>
        <div class="inv-note-text">${order.notes}</div>
      </div>` : ''}
    </div>

    <!-- Bottom Bar -->
    <footer class="inv-bottom-bar">
      <div class="inv-bottom-content">
        <div>
          <div class="inv-bottom-brand">Kaapi Libre LLP</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">GSTIN: 32AABCK1234F1Z5</div>
        </div>
        <div class="inv-bottom-info">
          contact@kaapilibre.in<br/>
          www.kaapilibre.com<br/>
          Bengaluru, India
        </div>
      </div>
    </footer>
  </div>
</div>

<div class="print-bar print-btn-container">
  <button class="print-btn" onclick="window.print()">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
    Print Invoice / Save PDF
  </button>
</div>

</body>
</html>`
}

export const generateCafeInvoiceHTML = (order: CafeOrder): string => {
  const invoiceNumber = getInvoiceNumber(order.orderNumber)
  const invoiceDate = format(new Date(order.createdAt), 'dd MMM yyyy')
  const cafe = order.cafeId as Cafe

  const date = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const itemRows = order.items.map(item => `
    <tr class="inv-tbl-row font-color">
      <td style="padding:16px 20px;border-bottom:1px solid #f3f4f6;vertical-align:middle;">
        <div class="font-color" style="font-weight:600;font-size:14px;">${item.name}</div>
      </td>
      <td class="font-color" style="padding:16px 20px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:14px;">₹${item.price.toLocaleString('en-IN')}</td>
      <td class="font-color" style="padding:16px 20px;border-bottom:1px solid #f3f4f6;text-align:start;font-size:14px;">${item.qty}</td>
      <td class="font-color" style="padding:10px 10px;border-bottom:1px solid #f3f4f6;text-align:start;font-weight:700;font-size:14px;">₹${item.subtotal.toLocaleString('en-IN')}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Invoice ${invoiceNumber}</title>
  <style>
    /* American Typewriter Font */
    @supports (font-family: "American Typewriter") {
      /* Use system American Typewriter if available */
    }

    /* Fallback: Use monospace fonts that resemble typewriter */
    .typewriter {
      font-family: "American Typewriter", "Courier New", "Courier", monospace;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', sans-serif; background: #f8fafc; color: #1e293b; -webkit-print-color-adjust: exact; }
    .inv-container { width: 210mm; min-height: 297mm; margin: 40px auto; background: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.05); position: relative; display: flex; flex-direction: column; overflow: hidden; }
    .inv-bg-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('${LOGO}'); background-size: cover; background-position: center; opacity: 0.03; pointer-events: none; z-index: 0; }
    .inv-content { position: relative; z-index: 1; display: flex; flex-direction: column; flex-grow: 1; }
    .inv-hdr { padding: 60px 60px 40px 60px; display: flex; justify-content: space-between; align-items: flex-start; }
    .inv-logo-img { height: 70px; width: auto; object-fit: contain; }
    .inv-brand-name { font-family: 'Playfair Display', serif; font-size: 15px; color: #0f172a; letter-spacing: -0.5px; }
    .inv-brand-tagline { font-size: 12px; color: #64748b; letter-spacing: 1px; text-transform: uppercase; margin-top: 4px; }
    .inv-title { font-family: 'Playfair Display', serif; font-size: 48px; color: #0f172a; line-height: 1; margin-bottom: 12px; }
    .inv-body { padding: 0 60px 60px 60px; flex-grow: 1; }
    .inv-divider { height: 1px; background: #f1f5f9; margin: 20px 0; }
    .inv-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 60px; margin-bottom: 40px; }
    .inv-section-title { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; }
    .inv-address-name { font-size: 16px; font-weight: 500; color: #0f172a; margin-bottom: 2px; }
    .inv-address-text { font-size: 14px; line-height: 1.6; color: #334155; }
    .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
    .inv-table th { padding: 16px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #f1f5f9; }
    .inv-table th.right { text-align: right; }
    .inv-table th.center { text-align: center; }
    .inv-footer-grid { display: grid; grid-template-columns: 1fr 300px; gap: 60px; align-items: start; }
    .inv-payment-box { background: #f8fafc; padding: 24px; border-radius: 16px; }
    .inv-total-row.grand { margin-top: 12px; padding-top: 20px; border-top: 2px solid #f1f5f9; font-size: 20px; font-weight: 700; color: #0f172a; display: flex; justify-content: space-between; }
    .inv-bottom-bar { padding: 60px; background: #ffffffff; color: #fff; }
    .inv-bottom-content { display: flex; justify-content: space-between; align-items: center; }
    .print-btn-container { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); z-index: 100; }
    .font-color {color:#375769; font-weight:bold}
    .print-btn { background: #0f172a; color: #fff; border: none; padding: 16px 32px; border-radius: 100px; font-weight: 600; cursor: pointer; box-shadow: 0 10px 25px rgba(0,0,0,0.1); font-family: 'Outfit', sans-serif; }
    @media print { body { background: #fff; } .inv-container { margin: 0; box-shadow: none; width: 100%; } .print-btn-container { display: none; } @page { size: A4; margin: 0; } }
  </style>
</head>
<body>
<div class="inv-container">
  <div class="inv-bg-overlay"></div>
  <div class="inv-content">
    <header class="inv-hdr">
      <div>
        <img src="${KAPPI}" style="height:150px; width:auto;" alt="KaapiLibre"/>
        <div style="margin-top:2px;">
          <div class="inv-brand-tagline font-color typewriter" style="font-size:11px; letter-spacing:1px;">INVOICE</div>
        </div>
      </div>
      <div style="text-align:right;">
        <img src="${CHEMEX}" style="height:170px; width:auto;" alt="KaapiLibre"/>
      </div>
    </header>
    <div class="inv-body">
      <div class="inv-divider"></div>
      <div class="inv-grid" >
        <div style="display:flex; gap:20px; align-items:flex-start;">
        <div class="inv-section-title font-color typewriter" style="line-height:1; margin:0; padding:0;">ISSUED TO :</div>
        <div class="inv-address-text font-color typewriter" style="line-height:1; margin:0; padding:0;">
          <div class="inv-address-name inv-section-title font-color" style="margin:0; padding:0;">${cafe?.name || 'Walk-in'}</div>
          ${cafe?.contactNumber || ''}<br/>
          ${cafe?.location || ''}
          ${cafe?.email || ''}<br/>
        </div>
      </div>
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span class="inv-section-title font-color typewriter" style="margin:0; font-weight:700">INVOICE NO:</span>
            <span class="inv-section-title font-color typewriter" style="font-weight:700;margin:0;">${invoiceNumber}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span class="inv-section-title font-color typewriter" style="margin:0; font-weight:700">DATE :</span>
            <span class="inv-section-title font-color typewriter" style="margin:0;font-weight:700;">${date}</span>
          </div>
        </div>
      </div>
      <table class="inv-table typewriter">
        <thead style="background-color:#f0f0f0">
          <tr>
            <th class="font-color typewriter" style="width:50%">Description</th>
            <th class="font-color typewriter" class="center" style="width:20%">UNIT PRICE</th>
            <th class="font-color typewriter" class="right" style="width:16%">QTY</th>
            <th class="font-color typewriter" class="right" style="width:17%">TOTAL</th>
          </tr>
        </thead>
        <tbody style="flex:1">
          ${itemRows}
        </tbody>
      </table>
    </div>
    <div class="inv-hdr typewriter">
      <div style="background-color:#f0f0f0; display:flex; justify-content:flex-end; align-items:center; height:50px; padding:0 16px; gap:20px; width:100%; box-sizing:border-box;">
        <span class="font-color" style="font-size:12px; font-weight: 700">TOTAL</span>
        <span class="roght font-color " style="font-weight:600;">₹${order.totalAmount.toLocaleString('en-IN')}</span>
      </div>
    </div>
    <div style="text-align:center;">
        <img src="${AEKBLUE}" style="height:100px; width:500px;" alt="KaapiLibreEarth"/>
    </div>
    <footer class="inv-bottom-bar typewriter">
      <div class="inv-bottom-content">
        <div><div class="inv-brand-name font-color">KaapiLibre LLP</div><div class="font-color" style="font-size:11px;">GSTIN: 32AABCK1234F1Z5</div></div>
        <div class="font-color" style="text-align:right; font-size:12px;">contact@kaapilibre.com<br/>www.kaapilibre.com</div>
      </div>
    </footer>
  </div>
</div>
<div class="print-btn-container"><button class="print-btn" onclick="window.print()">Print Invoice</button></div>
</body>
</html>`
}