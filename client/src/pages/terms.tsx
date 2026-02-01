import { LegalPageLayout } from "@/components/legal-page-layout";

export default function TermsPage() {
  return (
    <LegalPageLayout title="Flacron Enterprises LLC — Terms & Conditions" lastUpdated="January 1, 2026">
      <p>
        These Terms & Conditions govern your access to and use of our websites, web apps, mobile apps, and related services (the &quot;Services&quot;) operated by Flacron Enterprises LLC (&quot;Flacron,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By accessing or using the Services, you agree to these Terms.
      </p>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">1. Eligibility</h2>
      <p>You must be at least 13 years old (or older if required in your jurisdiction) to use the Services.</p>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">2. Accounts</h2>
      <p>You may be required to create an account. You agree to provide accurate information, keep your credentials secure, and notify us of unauthorized access. You are responsible for activity under your account.</p>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">3. Acceptable Use</h2>
      <p>You agree not to use the Services for illegal activity; attempt to hack, disrupt, reverse engineer, or misuse the Services; upload malware or harmful code; infringe intellectual property rights; harass, abuse, or harm others. We may suspend or terminate access for violations.</p>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">4. Subscriptions & Payments</h2>
      <p>If the Services include paid plans: prices and billing cycles are shown at purchase; subscriptions may auto-renew unless canceled; taxes may apply. Payments may be handled by third-party processors (Apple, Google, Stripe, etc.).</p>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">5. AI Features and Outputs</h2>
      <p>Some Services may use AI to generate suggestions, content, or automated outputs. You understand that AI outputs may be inaccurate or incomplete; you are responsible for verifying them; they are not professional advice (legal, medical, financial, etc.).</p>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">6. Intellectual Property</h2>
      <p>All rights in the Services (software, designs, logos, trademarks, content) are owned by Flacron or its licensors. You may not copy, distribute, or create derivative works without permission.</p>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">7. User Content</h2>
      <p>If you submit content, you grant us a worldwide, non-exclusive license to host, store, reproduce, and display it solely to operate and improve the Services. You represent you have the rights to submit such content.</p>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">8. Service Availability</h2>
      <p>We strive to keep the Services available but do not guarantee uninterrupted access. We may modify or discontinue features at any time.</p>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">9. Disclaimer of Warranties</h2>
      <p>The Services are provided &quot;AS IS&quot; and &quot;AS AVAILABLE,&quot; without warranties of any kind, express or implied.</p>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">10. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, Flacron is not liable for indirect, incidental, consequential, special, or punitive damages, or any loss of profits, revenue, data, or goodwill arising from your use of the Services.</p>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">11. Termination</h2>
      <p>We may suspend or terminate your access at any time if you violate these Terms. You may stop using the Services at any time.</p>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">12. Governing Law</h2>
      <p>These Terms are governed by the laws of the United States, without regard to conflict-of-law principles.</p>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">13. Contact</h2>
      <p>Email: <a href="mailto:contact@flacronenterprises.com" className="text-orange-500 hover:underline">contact@flacronenterprises.com</a></p>
    </LegalPageLayout>
  );
}
