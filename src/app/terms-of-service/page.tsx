// app/terms-of-service/page.tsx
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { FileText } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Intense Learners - Fair & Transparent Terms',
  description: 'Read the complete Terms of Service for Intense Learners. Understand your rights, responsibilities, and our policies for a safe learning environment.',
  keywords: 'terms of service, terms and conditions, user agreement, coaching terms, Intense Learners',
  openGraph: {
    title: 'Terms of Service | Intense Learners',
    description: 'Fair, transparent terms for a safe learning experience.',
    type: 'website',
  },
};

const sections = [
  { id: 'intro',         label: '1. Acceptance of Terms'              },
  { id: 'eligibility',   label: '2. Eligibility & Account Creation'   },
  { id: 'roles',         label: '3. Student & Teacher Roles'          },
  { id: 'teacher-code',  label: '4. Teacher Registration Code'        },
  { id: 'content',       label: '5. Content & Intellectual Property'  },
  { id: 'conduct',       label: '6. Acceptable Use Policy'            },
  { id: 'video',         label: '7. Video Library & YouTube'          },
  { id: 'payments',      label: '8. Orders & Payments'                },
  { id: 'ai',            label: '9. AI-Assisted Features'             },
  { id: 'availability',  label: '10. Platform Availability'           },
  { id: 'termination',   label: '11. Suspension & Termination'        },
  { id: 'disclaimers',   label: '12. Disclaimers & Warranty'          },
  { id: 'liability',     label: '13. Limitation of Liability'         },
  { id: 'governing-law', label: '14. Governing Law'                   },
  { id: 'changes',       label: '15. Changes to These Terms'          },
  { id: 'contact',       label: '16. Contact Us'                      },
];

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      icon={<FileText className="w-7 h-7 text-white" />}
      lastUpdated="June 16, 2026"
      sections={sections}
    >

      <section id="intro">
        <h2>1. Acceptance of Terms</h2>
        <p>
          Welcome to <strong>Intense Learners</strong>! These Terms of Service ("Terms") govern your access to and use of our
          online coaching and learning platform available at{' '}
          <a href="https://intense-learners.vercel.app/" target="_blank" rel="noopener noreferrer">
            intense-learners.vercel.app
          </a>.
        </p>
        <p>
          By creating an account, signing in, or using any part of the Platform, you agree to be bound by these Terms and our{' '}
          <a href="/privacy-policy">Privacy Policy</a>. If you do not agree, please do not use the Platform.
        </p>
        <div className="callout callout-info">
          <p>
            <strong>📌 Quick summary:</strong> These terms are designed to create a safe, fair, and productive learning
            environment. We encourage you to read them carefully.
          </p>
        </div>
      </section>

      <section id="eligibility">
        <h2>2. Eligibility &amp; Account Creation</h2>
        <h3>2.1 Who Can Use the Platform</h3>
        <ul>
          <li>Students of all ages (with parental consent for minors under 13)</li>
          <li>Teachers who have been vetted and provided a valid registration code</li>
          <li>Anyone providing accurate and truthful information during registration</li>
        </ul>

        <h3>2.2 Account Responsibilities</h3>
        <ul>
          <li>You are <strong>solely responsible</strong> for maintaining the confidentiality of your password</li>
          <li>You are <strong>responsible</strong> for all activity that occurs under your account</li>
          <li>You must <strong>notify us immediately</strong> of any unauthorised use of your account</li>
          <li>You must provide <strong>accurate and complete</strong> information during registration</li>
          <li>You must keep your account information <strong>up-to-date</strong></li>
        </ul>
        <div className="callout callout-warn">
          <p>
            <strong>⚠️ Important:</strong> Never share your account credentials with anyone.
            Intense Learners will never ask for your password.
          </p>
        </div>
      </section>

      <section id="roles">
        <h2>3. Student &amp; Teacher Roles</h2>

        <h3>3.1 Student Accounts</h3>
        <ul>
          <li>Access to video lectures, notes, and assignments</li>
          <li>Ability to raise doubts and get answers from teachers</li>
          <li>Track learning progress and performance</li>
          <li>Bookmark and save content for later</li>
          <li>Submit assignments and take quizzes</li>
          <li>View and download certificates upon course completion</li>
        </ul>

        <h3>3.2 Teacher Accounts</h3>
        <ul>
          <li>Create and manage video folders, notes, and assignments</li>
          <li>Respond to student doubts and queries</li>
          <li>Manage teaching schedules and live class sessions</li>
          <li>Communicate with students and other teachers via chat</li>
          <li>Access student progress analytics and engagement metrics</li>
          <li>Upload and organise course content via AI-powered assistant</li>
        </ul>

        <div className="callout callout-error">
          <p>
            <strong>🚫 Prohibited:</strong> Attempting to access another user's private data, impersonating a different role,
            or bypassing role-based restrictions is strictly prohibited and will result in account termination.
          </p>
        </div>
      </section>

      <section id="teacher-code">
        <h2>4. Teacher Registration Code</h2>
        <p>
          To register as a Teacher on Intense Learners, you must enter a <strong>valid teacher registration code</strong>{' '}
          provided by Intense Learners administration. This ensures only <strong>authorised, vetted individuals</strong>{' '}
          become teachers, maintaining the quality and reliability of education on the platform.
        </p>
        <div className="callout callout-warn">
          <p>
            <strong>⚠️ Warning:</strong> Sharing the registration code with unauthorised individuals is a violation of these
            Terms and may result in immediate account termination.
          </p>
        </div>
      </section>

      <section id="content">
        <h2>5. Content &amp; Intellectual Property</h2>

        <h3>5.1 Platform Content</h3>
        <p>
          Platform branding, design, software, original written content, graphics, and logos are owned by Intense Learners
          and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without
          our explicit written permission.
        </p>

        <h3>5.2 Teacher-Submitted Content</h3>
        <p>
          Teachers retain ownership of their content (notes, assignments, videos). By uploading content, teachers grant us a
          <strong> non-exclusive, royalty-free licence</strong> to host, display, and distribute it to students enrolled on the platform.
        </p>

        <h3>5.3 Student-Submitted Content</h3>
        <p>
          Students retain ownership of their submissions, doubt posts, and replies. However, they grant us and the relevant teacher a licence
          to view, store, and process it for grading, feedback, and platform operation.
        </p>

        <h3>5.4 Reporting Infringement</h3>
        <p>
          If you believe content on the Platform infringes your intellectual property rights, contact us at{' '}
          <a href="mailto:saquibnadeem0@gmail.com">saquibnadeem0@gmail.com</a> with full details and we'll investigate promptly.
        </p>
      </section>

      <section id="conduct">
        <h2>6. Acceptable Use Policy</h2>
        <p>You agree to use the Platform responsibly and <strong>NOT</strong> to:</p>
        <ul>
          <li>❌ Use the Platform for any <strong>unlawful purpose</strong></li>
          <li>❌ Upload or share <strong>defamatory, obscene, harassing, or hateful</strong> content</li>
          <li>❌ Attempt to <strong>gain unauthorised access</strong> to accounts or data</li>
          <li>❌ <strong>Scrape, crawl, or extract</strong> data using automated tools</li>
          <li>❌ <strong>Misrepresent</strong> your identity, role, or affiliation</li>
          <li>❌ Use AI tools to <strong>generate or distribute plagiarised</strong> content</li>
          <li>❌ <strong>Impersonate</strong> another user or entity</li>
          <li>❌ <strong>Distribute malware</strong> or malicious code</li>
          <li>❌ <strong>Disrupt</strong> the platform's infrastructure or performance</li>
          <li>❌ <strong>Share or distribute</strong> content without proper authorisation</li>
        </ul>
        <div className="callout callout-error">
          <p>
            <strong>⚠️ Consequences:</strong> Violations may result in content removal, account suspension, or permanent
            termination at our sole discretion.
          </p>
        </div>
      </section>

      <section id="video">
        <h2>7. Video Library &amp; YouTube Content</h2>
        <p>
          Our lecture videos are sourced from the official Intense Learners YouTube channel
          (<a href="https://youtube.com/@intense_learners" target="_blank" rel="noopener noreferrer">@intense_learners</a>) and embedded for in-platform playback.
        </p>
        <ul>
          <li>All videos are <strong>carefully curated</strong> for quality and relevance</li>
          <li>Playback is subject to <strong>YouTube's Terms of Service</strong></li>
          <li>You may <strong>not download or redistribute</strong> videos outside the platform</li>
          <li>Videos are for <strong>personal learning only</strong></li>
          <li>Teachers can add <strong>supplementary content</strong> to video folders</li>
        </ul>
      </section>

      <section id="payments">
        <h2>8. Orders &amp; Payments</h2>
        <p>Certain features, such as hardcopy notes, require payment.</p>

        <h3>8.1 Payment Methods</h3>
        <ul>
          <li><strong>QR Code (UPI):</strong> Scan, pay, and upload proof of payment for verification</li>
          <li><strong>Cash on Delivery (COD):</strong> Pay at the time of delivery for eligible locations</li>
        </ul>

        <h3>8.2 Order Processing</h3>
        <ul>
          <li>All orders are <strong>reviewed manually</strong> by administrators</li>
          <li>Orders may be <strong>approved or rejected</strong> based on payment verification</li>
          <li>Rejected orders will have a clear <strong>reason provided</strong></li>
          <li>Refunds are handled according to our <a href="/refund-policy">Refund Policy</a></li>
        </ul>

        <div className="callout callout-warn">
          <p>
            <strong>💳 Tip:</strong> Always keep your payment confirmation and transaction / UTR reference number
            as proof of payment.
          </p>
        </div>
      </section>

      <section id="ai">
        <h2>9. AI-Assisted Features</h2>
        <p>The Platform includes AI-assisted features powered by Groq (Llama) to enhance learning:</p>
        <ul>
          <li><strong>AI Assistant:</strong> Helps teachers with content creation, grading, and analytics</li>
          <li><strong>AI Chatbot:</strong> Answers student queries about courses, enrollments, and general platform use</li>
          <li><strong>Contact Page AI:</strong> Provides instant answers to common questions 24/7</li>
        </ul>
        <div className="callout callout-warn">
          <p>
            <strong>⚠️ Important disclaimer:</strong> AI-generated content may occasionally be inaccurate or incomplete.
            <strong> Always verify</strong> AI-generated content before relying on it for academic decisions.
          </p>
        </div>
      </section>

      <section id="availability">
        <h2>10. Platform Availability &amp; Modifications</h2>
        <ul>
          <li>We aim for <strong>high uptime</strong> but do not guarantee uninterrupted access</li>
          <li>We may perform <strong>scheduled maintenance</strong> — notice will be provided where possible</li>
          <li>We may <strong>modify, suspend, or discontinue</strong> features at any time</li>
          <li>We reserve the right to <strong>update content and materials</strong> to ensure quality</li>
        </ul>
      </section>

      <section id="termination">
        <h2>11. Account Suspension &amp; Termination</h2>
        <p>We may suspend or terminate your account if you violate these Terms, engage in fraudulent or harmful activity,
        share your account credentials, misuse the Platform, or if required by law.</p>
        <p>You may also <strong>request account deletion</strong> at any time by contacting us. Upon termination:</p>
        <ul>
          <li>Your right to use the Platform ceases immediately</li>
          <li>Certain data may be retained as per our Privacy Policy</li>
          <li>Any pending orders will be cancelled</li>
          <li>Refunds will be processed according to our Refund Policy</li>
        </ul>
      </section>

      <section id="disclaimers">
        <h2>12. Disclaimers &amp; Warranty</h2>
        <div className="callout callout-warn">
          <p>
            The Platform and all content are provided <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> without
            warranties of any kind. We do not warrant that the Platform will be error-free, guarantee specific learning outcomes
            or exam results, or accept responsibility for third-party content (e.g., YouTube). We make no warranties about the
            accuracy or completeness of content.
          </p>
        </div>
      </section>

      <section id="liability">
        <h2>13. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, <strong>Intense Learners</strong> shall not be liable for any indirect,
        incidental, special, or consequential damages; loss of data, revenue, or profits; inability to use the Platform;
        actions of other users; or content accuracy or reliability.</p>
        <p>
          Our total liability for any claim relating to the Platform shall not exceed the amount you paid to us in the
          preceding 12 months.
        </p>
      </section>

      <section id="governing-law">
        <h2>14. Governing Law &amp; Jurisdiction</h2>
        <p>
          These Terms are governed by the laws of <strong>India</strong>, without regard to conflict-of-law principles.
          Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction
          of the competent courts in <strong>Delhi, India</strong>. We encourage dispute resolution via arbitration
          before litigation where possible.
        </p>
      </section>

      <section id="changes">
        <h2>15. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Changes will be communicated through a platform notification,
          email notification (for material changes), and an updated "Last Updated" date. Continued use of the Platform
          after changes take effect constitutes your acceptance of the revised Terms.
        </p>
      </section>

      <section id="contact">
        <h2>16. Contact Us</h2>
        <p>If you have questions about these Terms, please reach out:</p>
        <ul>
          <li><strong>📧 Email:</strong> <a href="mailto:saquibnadeem0@gmail.com">saquibnadeem0@gmail.com</a></li>
          <li><strong>📱 Instagram:</strong> <a href="https://www.instagram.com/intense_learners" target="_blank" rel="noopener noreferrer">@intense_learners</a></li>
          <li><strong>📘 Facebook:</strong> <a href="https://www.facebook.com/share/1E77DTHG5w/" target="_blank" rel="noopener noreferrer">Intense Learners</a></li>
          <li><strong>🌐 Platform:</strong> <a href="https://intense-learners.vercel.app/" target="_blank" rel="noopener noreferrer">intense-learners.vercel.app</a></li>
        </ul>
      </section>

    </LegalPageLayout>
  );
}