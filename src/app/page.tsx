import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <h1 className="text-5xl font-bold text-gray-900 text-center mb-8">
        Welcome to Ecom AI
      </h1>
      <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl">
        Your intelligent companion for analyzing and optimizing Facebook ad campaigns
      </p>
      <Link
        href="/projects/new"
        className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
      >
        Get Started
      </Link>
    </div>
  );
}
