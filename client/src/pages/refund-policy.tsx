import { LegalPageLayout } from "@/components/legal-page-layout";

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Flacron Enterprises LLC — Refund & Cancellation Policy" lastUpdated="January 1, 2026">
      <p>
        This Refund & Cancellation Policy applies to all Flacron Enterprises LLC Services that offer paid
        subscriptions, one-time purchases, or premium features.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">1. Cancellations</h2>
      <p>You can cancel a subscription at any time through:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Your account settings (if available), or</li>
        <li>The platform where you subscribed (Apple App Store / Google Play), or</li>
        <li>By contacting support at <a href="mailto:contact@flacronenterprises.com" className="text-orange-500 hover:underline">contact@flacronenterprises.com</a></li>
      </ul>
      <p>
        After cancellation, you may continue to access paid features until the end of your billing period unless
        otherwise required by the platform.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">2. Refund Policy</h2>
      <p>Unless required by law, all payments are non-refundable, including:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Subscription fees already billed</li>
        <li>Partial subscription periods</li>
        <li>Unused time or unused features</li>
      </ul>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">3. Platform-Specific Refunds (Apple/Google)</h2>
      <p>If you subscribed through Apple or Google, refund requests must be handled directly through:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Apple App Store support</li>
        <li>Google Play support</li>
      </ul>
      <p>Their policies may control refund eligibility.</p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">4. Exceptions</h2>
      <p>We may consider refunds only in limited cases such as:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Duplicate charges</li>
        <li>Billing errors directly caused by us</li>
        <li>Proven technical failure preventing access (case-by-case)</li>
      </ul>
      <p>Refund requests must be submitted within 7 days of the charge and include:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Account email</li>
        <li>Transaction ID / receipt</li>
        <li>Reason for the request</li>
      </ul>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">5. Contact</h2>
      <p>Email: <a href="mailto:contact@flacronenterprises.com" className="text-orange-500 hover:underline">contact@flacronenterprises.com</a></p>
    </LegalPageLayout>
  );
}
