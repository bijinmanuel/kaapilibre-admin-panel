import { LOGO, LOGO_KAAPILIBRE } from './brandAssets'
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
    ? 'rgba(21,128,61,0.18)'
    : order.payment?.status === 'failed'
      ? 'rgba(220,38,38,0.18)'
      : 'rgba(146,64,14,0.18)'

  const payStatusBorder = isPaid
    ? 'rgba(21,128,61,0.35)'
    : order.payment?.status === 'failed'
      ? 'rgba(220,38,38,0.35)'
      : 'rgba(146,64,14,0.35)'

  const payStatusLabel = isPaid
    ? 'Paid'
    : order.payment?.status === 'failed'
      ? 'Failed'
      : 'Pending'

  const itemRows = order.items.map(item => `
    <tr class="inv-tbl-row">
      <td style="padding:14px 18px;border-bottom:1px solid #f0ebe0;vertical-align:middle;">
        <div style="font-weight:600;color:#1a1208;font-size:14px;">${item.name}</div>
        <div style="font-size:11px;color:#9c8b72;margin-top:3px;font-weight:400;">${item.weight} &middot; ${item.grind}</div>
      </td>
      <td style="padding:14px 18px;border-bottom:1px solid #f0ebe0;text-align:center;color:#4a3c28;font-size:13px;">${item.qty}</td>
      <td style="padding:14px 18px;border-bottom:1px solid #f0ebe0;text-align:right;color:#4a3c28;font-size:13px;">&#8377;${item.unitPrice.toLocaleString('en-IN')}</td>
      <td style="padding:14px 18px;border-bottom:1px solid #f0ebe0;text-align:right;font-weight:700;color:#1a1208;font-size:14px;">&#8377;${item.subtotal.toLocaleString('en-IN')}</td>
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
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

    *{box-sizing:border-box;margin:0;padding:0;}

    body{
      font-family:'Inter',Arial,sans-serif;
      background:#f0ebe0;
      color:#1a1208;
      min-height:100vh;
      padding:32px 16px;
    }

    /* ── Page shell ── */
    .inv-page{
      max-width:780px;
      margin:0 auto;
      background:#fff;
      border-radius:18px;
      overflow:hidden;
      box-shadow:0 12px 64px rgba(26,23,19,0.22);
      position:relative;
    }

    /* ── Watermark ── */
    .inv-wm{
      position:absolute;
      top:50%;left:50%;
      transform:translate(-50%,-50%);
      width:420px;
      opacity:0.04;
      pointer-events:none;
      z-index:0;
    }
    .inv-wm img{width:100%;height:auto;display:block;}

    .inv-content{position:relative;z-index:1;}

    /* ── Header ── */
    .inv-hdr{
      background:linear-gradient(135deg,#16120d 0%,#2a1f10 60%,#1a1208 100%);
      padding:36px 44px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      position:relative;
      overflow:hidden;
    }
    .inv-hdr::before{
      content:'';position:absolute;top:-60px;right:-60px;
      width:260px;height:260px;border-radius:50%;
      background:rgba(255, 255, 255, 0);pointer-events:none;
    }
    .inv-hdr::after{
      content:'';position:absolute;bottom:-80px;left:120px;
      width:200px;height:200px;border-radius:50%;
      background:rgba(255, 255, 255, 0.04);pointer-events:none;
    }

    /* Logo block */
    .inv-logo-wrap{display:flex;align-items:center;gap:16px;}
    .inv-logo-img{
      height:80px;
      width:auto;
      object-fit:contain;
      filter:brightness(1.08);
      display:block;
    }
    .inv-logo-text{display:flex;flex-direction:column;gap:5px;}
    .inv-logo-name{
      font-family:'Playfair Display',Georgia,serif;
      font-size:28px;font-weight:700;
      color:#d4a853;
      letter-spacing:2px;
      line-height:1;
    }
    .inv-logo-tagline{
      font-size:9px;font-weight:600;
      letter-spacing:3px;text-transform:uppercase;
      color:rgba(212,168,83,0.5);
    }

    /* Header right badge */
    .inv-hdr-right{text-align:right;}
    .inv-badge-word{
      font-family:'Playfair Display',Georgia,serif;
      font-size:34px;font-weight:700;
      color:#d4a853;letter-spacing:4px;
      text-transform:uppercase;line-height:1;
    }
    .inv-badge-num{
      font-size:11px;font-weight:400;letter-spacing:1.5px;
      color:rgba(255,255,255,0.38);margin-top:8px;
    }
    .inv-badge-date{font-size:11px;color:rgba(212,168,83,0.5);margin-top:3px;}
    .inv-status-pill{
      margin-top:10px;display:inline-block;
      border-radius:6px;padding:4px 12px;
      font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;
    }

    /* ── Gold bars ── */
    .inv-gold{
      height:4px;
      background:linear-gradient(90deg,#8a6420,#c49a35,#f0c96b,#d4a853,#c49a35,#8a6420);
    }
    .inv-gold-thin{
      height:1px;
      background:linear-gradient(90deg,transparent,rgba(212,168,83,0.48),transparent);
    }

    /* ── Body ── */
    .inv-body{padding:40px 44px;}

    /* Section label */
    .inv-section-label{
      font-size:9px;font-weight:700;letter-spacing:2.5px;
      text-transform:uppercase;color:#c49a35;
      margin-bottom:10px;
      display:flex;align-items:center;gap:10px;
    }
    .inv-section-label::after{
      content:'';flex:1;height:1px;
      background:linear-gradient(90deg,rgba(212,168,83,0.35),transparent);
    }

    /* ── Meta row ── */
    .inv-meta{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px;}
    .inv-meta-val{font-size:13px;color:#2c2318;line-height:2;}
    .inv-meta-val strong{font-weight:600;color:#1a1208;}

    .inv-detail-grid{display:grid;gap:5px;}
    .inv-detail-row{display:flex;gap:8px;font-size:12px;}
    .inv-detail-key{color:#9c8b72;min-width:90px;font-weight:500;}
    .inv-detail-val{color:#2c2318;font-weight:600;}

    /* ── Items table ── */
    .inv-tbl-wrap{
      margin-bottom:28px;
      border-radius:12px;overflow:hidden;
      border:1px solid #e8dfc8;
    }
    .inv-tbl{width:100%;border-collapse:collapse;}
    .inv-tbl thead{background:#1a1208;}
    .inv-tbl thead th{
      padding:13px 18px;
      font-size:9px;font-weight:700;
      letter-spacing:1.8px;text-transform:uppercase;
      color:#d4a853;text-align:left;
    }
    .inv-tbl thead th.r{text-align:right;}
    .inv-tbl thead th.c{text-align:center;}
    .inv-tbl-row:last-child td{border-bottom:none!important;}

    /* ── Lower section: payment + totals ── */
    .inv-lower{display:grid;grid-template-columns:1fr auto;gap:24px;margin-bottom:28px;align-items:start;}

    .inv-pay-box{
      background:#faf6ef;border:1px solid #e8dfc8;
      border-radius:12px;padding:20px 22px;
    }
    .inv-pay-grid{
      display:grid;grid-template-columns:1fr 1fr;
      gap:14px;margin-top:12px;
    }
    .inv-pay-lbl{
      font-size:9px;font-weight:700;letter-spacing:1.5px;
      text-transform:uppercase;color:#c49a35;margin-bottom:4px;
    }
    .inv-pay-val{font-size:13px;color:#1a1208;font-weight:500;}
    .inv-pay-val.mono{font-family:monospace;font-size:11px;word-break:break-all;}

    /* ── Totals box ── */
    .inv-total-box{
      border:1px solid #e8dfc8;border-radius:12px;
      overflow:hidden;min-width:220px;
    }
    .inv-t-row{
      display:flex;justify-content:space-between;
      padding:11px 18px;font-size:13px;
      border-bottom:1px solid #f0ebe0;color:#6b5a42;
    }
    .inv-t-row:last-child{border:none;}
    .inv-t-row.grand{
      background:#1a1208;color:#d4a853;
      font-size:16px;font-weight:700;padding:14px 18px;
    }

    /* ── Note ── */
    .inv-note{
      background:#fffbf0;
      border:1px solid #e8dfc8;border-left:3px solid #d4a853;
      border-radius:8px;padding:14px 18px;margin-bottom:24px;
    }

    /* ── Thank you line ── */
    .inv-thankyou{
      text-align:center;padding:16px 0;
      font-family:'Playfair Display',Georgia,serif;
      font-size:13px;color:#b8a07a;font-style:italic;letter-spacing:0.5px;
    }

    /* ── Footer ── */
    .inv-ftr{
      background:#1a1208;padding:20px 44px;
      display:flex;align-items:center;justify-content:space-between;
    }
    .inv-ftr-brand{
      font-family:'Playfair Display',Georgia,serif;
      color:#d4a853;font-size:14px;font-weight:600;
      letter-spacing:2.5px;text-transform:uppercase;
    }
    .inv-ftr-meta{
      font-size:10px;color:rgba(212,168,83,0.4);margin-top:3px;
    }
    .inv-ftr-right{text-align:right;}
    .inv-ftr-tagline{font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:1px;}
    .inv-ftr-contact{font-size:10px;color:rgba(212,168,83,0.4);margin-top:2px;}

    /* ── Print bar ── */
    .print-bar{text-align:center;padding:24px 0;}
    .print-btn{
      background:#d4a853;color:#1a1208;
      border:none;border-radius:8px;
      padding:12px 36px;font-size:14px;font-weight:700;
      cursor:pointer;letter-spacing:0.5px;
      font-family:'Inter',sans-serif;
    }
    .print-btn:hover{background:#c9983e;}

    /* ── Print styles ── */
    @media print{
      body{background:#fff!important;padding:0!important;}
      .print-bar{display:none!important;}
      .inv-page{
        box-shadow:none!important;border-radius:0!important;
        max-width:100%!important;
      }
      @page{size:A4;margin:10mm;}
    }
  </style>
</head>
<body>

<div class="inv-page">

  <!-- Watermark -->
  <div class="inv-wm">
    <img src="${LOGO}" alt=""/>
  </div>

  <div class="inv-content">

    <!-- ── Header ── -->
    <div class="inv-hdr">

      <div class="inv-wm">
        <img src="${LOGO}" alt=""/>
      </div>

      <!-- Logo: image + text fallback side by side -->
      <div class="inv-logo-wrap">
        <img src="${LOGO_KAAPILIBRE}" class="inv-logo-img" alt="KaapiLibre"/>
        <div class="inv-logo-text">
          <div class="inv-logo-name">KaapiLibre</div>
          <div class="inv-logo-tagline">Freshly Roasted · Right to You</div>
        </div>
      </div>

      <!-- Invoice badge + status pill -->
      <div class="inv-hdr-right">
        <div class="inv-badge-word">Invoice</div>
        <div class="inv-badge-num">${invoiceNumber}</div>
        <div class="inv-badge-date">${invoiceDate}</div>
        <div
          class="inv-status-pill"
          style="background:${payStatusBg};border:1px solid ${payStatusBorder};color:${payStatusColor};"
        >${payStatusLabel}</div>
      </div>
    </div>

    <div class="inv-gold"></div>

    <!-- ── Body ── -->
    <div class="inv-body">

      <!-- Meta: bill-to + invoice details -->
      <div class="inv-meta">
        <div>
          <div class="inv-section-label">Bill to</div>
          <div class="inv-meta-val">
            <strong>${order.customer.name}</strong><br/>
            ${order.customer.email}<br/>
            ${order.customer.phone}<br/>
            ${order.shippingAddress}
          </div>
        </div>
        <div>
          <div class="inv-section-label">Invoice details</div>
          <div class="inv-detail-grid">
            <div class="inv-detail-row">
              <span class="inv-detail-key">Invoice No.</span>
              <span class="inv-detail-val">${invoiceNumber}</span>
            </div>
            <div class="inv-detail-row">
              <span class="inv-detail-key">Order No.</span>
              <span class="inv-detail-val">${order.orderNumber}</span>
            </div>
            <div class="inv-detail-row">
              <span class="inv-detail-key">Date</span>
              <span class="inv-detail-val">${invoiceDate}</span>
            </div>
            <div class="inv-detail-row">
              <span class="inv-detail-key">Due date</span>
              <span class="inv-detail-val">Immediate</span>
            </div>
          </div>
        </div>
      </div>

      <div class="inv-gold-thin" style="margin-bottom:28px;"></div>

      <!-- Items table -->
      <div class="inv-section-label">Order items</div>
      <div class="inv-tbl-wrap">
        <table class="inv-tbl">
          <thead>
            <tr>
              <th style="width:46%">Product</th>
              <th class="c" style="width:12%">Qty</th>
              <th class="r" style="width:20%">Unit price</th>
              <th class="r" style="width:22%">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>

      <!-- Payment info + Totals -->
      <div class="inv-lower">

        <!-- Payment info -->
        <div>
          <div class="inv-section-label">Payment information</div>
          <div class="inv-pay-box">
            <div class="inv-pay-grid">
              <div>
                <div class="inv-pay-lbl">Method</div>
                <div class="inv-pay-val" style="text-transform:capitalize;">${order.payment?.method ?? 'N/A'}</div>
              </div>
              <div>
                <div class="inv-pay-lbl">Status</div>
                <div class="inv-pay-val" style="color:${payStatusColor === '#4ade80' ? '#15803d' : payStatusColor === '#f87171' ? '#dc2626' : '#92400e'};text-transform:capitalize;">${order.payment?.status ?? 'pending'}</div>
              </div>
              ${order.payment?.transactionId ? `
              <div>
                <div class="inv-pay-lbl">Transaction ID</div>
                <div class="inv-pay-val mono">${order.payment.transactionId}</div>
              </div>` : ''}
              ${paidAt ? `
              <div>
                <div class="inv-pay-lbl">Paid at</div>
                <div class="inv-pay-val">${paidAt}</div>
              </div>` : ''}
            </div>
          </div>
        </div>

        <!-- Totals -->
        <div>
          <div class="inv-section-label">Summary</div>
          <div class="inv-total-box">
            <div class="inv-t-row">
              <span>Subtotal</span>
              <span>&#8377;${order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div class="inv-t-row">
              <span>Shipping</span>
              <span style="color:#15803d;font-weight:600;">Free</span>
            </div>
            <div class="inv-t-row grand">
              <span>Total</span>
              <span>&#8377;${order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${order.notes ? `
      <div class="inv-note">
        <div class="inv-pay-lbl" style="margin-bottom:6px;">Notes</div>
        <div style="font-size:13px;color:#4a3c28;">${order.notes}</div>
      </div>` : ''}

      <div class="inv-gold-thin" style="margin-bottom:16px;"></div>

      <div class="inv-thankyou">
        Thank you for choosing KaapiLibre &mdash; every cup tells a story. ☕
      </div>
    </div>

    <!-- ── Footer ── -->
    <div class="inv-gold"></div>
    <div class="inv-ftr">
      <div>
        <div class="inv-ftr-brand">Kaapi Libre LLP</div>
        <div class="inv-ftr-meta">GSTIN: 32AABCK1234F1Z5</div>
      </div>
      <div class="inv-ftr-right">
        <div class="inv-ftr-tagline">Freshly Roasted, Right to You</div>
        <div class="inv-ftr-contact">contact@kaapilibre.in &nbsp;·&nbsp; www.kaapilibre.com</div>
      </div>
    </div>

  </div><!-- /inv-content -->
</div><!-- /inv-page -->

<div class="print-bar">
  <button class="print-btn" onclick="window.print()">&#128438; Print / Save as PDF</button>
</div>

</body>
</html>`
}

