import { LegalPageLayout } from "@/components/legal-page-layout";

export default function DisclaimerPage() {
  return (
    <LegalPageLayout title="Flacron Enterprises LLC — Disclaimer" lastUpdated="January 1, 2026">
      <p>The content and features provided through our Services are for general informational purposes only.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">1. No Professional Advice</h2>
      <p>We do not provide legal, medical, financial, insurance, or professional advice. Any information or AI-generated output should not be treated as a substitute for professional advice.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">2. AI Output Disclaimer</h2>
      <p>Some features may generate outputs using AI. These outputs may contain errors or inaccuracies, may not be complete or up to date, and require user review before use. You are responsible for how you interpret and use AI-generated results.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">3. External Links</h2>
      <p>Our Services may contain links to third-party sites. We are not responsible for their content or practices.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">4. Use at Your Own Risk</h2>
      <p>Your use of the Services is at your own risk. We make no warranties regarding outcomes, accuracy, or reliability.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">5. Contact</h2>
      <p>Email: <a href="mailto:contact@flacronenterprises.com" className="text-orange-500 hover:underline">contact@flacronenterprises.com</a></p>
    </LegalPageLayout>
  );
}
