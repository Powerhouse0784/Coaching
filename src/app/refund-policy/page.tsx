// app/refund-policy/page.tsx
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { RotateCcw } from 'lucide-react';

export const metadata = {
  title: 'Refund Policy | Intense Learners - Fair & Transparent Refunds',
  description: 'Understand our refund policy for orders, payments, and cancellations. We believe in fair and transparent refunds for all students.',
  keywords: 'refund policy, money back, order cancellation, payment refund, Intense Learners',
  openGraph: {
    title: 'Refund Policy | Intense Learners',
    description: 'Transparent and fair refund policies for your peace of mind.',
    type: 'website',
  },
};

const sections = [
  { id: 'intro',              label: '1. Overview'                    },
  { id: 'order-flow',         label: '2. How Orders Work'             },
  { id: 'qr-rejected',        label: '3. QR Payment Rejection'        },
  { id: 'cod',                label: '4. Cash on Delivery (COD)'      },
  { id: 'cancellations',      label: '5. Order Cancellations'         },
  { id: 'refund-eligibility', label: '6. Refund Eligibility'          },
  { id: 'refund-timeline',    label: '7. Refund Process & Timeline'   },
  { id: 'non-refundable',     label: '8. Non-Refundable Situations'   },
  { id: 'disputes',           label: '9. Disputes & Escalation'       },
  { id: 'changes',            label: '10. Changes to This Policy'     },
  { id: 'contact',            label: '11. Contact Us'                 },
];

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="Refund Policy"
      icon={<RotateCcw className="w-7 h-7 text-white" />}
      lastUpdated="June 16, 2026"
      sections={sections}
    >

      <section id="intro">
        <h2>1. Overview</h2>
        <p>
          At <strong>Intense Learners</strong>, we believe in <strong>transparent and fair</strong> refund policies.
          This Refund Policy explains how orders are processed, what happens if a payment cannot be verified, and when a
          refund or replacement may apply.
        </p>
        <div className="callout callout-info">
          <p>
            <strong>📌 Quick summary:</strong> We process refunds for genuine cases within 7–10 business days.
            We'll always try to resolve issues before processing refunds — your satisfaction matters to us.
          </p>
        </div>
        <p>This policy applies to <strong>all orders</strong> placed through the Platform, regardless of payment method.</p>
      </section>

      <section id="order-flow">
        <h2>2. How Orders Work</h2>
        <p>When you place an order, here's what happens step by step:</p>

        <h3>Option A — QR Code (UPI) Payment</h3>
        <ol>
          <li>Scan the QR code displayed at checkout using your UPI app</li>
          <li>Complete the payment</li>
          <li>Upload the payment confirmation screenshot to the Platform</li>
          <li>Order enters <strong>pending</strong> status awaiting review</li>
          <li>Administrator reviews payment proof manually</li>
          <li>Order is <strong>approved</strong> (dispatched) or <strong>rejected</strong> (with reason)</li>
        </ol>

        <h3>Option B — Cash on Delivery (COD)</h3>
        <ol>
          <li>Place your order on the Platform</li>
          <li>Receive a delivery confirmation with estimated time</li>
          <li>Pay in cash at the time of delivery</li>
          <li>Confirm receipt and the order is marked complete</li>
        </ol>

        <div className="callout callout-warn">
          <p>
            <strong>💡 Payment tip:</strong> For QR payments, ensure your screenshot clearly shows the amount, date/time,
            and the UPI transaction / UTR reference number for fast approval.
          </p>
        </div>
      </section>

      <section id="qr-rejected">
        <h2>3. QR Payment Rejection</h2>
        <p>
          An order may be rejected if the payment proof is unclear, the amount doesn't match, or the payment cannot be
          independently verified.
        </p>
        <h3>If Your Order Is Rejected</h3>
        <ul>
          <li>The <strong>reason for rejection</strong> is recorded and visible in your order history</li>
          <li><strong>Contact us immediately</strong> with additional or clearer proof of payment</li>
          <li>We'll re-verify and either <strong>approve</strong> or process a <strong>refund</strong></li>
          <li>If no payment was actually made, the order simply remains cancelled with no financial impact</li>
        </ul>
      </section>

      <section id="cod">
        <h2>4. Cash on Delivery (COD)</h2>
        <ul>
          <li><strong>No payment</strong> is collected until the item is physically delivered to you</li>
          <li>If you're unavailable or refuse delivery without prior notice, the order may be <strong>cancelled</strong></li>
          <li>Repeated refusal of COD orders may result in <strong>COD being disabled</strong> for your account</li>
          <li>In such cases, only <strong>QR/UPI payment</strong> will be available for future orders</li>
        </ul>
      </section>

      <section id="cancellations">
        <h2>5. Order Cancellations</h2>
        <p>You can request cancellation at different stages:</p>
        <ul>
          <li><strong>Before Approval:</strong> Contact us immediately — we can cancel and (if paid) refund quickly</li>
          <li><strong>After Approval:</strong> Cancellation may not be possible if the order is already dispatched</li>
          <li><strong>COD Orders:</strong> Easier to cancel since no payment has been collected yet</li>
          <li><strong>Digital Content:</strong> Once accessed or downloaded, cancellations are generally not accepted</li>
        </ul>
        <p>
          To cancel an order, email{' '}
          <a href="mailto:saquibnadeem0@gmail.com">saquibnadeem0@gmail.com</a> with your <strong>Order ID</strong> and reason.
        </p>
      </section>

      <section id="refund-eligibility">
        <h2>6. Refund Eligibility</h2>
        <p>Whether you're eligible for a refund depends on the situation:</p>

        <h3>✅ Eligible for Refund</h3>
        <ul>
          <li>QR/UPI payment was made but the order was <strong>rejected</strong> by us</li>
          <li>Order was cancelled by us after payment was collected</li>
          <li>Product delivered is <strong>physically damaged</strong> or materially defective</li>
          <li>Product received is <strong>materially different</strong> from what was described</li>
          <li>Damage/issue was reported within <strong>48 hours</strong> of delivery with photo evidence</li>
          <li>A <strong>duplicate payment</strong> was made for the same order</li>
        </ul>

        <h3>❌ Not Eligible for Refund</h3>
        <ul>
          <li>Change of mind after the order has been approved and dispatched</li>
          <li>Payment proof that is <strong>fake, edited, or manipulated</strong></li>
          <li>Digital notes or content that has already been <strong>accessed or downloaded substantially</strong></li>
          <li>Issues reported <strong>after 48 hours</strong> of delivery</li>
          <li>Products that were <strong>self-damaged</strong> after delivery</li>
          <li>Orders where the <strong>wrong product was ordered</strong> due to user error</li>
        </ul>
      </section>

      <section id="refund-timeline">
        <h2>7. Refund Process &amp; Timeline</h2>

        <h3>How Refunds Are Processed</h3>
        <ol>
          <li>You submit a refund request via email with your Order ID and evidence</li>
          <li>We <strong>verify</strong> your request and order details within 1–2 business days</li>
          <li>If eligible, we <strong>approve</strong> the refund and notify you</li>
          <li>Refund is initiated to the <strong>original UPI ID</strong> used for payment</li>
          <li>You receive a confirmation with a <strong>tracking reference</strong></li>
        </ol>

        <div className="callout callout-info">
          <p>
            <strong>⏰ Timeline:</strong> Approved refunds are initiated within <strong>7–10 business days</strong>.
            Bank or UPI processing may add 2–3 additional working days depending on your bank.
          </p>
        </div>

        <h3>For Damaged or Incorrect Products</h3>
        <ul>
          <li>Report within <strong>48 hours</strong> of delivery via email</li>
          <li>Attach <strong>clear photos</strong> showing the damage or discrepancy</li>
          <li>We'll arrange a <strong>replacement</strong> or full refund at our discretion</li>
          <li>If a return is required, we'll cover the <strong>return shipping cost</strong></li>
        </ul>
      </section>

      <section id="non-refundable">
        <h2>8. Non-Refundable Situations</h2>
        <p>Refunds will <strong>NOT</strong> be provided in these cases:</p>
        <ul>
          <li>❌ <strong>Fake or altered proof:</strong> If payment proof is manipulated or fabricated</li>
          <li>❌ <strong>No payment received:</strong> Payment was not actually credited to our account</li>
          <li>❌ <strong>Late reporting:</strong> Issues reported more than 48 hours after delivery</li>
          <li>❌ <strong>Digital content consumed:</strong> Notes already downloaded or substantially viewed</li>
          <li>❌ <strong>Change of mind:</strong> After the order has been approved and dispatched</li>
          <li>❌ <strong>User error:</strong> Wrong product ordered intentionally or by mistake</li>
          <li>❌ <strong>Self-damage:</strong> Product damaged by the recipient after delivery</li>
        </ul>
      </section>

      <section id="disputes">
        <h2>9. Disputes &amp; Escalation</h2>
        <p>If you disagree with a refund decision, you can escalate the issue through the following process:</p>
        <ol>
          <li><strong>Initial Contact:</strong> Email us at <a href="mailto:saquibnadeem0@gmail.com">saquibnadeem0@gmail.com</a></li>
          <li><strong>Escalation Subject:</strong> Use "Refund Escalation – Order #[ID]" in the subject line</li>
          <li><strong>Provide Evidence:</strong> Include your Order ID, payment proof, and all supporting evidence</li>
          <li><strong>Review:</strong> We'll review your case in good faith within 2–3 business days</li>
          <li><strong>Final Decision:</strong> We'll provide a final, reasoned decision within 5 business days</li>
        </ol>
        <div className="callout callout-info">
          <p>
            <strong>⚖️ Fair process:</strong> We treat all disputes seriously and aim to resolve them fairly and promptly.
            We want every student to feel confident ordering from us.
          </p>
        </div>
      </section>

      <section id="changes">
        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Refund Policy as our processes evolve. Changes will be reflected in the "Last updated" date and
          applied to orders placed <strong>after</strong> the change. We'll communicate significant changes via a platform
          notification. The policy in effect at the time you placed your order will generally apply to that order.
        </p>
      </section>

      <section id="contact">
        <h2>11. Contact Us</h2>
        <p>For any refund-related questions or requests, reach out through any of these channels:</p>
        <ul>
          <li><strong>📧 Email:</strong> <a href="mailto:saquibnadeem0@gmail.com">saquibnadeem0@gmail.com</a></li>
          <li><strong>📱 Instagram:</strong> <a href="https://www.instagram.com/intense_learners" target="_blank" rel="noopener noreferrer">@intense_learners</a></li>
          <li><strong>📘 Facebook:</strong> <a href="https://www.facebook.com/share/1E77DTHG5w/" target="_blank" rel="noopener noreferrer">Intense Learners</a></li>
          <li><strong>⏰ Response time:</strong> Within 24–48 business hours</li>
        </ul>
        <div className="callout callout-info">
          <p>
            <strong>📋 When contacting us about a refund, please include:</strong> your full name, email address used for the
            order, the Order ID, and a clear description of the issue with supporting evidence.
          </p>
        </div>
      </section>

    </LegalPageLayout>
  );
}