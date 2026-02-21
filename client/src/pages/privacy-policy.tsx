import { LegalPageLayout } from "@/components/legal-page-layout";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Flacron Enterprises LLC — Privacy Policy" lastUpdated="January 1, 2026">
      <p>
        Flacron Enterprises LLC (“Flacron,” “we,” “our,” or “us”) operates multiple websites, web applications,
        software platforms, and mobile applications (collectively, the “Services”). This Privacy Policy explains how
        we collect, use, disclose, and safeguard information when you access or use any of our Services.
      </p>
      <p>By using the Services, you agree to the collection and use of information in accordance with this Privacy Policy.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">1. Information We Collect</h2>
      <p>We may collect the following categories of information:</p>
      <h3 className="text-lg font-medium mt-4 mb-1">A. Information you provide</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>Name, username, and profile information</li>
        <li>Email address and phone number</li>
        <li>Account login credentials (stored securely)</li>
        <li>Messages, requests, or content you submit through the Services</li>
        <li>Customer support communications</li>
      </ul>
      <h3 className="text-lg font-medium mt-4 mb-1">B. Payment and subscription information</h3>
      <p>If you purchase a subscription or make a payment, we may collect billing-related information. Payments are typically processed by third-party payment processors (e.g., Stripe, Apple, Google), and we may receive transaction status and limited billing details (not full card numbers).</p>
      <h3 className="text-lg font-medium mt-4 mb-1">C. Automatically collected information</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>IP address and device identifiers</li>
        <li>Browser type, operating system, app version</li>
        <li>Pages/screens viewed, clicks, timestamps, and referring URLs</li>
        <li>Crash logs, diagnostics, and performance data</li>
        <li>Approximate location (derived from IP; not precise GPS unless you grant permission)</li>
      </ul>
      <h3 className="text-lg font-medium mt-4 mb-1">D. Cookies and similar technologies</h3>
      <p>We use cookies and similar technologies for functionality, analytics, and preferences. See the Cookie Policy for details.</p>
      <h3 className="text-lg font-medium mt-4 mb-1">E. Third-party information</h3>
      <p>We may receive information from providers you connect (e.g., “Sign in with Google/Apple”) or from analytics and advertising partners, where permitted.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">2. How We Use Your Information</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Provide, operate, and maintain the Services</li>
        <li>Create and manage user accounts</li>
        <li>Process payments, subscriptions, and transactions</li>
        <li>Improve features, performance, and user experience</li>
        <li>Communicate with you about updates, security notices, and support</li>
        <li>Prevent fraud, abuse, and unauthorized access</li>
        <li>Comply with legal obligations and enforce our terms</li>
      </ul>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">3. How We Share Your Information</h2>
      <p>We do not sell your personal information. We may share information with: service providers (hosting, analytics, email delivery, customer support tools); payment processors; legal and compliance when required by law; business transfers (you will be notified where required).</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">4. Data Retention</h2>
      <p>We retain information only as long as necessary to provide the Services, meet legal/accounting requirements, and resolve disputes. You may request deletion where applicable.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">5. Security</h2>
      <p>We use reasonable administrative, technical, and organizational safeguards. No method of transmission or storage is 100% secure.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">6. Your Privacy Rights</h2>
      <p>Depending on your location, you may have rights to access, correct, delete, object to processing, or request data portability. To exercise these rights, contact us at <a href="mailto:contact@flacronenterprises.com" className="text-orange-500 hover:underline">contact@flacronenterprises.com</a></p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">7. Children’s Privacy</h2>
      <p>Our Services are not directed to children under 13. We do not knowingly collect personal data from children. Contact us to request deletion if you believe a child has provided information.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">8. International Users</h2>
      <p>If you access our Services from outside the United States, your information may be processed and stored in the United States or other jurisdictions where our service providers operate.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">9. Third-Party Links</h2>
      <p>Our Services may include links to third-party websites or services. We are not responsible for their privacy practices.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">10. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. The updated version will be posted with a revised “Last updated” date.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">11. Contact Us</h2>
      <p>Flacron Enterprises LLC — Email: <a href="mailto:contact@flacronenterprises.com" className="text-orange-500 hover:underline">contact@flacronenterprises.com</a> — Website: <a href="https://flacronenterprises.com/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">https://flacronenterprises.com/</a></p>
    </LegalPageLayout>
  );
}
