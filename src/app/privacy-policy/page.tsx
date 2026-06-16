// app/privacy-policy/page.tsx
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Intense Learners - Your Data Security Matters',
  description: 'Learn how Intense Learners protects your personal data, handles payments, and ensures your privacy while learning online.',
  keywords: 'privacy policy, data protection, online coaching privacy, student data security, Intense Learners',
  openGraph: {
    title: 'Privacy Policy | Intense Learners',
    description: 'Your privacy matters. Read how we protect your data.',
    type: 'website',
  },
};

const sections = [
  { id: 'intro',          label: '1. Introduction & Commitment'          },
  { id: 'data-collect',   label: '2. What Data We Collect'               },
  { id: 'how-we-use',     label: '3. How We Use Your Data'               },
  { id: 'oauth',          label: '4. Google Sign-In & Auth'              },
  { id: 'payments',       label: '5. Payments & Orders'                  },
  { id: 'video',          label: '6. Video & YouTube Integration'        },
  { id: 'sharing',        label: '7. Data Sharing & Disclosure'          },
  { id: 'storage',        label: '8. Storage & Security'                 },
  { id: 'retention',      label: '9. Data Retention'                     },
  { id: 'rights',         label: '10. Your Privacy Rights'               },
  { id: 'children',       label: "11. Children's Privacy"                },
  { id: 'cookies',        label: '12. Cookie Usage'                      },
  { id: 'changes',        label: '13. Policy Updates'                    },
  { id: 'contact',        label: '14. Contact Us'                        },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      icon={<Shield className="w-7 h-7 text-white" />}
      lastUpdated="June 16, 2026"
      sections={sections}
    >

      <section id="intro">
        <h2>1. Introduction &amp; Our Commitment</h2>
        <p>
          At <strong>Intense Learners</strong>, your privacy is a top priority. This Privacy Policy explains how we collect,
          use, disclose, and safeguard your information when you use our online coaching and learning platform. We are committed
          to protecting your personal data and being fully transparent about our practices.
        </p>
        <div className="callout callout-info">
          <p>
            <strong>📌 Quick summary:</strong> We collect only what's necessary for your learning experience. We never sell
            your data to third parties. You have full control over your information at all times.
          </p>
        </div>
        <p>
          By creating an account or using the Platform, you agree to this Privacy Policy. If you do not agree, please do not
          use the Platform.
        </p>
      </section>

      <section id="data-collect">
        <h2>2. What Data We Collect</h2>

        <h3>2.1 Account Information</h3>
        <ul>
          <li><strong>Full Name</strong> — For identification and certificate generation</li>
          <li><strong>Email Address</strong> — For account management, notifications, and password recovery</li>
          <li><strong>Password</strong> — Stored using bcrypt hashing (never in plain text)</li>
          <li><strong>Phone Number</strong> — Optional; used for order delivery and urgent communications</li>
          <li><strong>Date of Birth</strong> — To verify age and personalise learning content</li>
          <li><strong>Profile Photo</strong> — Optional; for personalising your account</li>
          <li><strong>Location</strong> — Optional; for localised content and timezone adjustment</li>
        </ul>

        <h3>2.2 Teacher-Specific Information</h3>
        <ul>
          <li><strong>Qualifications &amp; Experience</strong> — To verify teaching credentials</li>
          <li><strong>Subjects &amp; Specialisation</strong> — To match with students effectively</li>
          <li><strong>Teaching Style</strong> — To help students choose the right teacher</li>
          <li><strong>Content Uploads</strong> — Notes, assignments, video folders, schedules</li>
          <li><strong>Chat Messages</strong> — Communications with students and other teachers</li>
          <li><strong>Social Media Links</strong> — Optional; for professional networking</li>
        </ul>

        <h3>2.3 Student-Specific Information</h3>
        <ul>
          <li><strong>Enrollments</strong> — Courses you're enrolled in</li>
          <li><strong>Assignment Submissions</strong> — Your work submitted for grading</li>
          <li><strong>Quiz / Test Results</strong> — For performance tracking</li>
          <li><strong>Doubts &amp; Questions</strong> — Your queries and their resolutions</li>
          <li><strong>Bookmarks</strong> — Saved notes and videos for easy access</li>
          <li><strong>Watch History</strong> — Video progress data for the "continue watching" feature</li>
        </ul>

        <h3>2.4 Technical &amp; Usage Data</h3>
        <ul>
          <li><strong>IP Address</strong> — For security and abuse prevention</li>
          <li><strong>Browser Type &amp; Version</strong> — For compatibility optimisation</li>
          <li><strong>Device Information</strong> — For responsive design improvements</li>
          <li><strong>Pages Visited</strong> — To improve platform navigation and UX</li>
          <li><strong>Time Spent</strong> — For engagement analytics</li>
        </ul>
      </section>

      <section id="how-we-use">
        <h2>3. How We Use Your Data</h2>
        <p>We use your data to provide, improve, and personalise your learning experience:</p>
        <ul>
          <li>✅ <strong>Create and manage</strong> your account</li>
          <li>✅ <strong>Authenticate</strong> your identity when you sign in</li>
          <li>✅ <strong>Provide core features</strong> — assignments, notes, video lectures, quizzes, teacher–student chat</li>
          <li>✅ <strong>Process orders</strong> — Notes (hardcopy), course fees, and payments</li>
          <li>✅ <strong>Track learning progress</strong> — Video watch %, completed assignments, quiz scores</li>
          <li>✅ <strong>Generate certificates</strong> — Upon course completion</li>
          <li>✅ <strong>Send notifications</strong> — Assignment deadlines, new content, important updates</li>
          <li>✅ <strong>Respond to support requests</strong> — Via email or contact form</li>
          <li>✅ <strong>Detect and prevent</strong> — Fraud, abuse, and Terms of Service violations</li>
          <li>✅ <strong>Improve the platform</strong> — Analytics and experience optimisation</li>
        </ul>
        <div className="callout callout-success">
          <p>
            <strong>✅ We DO NOT:</strong> Sell your data to third parties, use your data for advertising, or share your
            personal information with unauthorised parties.
          </p>
        </div>
      </section>

      <section id="oauth">
        <h2>4. Google Sign-In &amp; Authentication</h2>
        <p>
          We offer "Sign in with Google" for quick and secure authentication. When you use it, Google shares your
          <strong> name, email address, and profile picture</strong> with us (as permitted by your Google settings). We
          <strong> do not receive</strong> your Google password and do <strong>not access</strong> other Google services
          (Gmail, Drive, Calendar, etc.). You can <strong>revoke access</strong> at any time from your Google Account
          security settings.
        </p>
        <div className="callout callout-warn">
          <p>
            <strong>🔐 Security tip:</strong> Always use a strong password for your Google account and enable
            two-factor authentication for maximum security.
          </p>
        </div>
      </section>

      <section id="payments">
        <h2>5. Payments &amp; Order Processing</h2>
        <p>We process payments and orders through the following methods:</p>

        <h3>5.1 Payment Methods</h3>
        <ul>
          <li><strong>QR Code (UPI) Payment:</strong> Scan the QR code using your UPI app, complete the payment, and upload the payment confirmation screenshot.</li>
          <li><strong>Cash on Delivery (COD):</strong> Available for eligible locations — pay when your item is delivered.</li>
        </ul>

        <h3>5.2 What We Collect for Orders</h3>
        <ul>
          <li><strong>Delivery Address</strong> — Full address with PIN code</li>
          <li><strong>Phone Number</strong> — For delivery coordination</li>
          <li><strong>Order Details</strong> — Items, quantity, total amount</li>
          <li><strong>Payment Proof</strong> — Transaction screenshot or photo</li>
          <li><strong>Order Status</strong> — Pending, Approved, Rejected, or Delivered</li>
        </ul>

        <div className="callout callout-error">
          <p>
            <strong>⚠️ Never share:</strong> We will <strong>NEVER</strong> ask for your UPI PIN, CVV, OTP, or
            net-banking password. If anyone claims to be from Intense Learners and asks for this, report it immediately.
          </p>
        </div>
      </section>

      <section id="video">
        <h2>6. Video Learning &amp; YouTube Integration</h2>
        <p>
          All lecture videos are sourced from the official Intense Learners YouTube channel and embedded for seamless learning.
          We track <strong>watch progress</strong> (percentage watched, watch time, last position) linked to your account.
          Teachers receive <strong>anonymised engagement statistics</strong>. Students can <strong>resume</strong> videos
          from where they left off. YouTube's own policies apply to video playback — see{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a>{' '}
          for more details.
        </p>
      </section>

      <section id="sharing">
        <h2>7. Data Sharing &amp; Disclosure</h2>
        <p>We share your data only in these limited circumstances:</p>
        <ul>
          <li><strong>With your teacher / students:</strong> As part of normal platform operation (e.g., a teacher sees student submissions)</li>
          <li><strong>Service providers:</strong> Trusted third-party services for hosting, database, file storage, email, and caching</li>
          <li><strong>Legal compliance:</strong> If required by law, regulation, or legal process</li>
          <li><strong>Business transfers:</strong> In case of merger, acquisition, or sale of assets</li>
        </ul>
        <div className="callout callout-success">
          <p><strong>✅ We DO NOT share</strong> your data with third parties for their own marketing or advertising purposes.</p>
        </div>
      </section>

      <section id="storage">
        <h2>8. Data Storage &amp; Security Measures</h2>
        <p>We implement multiple layers of security to protect your data:</p>
        <ul>
          <li><strong>Encryption:</strong> Data encrypted in transit (HTTPS/TLS) and at rest</li>
          <li><strong>Password Hashing:</strong> bcrypt one-way hashing — never stored in plain text</li>
          <li><strong>Access Control:</strong> Only authorised personnel can access admin systems</li>
          <li><strong>Infrastructure:</strong> Hosted on Vercel with PostgreSQL on Neon (both SOC 2 compliant)</li>
          <li><strong>File Storage:</strong> Uploaded files secured via UploadThing with encrypted URLs</li>
          <li><strong>Regular Audits:</strong> Periodic security reviews and vulnerability assessments</li>
        </ul>
        <div className="callout callout-info">
          <p>
            <strong>🔒 Security note:</strong> While we implement robust security measures, no system is 100% secure.
            Please use strong, unique passwords and enable 2FA where available.
          </p>
        </div>
      </section>

      <section id="retention">
        <h2>9. Data Retention Policy</h2>
        <p>We retain your data based on the following principles:</p>
        <ul>
          <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
          <li><strong>Order Records:</strong> Payment and order history retained for 5 years (or as required by law) for accounting and tax purposes</li>
          <li><strong>Communication History:</strong> Support chats and emails retained for 2 years</li>
          <li><strong>Learning Records:</strong> Assignment submissions and quiz results retained for 3 years</li>
          <li><strong>Account Deletion:</strong> Upon request, most data is deleted within 30 days (except records legally required to be kept)</li>
        </ul>
      </section>

      <section id="rights">
        <h2>10. Your Privacy Rights</h2>
        <p>Under applicable data protection laws, you have the following rights:</p>
        <ul>
          <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
          <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data (most data can be updated from your account settings)</li>
          <li><strong>Right to Erasure:</strong> Request deletion of your account and associated data</li>
          <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
          <li><strong>Right to Data Portability:</strong> Receive your data in a machine-readable format</li>
          <li><strong>Right to Object:</strong> Object to certain types of data processing</li>
          <li><strong>Right to Withdraw Consent:</strong> Revoke consent for data processing at any time</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:saquibnadeem0@gmail.com">saquibnadeem0@gmail.com</a>. We'll respond within{' '}
          <strong>30 days</strong> and may verify your identity first.
        </p>
      </section>

      <section id="children">
        <h2>11. Children's Privacy &amp; Parental Consent</h2>
        <p>
          Intense Learners is an educational platform used by students of all ages. We have special provisions for minor users:
        </p>
        <ul>
          <li>We collect only <strong>necessary data</strong> to provide educational services</li>
          <li><strong>Parental consent</strong> is required for users under the age of 13 (or the age of majority in your jurisdiction)</li>
          <li>Parents / guardians can <strong>review, modify, or delete</strong> their child's data on request</li>
          <li>We <strong>do not target</strong> children with advertising or marketing</li>
        </ul>
        <div className="callout callout-warn">
          <p>
            <strong>👨‍👩‍👧 For parents:</strong> You have the right to monitor your child's account.
            Contact us at saquibnadeem0@gmail.com for any concerns about your child's data.
          </p>
        </div>
      </section>

      <section id="cookies">
        <h2>12. Cookie Usage</h2>
        <p>
          We use cookies and similar technologies to improve your experience. For full details, see our{' '}
          <a href="/cookie-policy">Cookie Policy</a>.
        </p>
        <ul>
          <li><strong>Essential Cookies:</strong> Authentication (keep you signed in), CSRF protection, session management</li>
          <li><strong>Local Storage:</strong> Dark/light mode preference, recently watched videos, draft content</li>
          <li><strong>No Tracking:</strong> We do not use third-party tracking cookies for advertising</li>
        </ul>
      </section>

      <section id="changes">
        <h2>13. Policy Updates</h2>
        <p>
          We may update this Privacy Policy from time to time. When we do, we'll change the "Last Updated" date.
          For material changes, we'll notify you via email notification, a notice on the platform dashboard, and/or a social
          media announcement. Continued use of the platform after changes constitutes your acceptance of the revised policy.
        </p>
      </section>

      <section id="contact">
        <h2>14. Contact Us</h2>
        <p>We're here to help! If you have questions about this Privacy Policy, your data, or our practices:</p>
        <ul>
          <li><strong>📧 Email:</strong> <a href="mailto:saquibnadeem0@gmail.com">saquibnadeem0@gmail.com</a></li>
          <li><strong>📱 Instagram:</strong> <a href="https://www.instagram.com/intense_learners" target="_blank" rel="noopener noreferrer">@intense_learners</a></li>
          <li><strong>📘 Facebook:</strong> <a href="https://www.facebook.com/share/1E77DTHG5w/" target="_blank" rel="noopener noreferrer">Intense Learners</a></li>
          <li><strong>📍 Location:</strong> Delhi, India (available online globally)</li>
        </ul>
        <div className="callout callout-info">
          <p><strong>⏰ Response time:</strong> We aim to respond to all enquiries within 24–48 business hours.</p>
        </div>
      </section>

    </LegalPageLayout>
  );
}