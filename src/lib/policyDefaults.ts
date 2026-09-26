import type { PolicySlug } from '@/types'

export interface PolicySection {
  id: string
  title: string
  content: string
}

export interface PolicyMetadata {
  slug: PolicySlug
  label: string
  description: string
  websitePath: string
  accentColor: string
}

export const POLICY_CATALOG: Record<PolicySlug, PolicyMetadata> = {
  'privacy-policy': {
    slug: 'privacy-policy',
    label: 'Privacy Policy',
    description: 'Data collection practices, IT Act & DPDPA compliance, cookies, and customer rights.',
    websitePath: '/privacy-policy',
    accentColor: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
  },
  'terms-and-conditions': {
    slug: 'terms-and-conditions',
    label: 'Terms & Conditions',
    description: 'Website rules, roasting variations, purchase eligibility, IP rights, and jurisdiction.',
    websitePath: '/terms-and-conditions',
    accentColor: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
  },
  'shipping-policy': {
    slug: 'shipping-policy',
    label: 'Shipping & Delivery Policy',
    description: 'Fresh roast dispatch timelines, pan-India courier partners, delivery windows, and transit care.',
    websitePath: '/shipping-policy',
    accentColor: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
  },
  'cancellation-refund-policy': {
    slug: 'cancellation-refund-policy',
    label: 'Cancellation & Refund Policy',
    description: 'Cancellation cutoff times, food safety return policies, damaged shipment claims, and refunds.',
    websitePath: '/cancellation-refund-policy',
    accentColor: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400',
  },
  'cookie-policy': {
    slug: 'cookie-policy',
    label: 'Cookie Policy',
    description: 'Essential session cookies, analytics tags, browser tracking management, and third-party tools.',
    websitePath: '/cookie-policy',
    accentColor: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400',
  },
}

export const STARTER_POLICIES: Record<
  PolicySlug,
  { title: string; summary: string; content: string }
