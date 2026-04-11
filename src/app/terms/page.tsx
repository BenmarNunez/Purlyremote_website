import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="pt-28 pb-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h1 className="section-title mb-4">Terms of Service</h1>
          <p className="text-sm text-neutral-muted mb-10">
            Last updated: {new Date().getFullYear()}
          </p>
          <div className="prose prose-neutral max-w-none text-neutral-muted leading-relaxed space-y-6">
            <p>
              By accessing and using the Purly Remote LLC website and services,
              you accept and agree to be bound by the terms and provisions of
              this agreement.
            </p>
            <h2 className="font-heading font-semibold text-xl text-neutral-text">
              Use of Services
            </h2>
            <p>
              Purly Remote LLC provides remote staffing and freelancing solutions.
              Our services are intended for legitimate business and professional
              use. You agree to use our services only for lawful purposes.
            </p>
            <h2 className="font-heading font-semibold text-xl text-neutral-text">
              Submissions
            </h2>
            <p>
              By submitting information through our forms, you confirm that all
              information provided is accurate and truthful. Purly Remote LLC
              reserves the right to reject any application or inquiry at our
              discretion.
            </p>
            <h2 className="font-heading font-semibold text-xl text-neutral-text">
              Limitation of Liability
            </h2>
            <p>
              Purly Remote LLC shall not be liable for any indirect, incidental,
              special, or consequential damages arising from the use of our
              services or inability to access our platform.
            </p>
            <h2 className="font-heading font-semibold text-xl text-neutral-text">
              Contact Us
            </h2>
            <p>
              For questions about these Terms of Service, please contact us at{" "}
              <a
                href="mailto:hello@purlyremote.com"
                className="text-brand-blue hover:underline"
              >
                hello@purlyremote.com
              </a>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
