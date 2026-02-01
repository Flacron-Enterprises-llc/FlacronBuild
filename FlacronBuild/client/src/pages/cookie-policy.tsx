import { LegalPageLayout } from "@/components/legal-page-layout";

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout title="Flacron Enterprises LLC — Cookie Policy" lastUpdated="January 1, 2026">
      <p>This Cookie Policy explains how Flacron Enterprises LLC uses cookies and similar technologies in our Services.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">1. What Are Cookies?</h2>
      <p>Cookies are small text files stored on your device that help websites and apps function properly and improve your experience.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">2. Cookies We Use</h2>
      <p>We may use: <strong>Essential cookies</strong> (required for functionality, login, security); <strong>Preference cookies</strong> (remember settings and choices); <strong>Analytics cookies</strong> (understand usage and improve performance); <strong>Performance cookies</strong> (prevent crashes and improve speed).</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">3. Managing Cookies</h2>
      <p>You can control cookies through your browser settings. Disabling cookies may affect functionality.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">4. Third-Party Cookies</h2>
      <p>Some third-party services (analytics, advertising, embedded content) may set cookies. We do not control their cookies.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">5. Contact</h2>
      <p>Email: <a href="mailto:contact@flacronenterprises.com" className="text-orange-500 hover:underline">contact@flacronenterprises.com</a></p>
    </LegalPageLayout>
  );
}