> = {
  'privacy-policy': {
    title: 'Privacy Policy',
    summary: 'How KaapiLibre collects, uses, protects, and handles your personal information across our website and services.',
    content: `<h2>1. Introduction & Overview</h2>
<p>At KaapiLibre ("we", "our", or "us"), we value the trust you place in us when you purchase our single-origin specialty coffees and explore our brewing equipment. This Privacy Policy details how we collect, use, disclose, and safeguard your personal information when you visit our website (<strong>kaapilibre.com</strong>) or interact with our services.</p>
<p>We are committed to complying with applicable data protection laws, including the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act (DPDPA), 2023 of India.</p>

<h2>2. Information We Collect</h2>
<p>We collect information that you directly provide to us, as well as data gathered automatically through your use of our platform:</p>
<ul>
  <li><strong>Personal Identification Data:</strong> Full name, email address, phone number, shipping address, and billing address provided during checkout or account registration.</li>
  <li><strong>Order & Transaction Records:</strong> Purchase history, items ordered, grind preferences, invoice records, and payment method identifiers. <em>Please note: We do not store full credit/debit card numbers or CVV. All payments are processed through PCI-DSS compliant, RBI-authorized payment gateways (e.g., Razorpay, Cashfree).</em></li>
  <li><strong>Communications & Feedback:</strong> Inquiries sent via our contact form, emails to customer support, WhatsApp inquiries, and reviews submitted on our coffee blends.</li>
  <li><strong>Technical & Browsing Data:</strong> IP address, browser type, operating system, device characteristics, pages visited, time spent on pages, and referral sources collected via cookies and analytics.</li>
</ul>

<h2>3. How We Use Your Information</h2>
<p>Your data is processed strictly for legitimate business purposes, including:</p>
<ul>
  <li>Fulfilling and dispatching your fresh coffee orders, providing order status tracking via SMS and email.</li>
  <li>Processing transactions and generating GST-compliant tax invoices.</li>
  <li>Communicating essential order updates, shipping delays, or stock alerts.</li>
  <li>Providing responsive customer support and resolving delivery inquiries.</li>
  <li>Improving our website performance, user experience, and curated coffee offerings.</li>
  <li>Sending our newsletter "The Archives" featuring new canopy micro-lots and small-batch roasts (only if you have opted in; you may unsubscribe at any time).</li>
  <li>Preventing fraudulent transactions and maintaining platform security.</li>
</ul>

<h2>4. Information Sharing & Third-Party Services</h2>
<p>We never sell, rent, or trade your personal data to external advertisers. We only share necessary data with vetted partners under strict confidentiality agreements:</p>
<ul>
  <li><strong>Logistics & Courier Partners:</strong> Trusted delivery services (such as Blue Dart, Delhivery, DTDC, and India Post) to deliver your coffee packages to your doorstep.</li>
  <li><strong>Payment Gateways:</strong> Secure, licensed payment aggregators to process UPI, Net Banking, credit/debit cards, and wallet transactions.</li>
  <li><strong>Cloud & Communication Infrastructure:</strong> Secure cloud database providers and transactional messaging services (SMS/Email) to deliver real-time notifications.</li>
  <li><strong>Legal Compliance:</strong> When required by Indian law, judicial summons, or regulatory authorities to protect our legal rights or public safety.</li>
</ul>

<h2>5. Data Security & Storage</h2>
<p>We implement industry-standard administrative, technical, and physical security measures, including 256-bit SSL encryption, tokenized authentication, and restricted database access. While no internet transmission is 100% invulnerable, we regularly review and upgrade our security practices.</p>

<h2>6. Your Rights & Choices</h2>
<p>As a valued KaapiLibre customer, you have the right to:</p>
<ul>
  <li>Review, correct, or update your registered account information at any time.</li>
  <li>Opt out of marketing communications via the "unsubscribe" link in any promotional email.</li>
  <li>Request the deletion or anonymization of your personal account data, subject to mandatory tax and accounting retention requirements under Indian law.</li>
</ul>

<h2>7. Grievance Officer & Contact Us</h2>
<p>If you have questions, concerns, or grievances regarding our privacy practices or data handling, please contact our designated Grievance Officer:</p>
<p><strong>Grievance Officer:</strong> KaapiLibre Privacy & Compliance Team<br/>
<strong>Email:</strong> <a href="mailto:grievance@kaapilibre.com">grievance@kaapilibre.com</a> / <a href="mailto:support@kaapilibre.com">support@kaapilibre.com</a><br/>
<strong>Address:</strong> KaapiLibre Specialty Roasters, Chikmagalur & Bengaluru, Karnataka, India<br/>
We will acknowledge your grievance within 48 hours and resolve it within 30 days as mandated by applicable guidelines.</p>`,
  },
  'terms-and-conditions': {
    title: 'Terms & Conditions',
    summary: 'The terms, rules, and conditions governing the use of KaapiLibre website and the purchase of our specialty coffee and gear.',
    content: `<h2>1. Agreement to Terms</h2>
<p>Welcome to KaapiLibre. By accessing or using our website (<strong>kaapilibre.com</strong>), purchasing our specialty coffee beans, subscribing to our roasts, or using any associated services, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree with any part of these Terms, please refrain from using our website.</p>

<h2>2. Eligibility & Account Responsibilities</h2>
<ul>
  <li>You must be at least 18 years of age or accessing the site under the supervision of a parent or legal guardian to make a purchase.</li>
  <li>If you create an account, you are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</li>
  <li>You agree to provide accurate, current, and complete information during checkout and registration.</li>
</ul>

<h2>3. Products, Pricing & Roasting Commitment</h2>
<ul>
  <li><strong>Artisanal Produce:</strong> Coffee is an agricultural crop. Minor flavor variations across harvest seasons and roast micro-lots are natural characteristics of shade-grown, single-origin coffees.</li>
  <li><strong>Grind Sizes:</strong> We grind coffee according to your selected brewing method (Whole Bean, French Press, Pour Over, South Indian Filter, Espresso). Please ensure you select the appropriate grind for your equipment before placing your order.</li>
  <li><strong>Pricing & Taxes:</strong> All prices listed on our website are in Indian National Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST) unless explicitly indicated otherwise.</li>
  <li><strong>Price Modifications:</strong> We reserve the right to alter pricing, introduce seasonal batches, or discontinue blends without prior notice.</li>
</ul>

<h2>4. Orders, Acceptance & Cancellations</h2>
<ul>
  <li>Your receipt of an electronic order confirmation does not signify our final acceptance of your order. KaapiLibre reserves the right to accept, decline, or limit order quantities for any legitimate reason, including inventory shortages, pricing errors, or suspected fraud.</li>
  <li>If your order is canceled after your payment has been processed, the full amount will be promptly refunded to your original payment source.</li>
  <li>Order cancellation requests are subject to our <a href="/cancellation-refund-policy">Cancellation & Refund Policy</a>.</li>
</ul>

<h2>5. Intellectual Property Rights</h2>
<p>All content on this website—including brand name, logos, packaging design, trademarks, photography, coffee descriptions, brewing guides, graphics, and code—is the proprietary intellectual property of KaapiLibre and is protected under Indian and international copyright and trademark laws. Unauthorized copying, reproduction, or commercial exploitation is strictly prohibited.</p>

<h2>6. User Code of Conduct</h2>
<p>When using our site, you agree not to:</p>
<ul>
  <li>Transmit any malicious code, viruses, or disruptive scripts.</li>
  <li>Engage in automated data harvesting, scraping, or crawler indexing of our catalog without explicit written permission.</li>
  <li>Attempt unauthorized access to our servers, user accounts, or payment gateways.</li>
  <li>Use our products for unauthorized commercial resale or rebranding.</li>
</ul>

<h2>7. Disclaimer of Warranties & Limitation of Liability</h2>
<p>Our website and products are provided on an "as is" and "as available" basis. To the maximum extent permitted by applicable law, KaapiLibre disclaims all warranties, express or implied. Under no circumstances shall KaapiLibre or its founders, team members, or affiliates be liable for indirect, incidental, punitive, or consequential damages resulting from the use of our website or consumed products beyond the purchase value of the order in dispute.</p>

<h2>8. Governing Law & Dispute Resolution</h2>
<p>These Terms shall be governed by and construed in accordance with the laws of India. Any legal disputes or claims arising out of or relating to these Terms or your use of our services shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka, India.</p>

<h2>9. Changes to Terms</h2>
<p>We may update these Terms from time to time. Revisions take effect immediately upon being posted on this page. We encourage you to review this page periodically.</p>`,
  },
  'shipping-policy': {
    title: 'Shipping & Delivery Policy',
    summary: 'Our roast-to-order workflow, courier partners, estimated delivery timelines, and transit details across India.',
    content: `<h2>1. The Fresh Roast Commitment</h2>
<p>At KaapiLibre, we believe coffee is best experienced fresh. We do not store pre-ground, shelf-aged bags. All coffees are roasted in small batches to order, sealed in high-barrier degassing valve pouches to protect aromatic integrity, and dispatched promptly to ensure peak flavor upon arrival.</p>

<h2>2. Order Processing & Dispatch Timelines</h2>
<ul>
  <li><strong>Roasting & Packaging:</strong> Orders are processed and roasted within <strong>24 to 48 business hours</strong> of payment confirmation.</li>
  <li><strong>Dispatch Days:</strong> Our roastery operates Monday through Saturday. Orders placed on Sundays or public holidays are scheduled for roast and dispatch on the following business day.</li>
  <li><strong>Brewing Equipment & Gear:</strong> Accessory orders are thoroughly inspected, bubble-wrapped, and dispatched within 24 hours.</li>
</ul>

<h2>3. Estimated Delivery Timelines Across India</h2>
<p>Once dispatched from our roastery in Karnataka, typical delivery transit times are as follows:</p>
<table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0;">
  <thead>
    <tr style="border-bottom: 2px solid rgba(255,255,255,0.15); text-align: left;">
      <th style="padding: 10px 12px; font-weight: 600;">Destination Region</th>
      <th style="padding: 10px 12px; font-weight: 600;">Estimated Delivery Window</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
      <td style="padding: 10px 12px;">Bengaluru & Southern Metro Hubs (Chennai, Hyderabad)</td>
      <td style="padding: 10px 12px;">1 - 3 Business Days</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
      <td style="padding: 10px 12px;">Other Major Metros (Mumbai, Delhi NCR, Kolkata, Pune)</td>
      <td style="padding: 10px 12px;">2 - 4 Business Days</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
      <td style="padding: 10px 12px;">Tier 2 & Tier 3 Cities (Pan-India)</td>
      <td style="padding: 10px 12px;">4 - 6 Business Days</td>
    </tr>
    <tr>
      <td style="padding: 10px 12px;">North-East, J&K, Island Territories & Remote Postal Codes</td>
      <td style="padding: 10px 12px;">6 - 9 Business Days</td>
    </tr>
  </tbody>
</table>
<p><em>*Note: Timelines are indicative and depend on regional courier network efficiency and local conditions.</em></p>

<h2>4. Shipping Rates & Free Delivery</h2>
<ul>
  <li><strong>Free Standard Shipping:</strong> We offer complimentary standard shipping on all prepaid orders of ₹499 or more across India.</li>
  <li><strong>Orders below ₹499:</strong> A nominal flat shipping charge of ₹50 - ₹70 is applied at checkout depending on parcel weight and delivery destination.</li>
  <li>All applicable shipping charges are clearly visible at the checkout step before final payment.</li>
</ul>

<h2>5. Courier Partners & Live Tracking</h2>
<p>We partner with top-tier express courier services including Blue Dart, Delhivery, DTDC, and Speed Post. As soon as your order is picked up, you will receive an SMS and email containing your active Air Waybill (AWB) number and direct tracking link to monitor your shipment in real time.</p>

<h2>6. Delays & Force Majeure</h2>
<p>While we make every effort to deliver your coffee within estimated windows, delays may occasionally occur due to extreme weather, transport strikes, holiday rush periods, or courier route disruptions. In such cases, our team actively monitors transit and assists in expediting clearance.</p>

<h2>7. Damaged Shipments or Incorrect Address</h2>
<ul>
  <li><strong>Damaged Packaging:</strong> If your parcel arrives visibly punctured or damaged, please take clear photos/video before opening and report it to us within 48 hours at <a href="mailto:support@kaapilibre.com">support@kaapilibre.com</a>.</li>
  <li><strong>Incorrect Delivery Details:</strong> Please double-check your shipping address and phone number during checkout. If an order is returned to us due to an incorrect or incomplete address provided by the customer, re-shipping charges may apply.</li>
</ul>`,
  },
  'cancellation-refund-policy': {
    title: 'Cancellation & Refund Policy',
    summary: 'Guidelines for canceling an order, return eligibility for fresh coffee and gear, and refund processing procedures.',
    content: `<h2>1. Order Cancellation Policy</h2>
<ul>
  <li><strong>Prior to Roasting / Dispatch:</strong> Because our coffee is freshly roasted in micro-lots to order, cancellation requests can only be accommodated within <strong>3 hours</strong> of order placement or before the roasting cycle begins.</li>
  <li>To request a cancellation, please email us immediately at <a href="mailto:support@kaapilibre.com">support@kaapilibre.com</a> or message our customer care WhatsApp with your Order ID.</li>
  <li>If the order has already been roasted, ground, or dispatched with a tracking number, it cannot be canceled.</li>
</ul>

<h2>2. Return Eligibility</h2>
<h3>Coffee Products (Perishable Goods)</h3>
<p>Under food safety, health, and hygiene standards (FSSAI guidelines), <strong>freshly roasted coffee beans and ground coffee are non-returnable</strong> once opened. However, we stand 100% behind the quality of our roasts. You are eligible for a replacement or full refund if:</p>
<ul>
  <li>You received an incorrect item or an incorrect grind size different from what you ordered.</li>
  <li>The package was torn, damaged, or tampered with during transit.</li>
  <li>The coffee arrived past its best-before window or exhibited packaging seal failure.</li>
</ul>

<h3>Brewing Equipment & Accessories</h3>
<p>Manual brewing gear (French Presses, South Indian Filters, Pour Over drippers, kettles, and scales) can be returned within <strong>7 days of delivery</strong> provided that:</p>
<ul>
  <li>The item is completely unused, unwashed, and in its original retail packaging with all manuals and accessories included.</li>
  <li>Any gear arriving with manufacturing defects will be replaced immediately at no additional cost.</li>
</ul>

<h2>3. How to Initiate a Claim</h2>
<p>If you encounter an issue with your delivered order, please follow these simple steps within <strong>48 hours</strong> of package delivery:</p>
<ol>
  <li>Take clear photos and/or a brief unboxing video showing the shipping label, packaging condition, and the issue.</li>
  <li>Email the evidence along with your Order ID to <a href="mailto:support@kaapilibre.com">support@kaapilibre.com</a> or reach us via WhatsApp at +91 97410 74011.</li>
  <li>Our support team will review your claim and respond within 24 business hours with an approval for replacement or refund.</li>
</ol>

<h2>4. Refund Processing & Timelines</h2>
<ul>
  <li><strong>Approval:</strong> Once your refund claim is validated and approved, the refund is initiated immediately in our payment system.</li>
  <li><strong>Payment Mode:</strong> Refunds are credited back to the original payment method used during checkout (Credit/Debit Card, UPI, Net Banking, or Wallet).</li>
  <li><strong>Bank Clearance Window:</strong>
    <ul>
      <li>UPI Payments: Usually credited within 24 to 48 hours.</li>
      <li>Credit / Debit Cards & Net Banking: Typically takes 5 to 7 business days, depending on your issuing bank's settlement cycle.</li>
    </ul>
  </li>
</ul>

<h2>5. Need Help?</h2>
<p>We are coffee lovers first. If you are unsatisfied with your cup or need brewing guidance to dial in your grind, reach out to us at <a href="mailto:support@kaapilibre.com">support@kaapilibre.com</a>—we are always happy to help you brew the perfect cup.</p>`,
  },
  'cookie-policy': {
    title: 'Cookie Policy',
    summary: 'Details regarding how cookies, local storage, and tracking technologies are used to optimize your experience on KaapiLibre.',
    content: `<h2>1. What Are Cookies?</h2>
<p>Cookies are small text files stored on your computer, smartphone, or tablet when you browse websites. They are widely used to make websites work efficiently, remember your shopping preferences, and provide analytical information to website operators.</p>

<h2>2. How KaapiLibre Uses Cookies</h2>
<p>We use cookies and similar browser storage technologies (such as local storage and session tokens) for the following essential purposes:</p>
<ul>
  <li><strong>Strictly Necessary & Functional Cookies:</strong>
    <ul>
      <li>Maintaining your active session and shopping cart contents as you browse between pages.</li>
      <li>Saving your chosen grind size, bean weight, and recurring subscription preferences.</li>
      <li>Securing account authentication and preventing Cross-Site Request Forgery (CSRF).</li>
    </ul>
  </li>
  <li><strong>Performance & Analytics Cookies:</strong>
    <ul>
      <li>Understanding which coffee origins, journal articles, and brewing guides are most popular among our visitors.</li>
      <li>Measuring site loading speeds, bounce rates, and checkout drop-offs to improve overall website performance (e.g., via Google Analytics).</li>
      <li>All analytics data is collected in anonymized, aggregated formats.</li>
    </ul>
  </li>
  <li><strong>Marketing & Social Cookies:</strong>
    <ul>
      <li>Measuring the performance of our newsletter campaigns and seasonal release announcements.</li>
      <li>Providing social sharing buttons (Instagram, Facebook, Twitter/X) and tracking referrals.</li>
    </ul>
  </li>
</ul>

<h2>3. Managing & Disabling Cookies</h2>
<p>You have full control over your cookie preferences:</p>
<ul>
  <li>You can adjust your browser settings (Chrome, Safari, Firefox, Edge) to block or delete cookies at any time.</li>
  <li><em>Please note:</em> If you choose to disable essential cookies, certain features of our site—such as adding items to your cart, saving customized grind preferences, or completing checkout—may not function properly.</li>
</ul>

<h2>4. Third-Party Cookies</h2>
<p>Certain third-party service providers integrated into our site (such as payment processors and web analytics) may also place cookies on your device. These third parties have their own privacy and cookie policies, and we recommend reviewing their terms directly.</p>

<h2>5. Updates to This Cookie Policy</h2>
<p>We may update this policy periodically to reflect changes in our technologies or legal requirements. The "Last Updated" date at the top of this page indicates the date of the most recent modifications.</p>

<h2>6. Inquiries</h2>
<p>If you have any questions regarding our use of cookies, please contact us at <a href="mailto:support@kaapilibre.com">support@kaapilibre.com</a>.</p>`,
  },
}

