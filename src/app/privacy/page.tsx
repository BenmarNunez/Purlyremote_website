import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="pt-28 pb-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h1 className="section-title mb-4">Privacy Policy</h1>
          <p className="text-sm text-neutral-muted mb-10">
            Last updated: {new Date().getFullYear()}
          </p>
          <div className="prose prose-neutral max-w-none text-neutral-muted leading-relaxed space-y-6">
            <p>
              Purly Remote LLC ("we," "our," or "us") is committed to protecting
              your personal information. This Privacy Policy explains how we
              collect, use, and safeguard your data when you visit our website or
              submit inquiries.
            </p>
            <h2 className="font-heading font-semibold text-xl text-neutral-text">
              Information We Collect
            </h2>
            <p>
              We collect information you provide directly to us through contact
              forms, freelancer applications, and client hiring requests. This
              includes your name, email address, professional details, and any
              other information you choose to submit.
            </p>
            <h2 className="font-heading font-semibold text-xl text-neutral-text">
              How We Use Your Information
            </h2>
            <p>
              We use the information we collect to respond to your inquiries,
              match freelancers with clients, improve our services, and
              communicate with you about relevant opportunities.
            </p>
            <h2 className="font-heading font-semibold text-xl text-neutral-text">
              Data Security
            </h2>
            <p>
              We implement appropriate security measures to protect your personal
              information. We do not sell, trade, or transfer your personal
              information to third parties without your consent, except as
              necessary to provide our services.
            </p>
            <h2 className="font-heading font-semibold text-xl text-neutral-text">
              Contact Us
            </h2>
            <p>
              For questions about this Privacy Policy, please contact us at{" "}
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
