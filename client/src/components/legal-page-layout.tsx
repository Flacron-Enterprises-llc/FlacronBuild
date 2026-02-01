import Header from "@/components/header";
import { Link } from "wouter";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" className="text-sm text-orange-500 hover:text-orange-600 mb-6 inline-block">
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: {lastUpdated}</p>
        <article className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          {children}
        </article>
        <p className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500">
          <a href="mailto:contact@flacronenterprises.com" className="text-orange-500 hover:underline">
            contact@flacronenterprises.com
          </a>
        </p>
      </main>
    </div>
  );
}