export const CLAUSE_TEMPLATES = [
  {
    name: 'Important Notice Callout',
    description: 'Highlighted callout box for legal caveats or disclaimers',
    html: `<blockquote style="border-left: 4px solid #598aa6; background: rgba(89, 138, 166, 0.1); padding: 12px 16px; margin: 16px 0; border-radius: 6px;"><strong>Notice:</strong> Please review this policy carefully before completing your transaction. All orders are subject to terms outlined herein.</blockquote>`,
  },
  {
    name: 'Grievance / Contact Officer Box',
    description: 'Formatted contact information for compliance or customer care',
    html: `<div style="border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; margin: 16px 0;">
  <p><strong>Compliance & Grievance Officer:</strong> KaapiLibre Legal Team</p>
  <p><strong>Email:</strong> <a href="mailto:support@kaapilibre.com">support@kaapilibre.com</a> / <a href="mailto:grievance@kaapilibre.com">grievance@kaapilibre.com</a></p>
  <p><strong>Address:</strong> KaapiLibre Roastery, Chikmagalur & Bengaluru, Karnataka, India</p>
  <p><em>Inquiries are resolved within 24–48 business hours.</em></p>
</div>`,
  },
  {
    name: 'Standard Delivery Timetable',
    description: 'Clean responsive table for delivery windows and regions',
    html: `<table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0;">
  <thead>
    <tr style="border-bottom: 2px solid rgba(255,255,255,0.15); text-align: left;">
      <th style="padding: 10px 12px; font-weight: 600;">Region</th>
      <th style="padding: 10px 12px; font-weight: 600;">Estimated Transit</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
      <td style="padding: 10px 12px;">Southern Metro Hubs (BLR, MAA, HYD)</td>
      <td style="padding: 10px 12px;">1 - 3 Business Days</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
      <td style="padding: 10px 12px;">Other Major Metros (BOM, DEL, CCU)</td>
      <td style="padding: 10px 12px;">2 - 4 Business Days</td>
    </tr>
    <tr>
      <td style="padding: 10px 12px;">Rest of India & Remote Areas</td>
      <td style="padding: 10px 12px;">4 - 7 Business Days</td>
    </tr>
  </tbody>
</table>`,
  },
  {
    name: 'Perishable Food Quality Guarantee',
    description: 'Clause outlining FSSAI coffee freshness and return rules',
    html: `<p><strong>Food Safety & Quality Guarantee:</strong> Due to hygiene and food safety standards (FSSAI), opened coffee packages cannot be returned. However, if your roast arrived damaged or does not match your ordered grind specification, we offer a 100% free replacement or full refund within 48 hours of delivery.</p>`,
  },
  {
    name: 'Statutory Compliance (DPDPA & IT Act)',
    description: 'Indian data privacy compliance declaration',
    html: `<p>KaapiLibre operates in strict accordance with the Digital Personal Data Protection Act (DPDPA), 2023, and the Information Technology Act, 2000 of India. User data is never sold or shared with unauthorized commercial entities.</p>`,
  },
]

