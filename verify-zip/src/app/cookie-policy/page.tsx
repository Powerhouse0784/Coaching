// app/cookie-policy/page.tsx
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { Cookie } from 'lucide-react';

export const metadata = {
  title: 'Cookie Policy | Intense Learners - How We Use Cookies',
  description: 'Learn about how Intense Learners uses cookies, local storage, and similar technologies to enhance your learning experience.',
  keywords: 'cookie policy, cookies, local storage, privacy, Intense Learners',
  openGraph: {
    title: 'Cookie Policy | Intense Learners',
    description: 'Learn about our cookie usage and how we respect your privacy.',
    type: 'website',
  },
};

const sections = [
  { id: 'intro',       label: '1. What Are Cookies'                  },
  { id: 'types',       label: '2. Types of Cookies We Use'           },
  { id: 'storage',     label: '3. Local Storage Usage'               },
  { id: 'third-party', label: '4. Third-Party Cookies'               },
  { id: 'control',     label: '5. Managing Your Cookie Preferences'  },
  { id: 'changes',     label: '6. Changes to This Policy'            },
  { id: 'contact',     label: '7. Contact Us'                        },
];

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      icon={<Cookie className="w-7 h-7 text-white" />}
      lastUpdated="June 16, 2026"
      sections={sections}
    >

      <section id="intro">
        <h2>1. What Are Cookies</h2>
        <p>
          <strong>Cookies</strong> are small text files that websites place on your device (computer, tablet, or smartphone)
          when you visit them. They help websites remember your preferences, keep you signed in, and improve your overall experience.
        </p>
        <div className="callout callout-info">
          <p>
            <strong>💡 Did you know?</strong> Cookies are essential for modern websites to work properly. They don't contain viruses
            or malicious code — they're simply a mechanism for websites to remember information about your visit.
          </p>
        </div>
        <p>At <strong>Intense Learners</strong>, we use cookies and similar technologies (like local storage) to:</p>
        <ul>
          <li>✅ Keep you signed in securely across sessions</li>
          <li>✅ Remember your preferences (e.g., dark/light mode)</li>
          <li>✅ Protect your account from unauthorised access via CSRF tokens</li>
          <li>✅ Track your learning progress and "continue watching" position</li>
          <li>✅ Improve platform performance and overall user experience</li>
        </ul>
      </section>

      <section id="types">
        <h2>2. Types of Cookies We Use</h2>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Cookie Name</th>
                <th>Purpose</th>
                <th>Type</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>next-auth.session-token</code></td>
                <td>Keeps you signed in and identifies your account (Student/Teacher) across page loads</td>
                <td>Strictly Necessary</td>
                <td>Session / up to 30 days</td>
              </tr>
              <tr>
                <td><code>next-auth.csrf-token</code></td>
                <td>Protects sign-in and sign-up forms against Cross-Site Request Forgery (CSRF) attacks</td>
                <td>Strictly Necessary</td>
                <td>Session</td>
              </tr>
              <tr>
                <td><code>next-auth.callback-url</code></td>
                <td>Redirects you to the right page after signing in with Google OAuth</td>
                <td>Strictly Necessary</td>
                <td>Short-lived (sign-in flow only)</td>
              </tr>
              <tr>
                <td><code>__Secure-next-auth.*</code></td>
                <td>Secure variants of the above cookies used in production (HTTPS) environments</td>
                <td>Strictly Necessary</td>
                <td>Session / up to 30 days</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="callout callout-success">
          <p>
            <strong>✅ No tracking cookies:</strong> We do <strong>NOT</strong> use advertising cookies, third-party analytics
            cookies, or cross-site tracking cookies. We never sell cookie data to advertisers or data brokers.
          </p>
        </div>
      </section>

      <section id="storage">
        <h2>3. Local Storage Usage</h2>
        <p>
          In addition to cookies, we use your browser's <strong>local storage</strong> to store non-sensitive preferences
          locally on your device:
        </p>
        <ul>
          <li><strong>🌙 Dark/Light Mode Preference:</strong> Remembers whether you prefer dark or light theme</li>
          <li><strong>📺 Video Progress:</strong> Stores your video watch position for "continue watching" functionality</li>
          <li><strong>📝 Draft Content:</strong> Temporarily saves assignment drafts and doubt posts to prevent data loss</li>
        </ul>
        <p>
          <strong>Important:</strong> Local storage data stays on your device and is <strong>never transmitted to our servers</strong>.
          You can clear it at any time through your browser's site data settings.
        </p>
        <div className="callout callout-warn">
          <p>
            <strong>🔧 How to clear local storage:</strong> In Chrome → Settings → Privacy &amp; Security → Clear Browsing Data → Cookies and Site Data.
          </p>
        </div>
      </section>

      <section id="third-party">
        <h2>4. Third-Party Cookies</h2>

        <h3>4.1 Google Sign-In</h3>
        <p>
          When you use "Sign in with Google", Google may set its own cookies to facilitate authentication. These are governed by{' '}
          <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer">
            Google's Cookie Policy
          </a>.
        </p>

        <h3>4.2 Embedded YouTube Videos</h3>
        <p>
          Our lecture videos use YouTube's embedded player. YouTube may set cookies for playback performance, abuse prevention,
          and video analytics. These are governed by{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a>.
          We do not control these cookies, but we use YouTube's privacy-enhanced mode where available.
        </p>

        <h3>4.3 UploadThing (File Storage)</h3>
        <p>
          We use UploadThing for secure file uploads (notes, assignments, avatars). UploadThing may set technical cookies
          related to upload sessions. These are strictly functional and do not track your activity beyond the upload process.
        </p>

        <div className="callout callout-info">
          <p>
            <strong>💡 Note:</strong> We carefully vet all third-party services we use and only partner with providers
            that maintain high privacy and security standards.
          </p>
        </div>
      </section>

      <section id="control">
        <h2>5. Managing Your Cookie Preferences</h2>
        <p>
          You have <strong>full control</strong> over cookies. Most browsers allow you to view, delete, block, and set
          preferences for cookies from specific websites.
        </p>

        <h3>Browser Settings — Quick Access</h3>
        <ul>
          <li><strong>Google Chrome:</strong> Settings → Privacy &amp; Security → Cookies and Site Data</li>
          <li><strong>Mozilla Firefox:</strong> Options → Privacy &amp; Security → Cookies and Site Data</li>
          <li><strong>Apple Safari:</strong> Preferences → Privacy → Manage Website Data</li>
          <li><strong>Microsoft Edge:</strong> Settings → Cookies and Permissions → Manage and Delete Cookies</li>
          <li><strong>Opera:</strong> Settings → Advanced → Privacy &amp; Security → Site Settings → Cookies</li>
        </ul>

        <div className="callout callout-error">
          <p>
            <strong>⚠️ Important:</strong> Blocking <strong>strictly necessary</strong> cookies will prevent you from signing in
            and using the Platform's core features. You won't be able to access your dashboard, view courses, or track progress.
          </p>
        </div>
      </section>

      <section id="changes">
        <h2>6. Changes to This Policy</h2>
        <p>
          We may update this Cookie Policy as our use of cookies evolves. Changes will be reflected by an updated "Last updated"
          date, a platform notification for significant changes, and email notification where appropriate. Continued use of the
          platform after updates means you accept the revised policy.
        </p>
      </section>

      <section id="contact">
        <h2>7. Contact Us</h2>
        <p>Questions about our Cookie Policy? Reach out:</p>
        <ul>
          <li><strong>📧 Email:</strong> <a href="mailto:saquibnadeem0@gmail.com">saquibnadeem0@gmail.com</a></li>
          <li><strong>📱 Instagram:</strong> <a href="https://www.instagram.com/intense_learners" target="_blank" rel="noopener noreferrer">@intense_learners</a></li>
          <li><strong>📘 Facebook:</strong> <a href="https://www.facebook.com/share/1E77DTHG5w/" target="_blank" rel="noopener noreferrer">Intense Learners</a></li>
        </ul>
      </section>

    </LegalPageLayout>
  );
}