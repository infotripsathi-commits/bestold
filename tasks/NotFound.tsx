import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";

export default function NotFound() {
  return (
    <>
      <PageMeta
        title="Page Not Found"
        description="The page you are looking for does not exist. Browse our second-hand products or go back to the homepage."
        additionalMeta={[
          { name: 'robots', content: 'noindex, nofollow' },
        ]}
      />
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="mx-auto w-full max-w-md text-center">
          <h1 className="mb-4 text-6xl font-bold text-gray-800 dark:text-white">
            404
          </h1>
          <h2 className="mb-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
            Page Not Found
          </h2>
          <p className="mb-8 text-base text-gray-600 dark:text-gray-400">
            The page you are looking for may have been moved, deleted, or never existed.
            Check the URL or explore our marketplace below.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              <Search className="mr-2 h-4 w-4" />
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
