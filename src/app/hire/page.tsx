import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ClientInquiryForm from "@/components/sections/ClientInquiryForm";
import { FileText, Search, Rocket, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Hire Remote Talent",
  description:
    "Find pre-screened, reliable remote professionals for your business. Submit your hiring requirements and let Purly Remote match you with global talent.",
};

const steps = [
  { icon: FileText, label: "Submit requirements" },
  { icon: Search, label: "Get matched with talent" },
  { icon: Rocket, label: "Start collaboration" },
];

const benefits = [
  "Pre-screened, vetted professionals",
  "Candidates delivered within 48 hours",
  "Flexible full-time or part-time options",
  "Cost-effective global talent",
  "Dedicated account support",
  "No long-term agency contracts",
];

export default function HirePage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero Banner */}
        <div className="bg-neutral-text py-16 px-4">
          <div className="container-max text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white text-xs font-semibold rounded-full uppercase tracking-wider mb-5">
              🏢 For Businesses
            </div>
            <h1 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-4">
              Hire Remote Talent
            </h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto leading-relaxed">
              Tell us what you need and we'll deliver pre-screened, reliable
              remote professionals — matched to your exact requirements.
            </p>

            {/* Steps */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
              {steps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium text-white">
                    <step.icon className="w-4 h-4 text-brand-blue" />
                    {step.label}
                  </div>
                  {i < steps.length - 1 && (
                    <span className="text-white/40 font-bold hidden sm:block">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form + Benefits */}
        <div className="section-padding bg-neutral-bg">
          <div className="container-max">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Benefits sidebar */}
              <div className="lg:col-span-1">
                <h2 className="font-heading font-bold text-xl text-neutral-text mb-6">
                  Why hire through Purly Remote?
                </h2>
                <ul className="space-y-3 mb-8">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3 text-sm text-neutral-muted">
                      <CheckCircle className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <div className="p-5 bg-brand-blue-light rounded-xl border border-brand-blue/20">
                  <p className="text-xs font-semibold text-neutral-text uppercase tracking-wide mb-2">
                    Our commitment to you
                  </p>
                  <p className="text-sm text-neutral-muted leading-relaxed">
                    After submitting your requirements, a{" "}
                    <strong className="text-neutral-text">Purly Remote specialist</strong>{" "}
                    will contact you within{" "}
                    <strong className="text-neutral-text">24 hours</strong> to
                    discuss your needs and begin the matching process.
                  </p>
                </div>

                <div className="p-5 bg-white rounded-xl border border-neutral-border mt-4">
                  <p className="text-xs font-semibold text-brand-blue uppercase tracking-wide mb-2">
                    💡 Faster hiring
                  </p>
                  <p className="text-sm text-neutral-muted leading-relaxed mb-3">
                    Log in to your account to browse available freelancers directly and hire talent more easily — no waiting required.
                  </p>
                  <a
                    href="/auth/login"
                    className="btn-primary text-sm py-2 px-4 inline-block"
                  >
                    Log In to Browse Freelancers
                  </a>
                </div>
              </div>

              {/* Inquiry form */}
              <div className="lg:col-span-2">
                <ClientInquiryForm />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