export function parseHtmlToSections(html: string): { preamble: string; sections: PolicySection[] } {
  if (typeof window === 'undefined' || !html || !html.trim()) {
    return { preamble: '', sections: [] }
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const body = doc.body

    let preambleHtml = ''
    const sections: PolicySection[] = []
    let currentSection: { id: string; title: string; nodes: string[] } | null = null

    for (const node of Array.from(body.childNodes)) {
      const isH2 =
        node.nodeType === Node.ELEMENT_NODE &&
        (node as HTMLElement).tagName.toLowerCase() === 'h2'

      if (isH2) {
        if (currentSection) {
          sections.push({
            id: currentSection.id,
            title: currentSection.title,
            content: currentSection.nodes.join('\n').trim(),
          })
        }
        currentSection = {
          id: 'sec-' + Math.random().toString(36).substring(2, 9),
          title: (node as HTMLElement).textContent?.trim() || '',
          nodes: [],
        }
      } else {
        const htmlStr =
          node.nodeType === Node.ELEMENT_NODE
            ? (node as HTMLElement).outerHTML
            : node.textContent?.trim()
            ? `<p>${node.textContent.trim()}</p>`
            : ''

        if (htmlStr) {
          if (currentSection) {
            currentSection.nodes.push(htmlStr)
          } else {
            preambleHtml += htmlStr + '\n'
          }
        }
      }
    }

    if (currentSection) {
      sections.push({
        id: currentSection.id,
        title: currentSection.title,
        content: currentSection.nodes.join('\n').trim(),
      })
    }

    return {
      preamble: preambleHtml.trim(),
      sections,
    }
  } catch (e) {
    console.error('Error parsing HTML to sections:', e)
    return { preamble: html, sections: [] }
  }
}

export function sectionsToHtml(preamble: string, sections: PolicySection[]): string {
  let out = ''
  if (preamble && preamble.trim()) {
    out += preamble.trim() + '\n\n'
  }
  sections.forEach((sec) => {
    if (sec.title && sec.title.trim()) {
      out += `<h2>${sec.title.trim()}</h2>\n`
    }
    if (sec.content && sec.content.trim()) {
      out += `${sec.content.trim()}\n\n`
    }
  })
  return out.trim()
}

export function calculateReadingStats(html: string) {
  if (!html) return { wordCount: 0, charCount: 0, readingTimeMinutes: 0, sectionCount: 0 }
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const charCount = text.length
  const words = text ? text.split(/\s+/).filter(Boolean) : []
  const wordCount = words.length
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))
  const matches = html.match(/<h2[^>]*>/gi)
  const sectionCount = matches ? matches.length : 0
  return { wordCount, charCount, readingTimeMinutes, sectionCount }
}