export const generateCafeInvoiceHTML = (order: CafeOrder): string => {
  const invoiceNumber = getInvoiceNumber(order.orderNumber)
  const invoiceDate = format(new Date(order.createdAt), 'dd MMM yyyy')
  const cafe = order.cafeId as Cafe

  const itemRows = order.items.map(item => `
    <tr class="inv-tbl-row">
      <td style="padding:14px 18px;border-bottom:1px solid #f0ebe0;vertical-align:middle;">
        <div style="font-weight:600;color:#1a1208;font-size:14px;">${item.name}</div>
      </td>
      <td style="padding:14px 18px;border-bottom:1px solid #f0ebe0;text-align:center;color:#4a3c28;font-size:13px;">${item.qty}</td>
      <td style="padding:14px 18px;border-bottom:1px solid #f0ebe0;text-align:right;color:#4a3c28;font-size:13px;">&#8377;${item.price.toLocaleString('en-IN')}</td>
      <td style="padding:14px 18px;border-bottom:1px solid #f0ebe0;text-align:right;font-weight:700;color:#1a1208;font-size:14px;">&#8377;${item.subtotal.toLocaleString('en-IN')}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Invoice ${invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Inter',Arial,sans-serif;background:#f0ebe0;color:#1a1208;min-height:100vh;padding:32px 16px;}
    .inv-page{max-width:780px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 12px 64px rgba(26,23,19,0.22);position:relative;}
    .inv-wm{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:420px;opacity:0.04;pointer-events:none;z-index:0;}
    .inv-wm img{width:100%;height:auto;display:block;}
    .inv-content{position:relative;z-index:1;}
    .inv-hdr{background:linear-gradient(135deg,#16120d 0%,#2a1f10 60%,#1a1208 100%);padding:36px 44px;display:flex;align-items:center;justify-content:space-between;position:relative;overflow:hidden;}
    .inv-logo-wrap{display:flex;align-items:center;gap:16px;}
    .inv-logo-img{height:80px;width:auto;object-fit:contain;filter:brightness(1.08);display:block;}
    .inv-logo-text{display:flex;flex-direction:column;gap:5px;}
    .inv-logo-name{font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#d4a853;letter-spacing:2px;line-height:1;}
    .inv-logo-tagline{font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(212,168,83,0.5);}
    .inv-hdr-right{text-align:right;}
    .inv-badge-word{font-family:'Playfair Display',Georgia,serif;font-size:34px;font-weight:700;color:#d4a853;letter-spacing:4px;text-transform:uppercase;line-height:1;}
    .inv-badge-num{font-size:11px;font-weight:400;letter-spacing:1.5px;color:rgba(255,255,255,0.38);margin-top:8px;}
    .inv-badge-date{font-size:11px;color:rgba(212,168,83,0.5);margin-top:3px;}
    .inv-gold{height:4px;background:linear-gradient(90deg,#8a6420,#c49a35,#f0c96b,#d4a853,#c49a35,#8a6420);}
    .inv-gold-thin{height:1px;background:linear-gradient(90deg,transparent,rgba(212,168,83,0.48),transparent);}
    .inv-body{padding:40px 44px;}
    .inv-section-label{font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#c49a35;margin-bottom:10px;display:flex;align-items:center;gap:10px;}
    .inv-section-label::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(212,168,83,0.35),transparent);}
    .inv-meta{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px;}
    .inv-meta-val{font-size:13px;color:#2c2318;line-height:1.6;}
    .inv-meta-val strong{font-weight:600;color:#1a1208;}
    .inv-detail-grid{display:grid;gap:5px;}
    .inv-detail-row{display:flex;gap:8px;font-size:12px;}
    .inv-detail-key{color:#9c8b72;min-width:90px;font-weight:500;}
    .inv-detail-val{color:#2c2318;font-weight:600;}
    .inv-tbl-wrap{margin-bottom:28px;border-radius:12px;overflow:hidden;border:1px solid #e8dfc8;}
    .inv-tbl{width:100%;border-collapse:collapse;}
    .inv-tbl thead{background:#1a1208;}
    .inv-tbl thead th{padding:13px 18px;font-size:9px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#d4a853;text-align:left;}
    .inv-tbl thead th.r{text-align:right;}
    .inv-tbl thead th.c{text-align:center;}
    .inv-tbl-row:last-child td{border-bottom:none!important;}
    .inv-lower{display:grid;grid-template-columns:1fr auto;gap:24px;margin-bottom:28px;align-items:start;}
    .inv-pay-box{background:#faf6ef;border:1px solid #e8dfc8;border-radius:12px;padding:20px 22px;}
    .inv-pay-lbl{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#c49a35;margin-bottom:4px;}
    .inv-pay-val{font-size:13px;color:#1a1208;font-weight:500;}
    .inv-total-box{border:1px solid #e8dfc8;border-radius:12px;overflow:hidden;min-width:220px;}
    .inv-t-row{display:flex;justify-content:space-between;padding:11px 18px;font-size:13px;border-bottom:1px solid #f0ebe0;color:#6b5a42;}
    .inv-t-row:last-child{border:none;}
    .inv-t-row.grand{background:#1a1208;color:#d4a853;font-size:16px;font-weight:700;padding:14px 18px;}
    .inv-thankyou{text-align:center;padding:16px 0;font-family:'Playfair Display',Georgia,serif;font-size:13px;color:#b8a07a;font-style:italic;letter-spacing:0.5px;}
    .inv-ftr{background:#1a1208;padding:20px 44px;display:flex;align-items:center;justify-content:space-between;}
    .inv-ftr-brand{font-family:'Playfair Display',Georgia,serif;color:#d4a853;font-size:14px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;}
    .inv-ftr-meta{font-size:10px;color:rgba(212,168,83,0.4);margin-top:3px;}
    .inv-ftr-right{text-align:right;}
    .inv-ftr-tagline{font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:1px;}
    .inv-ftr-contact{font-size:10px;color:rgba(212,168,83,0.4);margin-top:2px;}
    .print-bar{text-align:center;padding:24px 0;}
    .print-btn{background:#d4a853;color:#1a1713;border:none;border-radius:8px;padding:12px 36px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;}
    @media print{.print-bar{display:none!important;}.inv-page{box-shadow:none!important;border-radius:0!important;max-width:100%!important;}@page{size:A4;margin:10mm;}}
  </style>
</head>
<body>
<div class="inv-page">
  <div class="inv-wm"><img src="${LOGO}" alt=""/></div>
  <div class="inv-content">
    <div class="inv-hdr">
      <div class="inv-logo-wrap">
        <img src="${LOGO_KAAPILIBRE}" class="inv-logo-img" alt="KaapiLibre"/>
        <div class="inv-logo-text">
          <div class="inv-logo-name">KaapiLibre</div>
          <div class="inv-logo-tagline">Freshly Roasted · Right to You</div>
        </div>
      </div>
      <div class="inv-hdr-right">
        <div class="inv-badge-word">Invoice</div>
        <div class="inv-badge-num">${invoiceNumber}</div>
        <div class="inv-badge-date">${invoiceDate}</div>
      </div>
    </div>
    <div class="inv-gold"></div>
    <div class="inv-body">
      <div class="inv-meta">
        <div>
          <div class="inv-section-label">Bill to (Cafe)</div>
          <div class="inv-meta-val">
            <strong>${cafe?.name || 'Walk-in'}</strong><br/>
            ${cafe?.email || ''}<br/>
            ${cafe?.contactNumber || ''}<br/>
            ${cafe?.location || ''}
          </div>
        </div>
        <div>
          <div class="inv-section-label">Order details</div>
          <div class="inv-detail-grid">
            <div class="inv-detail-row"><span class="inv-detail-key">Order No.</span><span class="inv-detail-val">${order.orderNumber}</span></div>
            <div class="inv-detail-row"><span class="inv-detail-key">Date</span><span class="inv-detail-val">${invoiceDate}</span></div>
            <div class="inv-detail-row"><span class="inv-detail-key">Status</span><span class="inv-detail-val" style="text-transform:capitalize;">${order.status}</span></div>
          </div>
        </div>
      </div>
      <div class="inv-gold-thin" style="margin-bottom:28px;"></div>
      <div class="inv-section-label">Menu items</div>
      <div class="inv-tbl-wrap">
        <table class="inv-tbl">
          <thead>
            <tr><th style="width:50%">Item</th><th class="c" style="width:10%">Qty</th><th class="r" style="width:20%">Price</th><th class="r" style="width:20%">Subtotal</th></tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>
      <div class="inv-lower">
        <div>
          <div class="inv-section-label">Payment</div>
          <div class="inv-pay-box">
            <div class="inv-pay-lbl">Method</div>
            <div class="inv-pay-val" style="text-transform:capitalize;">${order.paymentMethod}</div>
          </div>
        </div>
        <div>
          <div class="inv-section-label">Summary</div>
          <div class="inv-total-box">
            <div class="inv-t-row grand"><span>Total</span><span>&#8377;${order.totalAmount.toLocaleString('en-IN')}</span></div>
          </div>
        </div>
      </div>
      ${order.notes ? `<div class="inv-note"><div class="inv-pay-lbl">Notes</div><div style="font-size:13px;">${order.notes}</div></div>` : ''}
      <div class="inv-thankyou">Thank you for your business! ☕</div>
    </div>
    <div class="inv-ftr">
      <div><div class="inv-ftr-brand">Kaapi Libre LLP</div><div class="inv-ftr-meta">GSTIN: 32AABCK1234F1Z5</div></div>
      <div class="inv-ftr-right"><div class="inv-ftr-tagline">Freshly Roasted, Right to You</div><div class="inv-ftr-contact">contact@kaapilibre.in &nbsp;·&nbsp; www.kaapilibre.com</div></div>
    </div>
  </div>
</div>
<div class="print-bar"><button class="print-btn" onclick="window.print()">Print Invoice</button></div>
</body>
</html>`
}