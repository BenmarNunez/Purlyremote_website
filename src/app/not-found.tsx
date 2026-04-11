import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center bg-neutral-bg pt-20">
        <div className="text-center px-4">
          <p className="text-8xl font-heading font-bold text-brand-blue mb-4">404</p>
          <h1 className="text-3xl font-heading font-bold text-neutral-text mb-3">
            Page Not Found
          </h1>
          <p className="text-neutral-muted mb-8 max-w-sm mx-auto">
            The page you're looking for doesn't exist or may have been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-primary">
              Back to Home
            </Link>
            <Link href="/#contact" className="btn-outline">
              Contact Us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
