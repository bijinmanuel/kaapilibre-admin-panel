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
    ? 'rgba(21,128,61,0.1)'
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

  const date = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const itemRows = order.items.map(item => `
    <tr class="inv-tbl-row font-color">
      <td style="padding:16px 20px;border-bottom:1px solid #f3f4f6;vertical-align:middle;">
        <div class="font-color" style="font-weight:600;font-size:14px;">${item.name}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;font-weight:400;">${item.weight || ''} ${item.grind ? `&middot; ${item.grind}` : ''}</div>
      </td>
      <td class="font-color" style="padding:16px 20px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:14px;">₹${item.unitPrice.toLocaleString('en-IN')}</td>
      <td class="font-color" style="padding:16px 20px;border-bottom:1px solid #f3f4f6;text-align:start;font-size:14px;">${item.qty}</td>
      <td class="font-color" style="padding:10px 10px;border-bottom:1px solid #f3f4f6;text-align:start;font-weight:700;font-size:14px;">₹${item.subtotal.toLocaleString('en-IN')}</td>
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
    @supports (font-family: "American Typewriter") {
      /* Use system American Typewriter if available */
    }

    .typewriter {
      font-family: "American Typewriter", "Courier New", "Courier", monospace;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', sans-serif; background: #f8fafc; color: #1e293b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .inv-container { width: 210mm; min-height: 296.7mm; margin: 40px auto; background: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.05); position: relative; display: flex; flex-direction: column; overflow: hidden; }
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
    .inv-payment-box { background: #00000000; padding: 10px; border-radius: 16px; }
    .inv-total-row.grand { margin-top: 12px; padding-top: 20px; border-top: 2px solid #f1f5f9; font-size: 20px; font-weight: 700; color: #0f172a; display: flex; justify-content: space-between; }
    .inv-bottom-bar { padding: 40px 60px; background: #fff; color: #1e293b; }
    .inv-bottom-content { display: flex; justify-content: space-between; align-items: center; }
    .print-btn-container { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); z-index: 100; }
    .font-color { color: #375769; font-weight: bold; }
    .print-btn { background: #0f172a; color: #fff; border: none; padding: 16px 32px; border-radius: 100px; font-weight: 600; cursor: pointer; box-shadow: 0 10px 25px rgba(0,0,0,0.1); font-family: 'Outfit', sans-serif; }
    .inv-status-pill { display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
    .inv-payment-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
    .inv-payment-value { font-size: 14px; color: #0f172a; font-weight: 500; }
    @media print {
      @page { size: A4; margin: 0; }
      html, body { margin: 0; padding: 0; height: 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { background: #fff; }
      .inv-container { margin: 0 !important; box-shadow: none; width: 210mm; min-height: 100%; }
      .print-btn-container { display: none; }
      .inv-bottom-bar { break-inside: avoid; }
    }
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
      <div class="inv-grid">
        <div style="display:flex; gap:20px; align-items:flex-start;">
          <div class="inv-section-title font-color typewriter" style="line-height:1; margin:0; padding:0; white-space:nowrap;">BILL TO :</div>
          <div class="inv-address-text font-color typewriter" style="line-height:1.6; margin:0; padding:0;">
            <div class="inv-address-name inv-section-title font-color" style="margin:0 0 4px 0; padding:0;">${order.customer.name}</div>
            ${order.customer.phone}<br/>
            ${order.shippingAddress}
          </div>
        </div>
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span class="inv-section-title font-color typewriter" style="margin:0; font-weight:700;">INVOICE NO:</span>
            <span class="inv-section-title font-color typewriter" style="font-weight:700; margin:0;">${invoiceNumber}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span class="inv-section-title font-color typewriter" style="margin:0; font-weight:700;">DATE :</span>
            <span class="inv-section-title font-color typewriter" style="margin:0; font-weight:700;">${date}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span class="inv-section-title font-color typewriter" style="margin:0; font-weight:700;">ORDER NO:</span>
            <span class="inv-section-title font-color typewriter" style="margin:0; font-weight:700;">${order.orderNumber}</span>
          </div>
          <div style="display:flex; justify-content:flex-end; margin-top:4px;">
            <span class="inv-status-pill" style="background:${payStatusBg}; border:1px solid ${payStatusBorder}; color:${payStatusColor};">${payStatusLabel}</span>
          </div>
        </div>
      </div>
      <table class="inv-table typewriter">
        <thead style="background-color:#f0f0f0;">
          <tr>
            <th class="font-color typewriter" style="width:50%;">Description</th>
            <th class="font-color typewriter center" style="width:20%;">UNIT PRICE</th>
            <th class="font-color typewriter right" style="width:16%;">QTY</th>
            <th class="font-color typewriter right" style="width:17%;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      ${order.notes ? `
      <div style="margin-bottom:40px; padding:20px; background:#fffbeb; border-left:4px solid #fbbf24; border-radius:8px;">
        <div class="inv-payment-label typewriter" style="color:#b45309; margin-bottom:8px;">Customer Note</div>
        <div class="typewriter" style="font-size:13px; color:#92400e; line-height:1.5;">${order.notes}</div>
      </div>` : ''}
    </div>

    <div class="inv-hdr typewriter">
      <div style="background-color:#f0f0f0; display:flex; justify-content:flex-end; align-items:center; height:50px; padding:0 16px; gap:20px; width:100%; box-sizing:border-box;">
        <span class="font-color" style="font-size:12px; font-weight:700;">TOTAL</span>
        <span class="font-color" style="font-weight:600;">₹${order.totalAmount.toLocaleString('en-IN')}</span>
      </div>
    </div>

    <!-- Payment Info -->
      <div style="padding:0px 50px; margin-bottom:20px;">
        <div class="inv-payment-box typewriter">
          <div class="inv-section-title font-color" style="margin-bottom:10px;">Payment Information</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div>
              <div class="inv-payment-label font-color">Method</div>
              <div class="inv-payment-value font-color" style="text-transform:capitalize;">${order.payment?.method || 'N/A'}</div>
            </div>
            <div>
              <div class="inv-payment-label font-color">Status</div>
              <div class="inv-payment-value" style="color:${payStatusColor}; text-transform:capitalize;">${order.payment?.status || 'Pending'}</div>
            </div>
            ${order.payment?.transactionId ? `
            <div style="grid-column:span 2;">
              <div class="inv-payment-label font-color">Transaction ID</div>
              <div class="inv-payment-value font-color" style="font-family:monospace; font-size:12px;">${order.payment.transactionId}</div>
            </div>` : ''}
            ${paidAt ? `
            <div style="grid-column:span 2;">
              <div class="inv-payment-label font-color">Payment Date</div>
              <div class="inv-payment-value font-color">${paidAt}</div>
            </div>` : ''}
          </div>
        </div>
      </div>

    <div style="text-align:center;">
      <img src="${AEKBLUE}" style="height:100px; width:500px;" alt="KaapiLibreEarth"/>
    </div>

    <footer class="inv-bottom-bar typewriter">
      <div class="inv-bottom-content">
        <div>
          <div class="inv-brand-name font-color">KaapiLibre LLP</div>
          <div class="font-color" style="font-size:11px;">GSTIN: 32AABCK1234F1Z5</div>
        </div>
        <div class="font-color" style="text-align:right; font-size:12px;">contact@kaapilibre.com<br/>www.kaapilibre.com</div>
      </div>
    </footer>
  </div>
</div>
<div class="print-btn-container">
  <button class="print-btn" onclick="window.print()">Print Invoice</button>
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
    body { font-family: 'Outfit', sans-serif; background: #f8fafc; color: #1e293b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .inv-container { width: 210mm; min-height: 296.7mm; margin: 40px auto; background: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.05); position: relative; display: flex; flex-direction: column; overflow: hidden; }
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
    .inv-bottom-bar { padding: 40px 60px; background: #fff; color: #1e293b; }
    .inv-bottom-content { display: flex; justify-content: space-between; align-items: center; }
    .print-btn-container { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); z-index: 100; }
    .font-color {color:#375769; font-weight:bold}
    .print-btn { background: #0f172a; color: #fff; border: none; padding: 16px 32px; border-radius: 100px; font-weight: 600; cursor: pointer; box-shadow: 0 10px 25px rgba(0,0,0,0.1); font-family: 'Outfit', sans-serif; }
    @media print { 
      @page { size: A4; margin: 0; }
      html, body { margin: 0; padding: 0; height: 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { background: #fff; } 
      .inv-container { margin: 0 !important; box-shadow: none; width: 210mm; min-height: 100%; } 
      .print-btn-container { display: none; } 
      .inv-bottom-bar { break-inside: avoid; }
    }
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

export const generateConsolidatedCafeInvoiceHTML = (
  cafe: Cafe,
  orders: CafeOrder[],
  billingPeriod: string,
  customInvoiceNumber?: string
): string => {
  const invoiceNumber = customInvoiceNumber || `INV-CON-${cafe.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase()}-${format(new Date(), 'yyMMdd')}`

  const date = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  // Sum up identical products across all orders
  const itemMap = new Map<string, { price: number; qty: number }>()
  orders.forEach(order => {
    order.items.forEach(item => {
      const existing = itemMap.get(item.name)
      if (existing) {
        existing.qty += item.qty
      } else {
        itemMap.set(item.name, { price: item.price, qty: item.qty })
      }
    })
  })

  const consolidatedItems = Array.from(itemMap.entries()).map(([name, detail]) => ({
    name,
    price: detail.price,
    qty: detail.qty,
    subtotal: detail.price * detail.qty
  }))

  const grandTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0)

  const orderRows = orders.map(o => `
    <tr class="inv-tbl-row font-color">
      <td style="padding:12px 20px;border-bottom:1px solid #f3f4f6;font-size:13px;vertical-align:middle;">${format(new Date(o.createdAt), 'dd MMM yyyy')}</td>
      <td style="padding:12px 20px;border-bottom:1px solid #f3f4f6;font-size:13px;font-family:monospace;vertical-align:middle;">${o.orderNumber}</td>
      <td class="font-color" style="padding:12px 20px;border-bottom:1px solid #f3f4f6;text-align:right;font-size:13px;vertical-align:middle;">₹${o.totalAmount.toLocaleString('en-IN')}</td>
    </tr>`).join('')

  const itemRows = consolidatedItems.map(item => `
    <tr class="inv-tbl-row font-color">
      <td style="padding:12px 20px;border-bottom:1px solid #f3f4f6;vertical-align:middle;">
        <div class="font-color" style="font-weight:600;font-size:13px;">${item.name}</div>
      </td>
      <td class="font-color" style="padding:12px 20px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:13px;">₹${item.price.toLocaleString('en-IN')}</td>
      <td class="font-color" style="padding:12px 20px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:13px;">${item.qty}</td>
      <td class="font-color" style="padding:12px 20px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;font-size:13px;">₹${item.subtotal.toLocaleString('en-IN')}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Consolidated Invoice ${invoiceNumber}</title>
  <style>
    .typewriter {
      font-family: "American Typewriter", "Courier New", "Courier", monospace;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', sans-serif; background: #f8fafc; color: #1e293b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .inv-container { width: 210mm; min-height: 296.7mm; margin: 40px auto; background: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.05); position: relative; display: flex; flex-direction: column; overflow: hidden; }
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
    .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .inv-table th { padding: 12px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #f1f5f9; }
    .inv-table th.right { text-align: right; }
    .inv-table th.center { text-align: center; }
    .inv-footer-grid { display: grid; grid-template-columns: 1fr 300px; gap: 60px; align-items: start; }
    .inv-payment-box { background: #f8fafc; padding: 24px; border-radius: 16px; }
    .inv-total-row.grand { margin-top: 12px; padding-top: 20px; border-top: 2px solid #f1f5f9; font-size: 20px; font-weight: 700; color: #0f172a; display: flex; justify-content: space-between; }
    .inv-bottom-bar { padding: 40px 60px; background: #fff; color: #1e293b; }
    .inv-bottom-content { display: flex; justify-content: space-between; align-items: center; }
    .print-btn-container { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); z-index: 100; }
    .font-color {color:#375769; font-weight:bold}
    .print-btn { background: #0f172a; color: #fff; border: none; padding: 16px 32px; border-radius: 100px; font-weight: 600; cursor: pointer; box-shadow: 0 10px 25px rgba(0,0,0,0.1); font-family: 'Outfit', sans-serif; }
    @media print { 
      @page { size: A4; margin: 0; }
      html, body { margin: 0; padding: 0; height: 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { background: #fff; } 
      .inv-container { margin: 0 !important; box-shadow: none; width: 210mm; min-height: 100%; } 
      .print-btn-container { display: none; } 
      .inv-bottom-bar { break-inside: avoid; }
    }
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
          <div class="inv-brand-tagline font-color typewriter" style="font-size:11px; letter-spacing:1px;">CONSOLIDATED INVOICE</div>
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
        <div class="inv-section-title font-color typewriter" style="line-height:1; margin:0; padding:0; white-space:nowrap;">ISSUED TO :</div>
        <div class="inv-address-text font-color typewriter" style="line-height:1.4; margin:0; padding:0;">
          <div class="inv-address-name inv-section-title font-color" style="margin:0 0 4px 0; padding:0;">${cafe?.name || 'Walk-in'}</div>
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
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span class="inv-section-title font-color typewriter" style="margin:0; font-weight:700">PERIOD :</span>
            <span class="inv-section-title font-color typewriter" style="margin:0;font-weight:700;">${billingPeriod}</span>
          </div>
        </div>
      </div>

      <div class="inv-section-title font-color typewriter" style="margin-bottom:8px;">CONSOLIDATED ORDERS</div>
      <table class="inv-table typewriter">
        <thead style="background-color:#f0f0f0">
          <tr>
            <th class="font-color typewriter" style="width:35%">Order Date</th>
            <th class="font-color typewriter" style="width:40%">Order Number</th>
            <th class="font-color typewriter right" style="width:25%">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${orderRows}
        </tbody>
      </table>

      <div class="inv-section-title font-color typewriter" style="margin-bottom:8px; margin-top:20px;">DETAILED ITEM BREAKDOWN</div>
      <table class="inv-table typewriter">
        <thead style="background-color:#f0f0f0">
          <tr>
            <th class="font-color typewriter" style="width:50%">Description</th>
            <th class="font-color typewriter center" style="width:20%">UNIT PRICE</th>
            <th class="font-color typewriter center" style="width:16%">TOTAL QTY</th>
            <th class="font-color typewriter right" style="width:17%">TOTAL AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>
    <div class="inv-hdr typewriter" style="padding-top: 0;">
      <div style="background-color:#f0f0f0; display:flex; justify-content:flex-end; align-items:center; height:50px; padding:0 16px; gap:20px; width:100%; box-sizing:border-box;">
        <span class="font-color" style="font-size:12px; font-weight: 700">TOTAL DUE</span>
        <span class="roght font-color " style="font-weight:600;">₹${grandTotal.toLocaleString('en-IN')}</span>
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