import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FreelancerApplicationForm from "@/components/sections/FreelancerApplicationForm";
import { UserPlus, Handshake, Laptop, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Apply as a Freelancer",
  description:
    "Join Purly Remote LLC's global talent network. Apply today to access remote work opportunities with international clients.",
};

const steps = [
  { icon: UserPlus, label: "Submit your profile" },
  { icon: Handshake, label: "Get matched with clients" },
  { icon: Laptop, label: "Start working remotely" },
];

const perks = [
  "100% work-from-home setup",
  "Access to global US, UK & AU clients",
  "Ongoing matching support",
  "Flexible engagement arrangements",
  "Professional and supportive team",
  "Long-term placement focus",
];

export default function ApplyPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero Banner */}
        <div className="bg-brand-blue-light border-b border-brand-blue/10 py-16 px-4">
          <div className="container-max text-center">
            <div className="section-tag mx-auto w-fit mb-5">Join Our Talent Network</div>
            <h1 className="text-4xl sm:text-5xl font-heading font-bold text-neutral-text mb-4">
              Apply as a Freelancer
            </h1>
            <p className="section-subtitle max-w-xl mx-auto">
              Take the first step toward a flexible, remote career. Submit your
              profile and let us connect you with the right opportunities.
            </p>

            {/* Steps */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
              {steps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-card text-sm font-medium text-neutral-text">
                    <step.icon className="w-4 h-4 text-brand-blue" />
                    {step.label}
                  </div>
                  {i < steps.length - 1 && (
                    <span className="text-brand-blue font-bold hidden sm:block">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form + Perks */}
        <div className="section-padding bg-white">
          <div className="container-max">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Perks sidebar */}
              <div className="lg:col-span-1">
                <h2 className="font-heading font-bold text-xl text-neutral-text mb-6">
                  Why join Purly Remote?
                </h2>
                <ul className="space-y-3 mb-8">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-3 text-sm text-neutral-muted">
                      <CheckCircle className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>

                <div className="p-5 bg-neutral-bg rounded-xl border border-neutral-border">
                  <p className="text-xs font-semibold text-neutral-text uppercase tracking-wide mb-2">
                    What to expect
                  </p>
                  <p className="text-sm text-neutral-muted leading-relaxed">
                    After submitting, our team will review your profile within{" "}
                    <strong className="text-neutral-text">7 business days</strong>.
                    If you're a great fit, we'll reach out to begin the matching
                    process.
                  </p>
                </div>
              </div>

              {/* Application form */}
              <div className="lg:col-span-2">
                <FreelancerApplicationForm />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
