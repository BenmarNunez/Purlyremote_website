"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  company_name: z.string().min(2, "Company name is required"),
  contact_name: z.string().min(2, "Contact name is required"),
  email: z.string().email("Please enter a valid email address"),
  role_needed: z.string().min(2, "Please specify the role needed"),
  required_skills_summary: z
    .string()
    .min(10, "Please provide a brief skills summary"),
  project_scope: z.string().optional(),
  budget_range: z.string().optional(),
  timeline: z.string().optional(),
  additional_notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const roleOptions = [
  "Software Developer (Frontend)",
  "Software Developer (Backend)",
  "Software Developer (Full-Stack)",
  "UI/UX Designer",
  "Digital Marketing Specialist",
  "SEO Specialist",
  "Content Writer / Copywriter",
  "Virtual Assistant (General)",
  "Executive Assistant",
  "Project Manager",
  "Data Analyst",
  "Graphic Designer",
  "Video Editor",
  "Customer Support Representative",
  "Accountant / Bookkeeper",
  "Other",
];

const budgetOptions = [
  "Less than $500/month",
  "$500 – $1,000/month",
  "$1,000 – $2,000/month",
  "$2,000 – $4,000/month",
  "$4,000+/month",
  "Project-based (one-time)",
  "Prefer not to say",
];

export default function ClientInquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const res = await fetch("/api/hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
      reset();
    } catch {
      setError("Something went wrong. Please try again or contact us directly.");
    }
  };

  if (submitted) {
    return (
      <div className="card border border-neutral-border flex flex-col items-center text-center py-14 gap-4">
        <div className="w-20 h-20 bg-brand-blue-light rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-brand-blue" />
        </div>
        <h3 className="font-heading font-bold text-2xl text-neutral-text">
          Inquiry Received!
        </h3>
        <p className="text-neutral-muted text-sm max-w-sm">
          Your hiring request has been received. A Purly Remote specialist will
          contact you within <strong>24 hours</strong> to discuss your needs.
        </p>
        <div className="flex gap-3 mt-4">
          <button onClick={() => setSubmitted(false)} className="btn-ghost text-sm">
            Submit another request
          </button>
          <Link href="/" className="btn-outline text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card border border-neutral-border bg-white">
      <div className="mb-7">
        <h2 className="font-heading font-bold text-xl text-neutral-text">
          Client Hiring Request
        </h2>
        <p className="text-sm text-neutral-muted mt-1">
          Tell us what you need. Fields marked with * are required.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Company + Contact */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="company_name" className="form-label">
              Company Name *
            </label>
            <input
              id="company_name"
              type="text"
              placeholder="Your company name"
              className="form-input"
              {...register("company_name")}
            />
            {errors.company_name && (
              <p className="form-error">{errors.company_name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="contact_name" className="form-label">
              Your Name *
            </label>
            <input
              id="contact_name"
              type="text"
              placeholder="Your full name"
              className="form-input"
              {...register("contact_name")}
            />
            {errors.contact_name && (
              <p className="form-error">{errors.contact_name.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="form-label">
            Business Email Address *
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@yourcompany.com"
            className="form-input"
            {...register("email")}
          />
          {errors.email && (
            <p className="form-error">{errors.email.message}</p>
          )}
        </div>

        {/* Role Needed */}
        <div>
          <label htmlFor="role_needed" className="form-label">
            Role Needed *
          </label>
          <select id="role_needed" className="form-input" {...register("role_needed")}>
            <option value="">Select a role...</option>
            {roleOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errors.role_needed && (
            <p className="form-error">{errors.role_needed.message}</p>
          )}
        </div>

        {/* Required Skills */}
        <div>
          <label htmlFor="required_skills_summary" className="form-label">
            Required Skills & Experience *
          </label>
          <textarea
            id="required_skills_summary"
            rows={3}
            placeholder="e.g. 3+ years of React experience, familiarity with REST APIs, strong communication skills..."
            className="form-input resize-none"
            {...register("required_skills_summary")}
          />
          {errors.required_skills_summary && (
            <p className="form-error">{errors.required_skills_summary.message}</p>
          )}
        </div>

        {/* Scope */}
        <div>
          <label htmlFor="project_scope" className="form-label">
            Project Scope / Description
          </label>
          <textarea
            id="project_scope"
            rows={3}
            placeholder="Briefly describe the project or ongoing role responsibilities..."
            className="form-input resize-none"
            {...register("project_scope")}
          />
        </div>

        {/* Budget + Timeline */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="budget_range" className="form-label">
              Budget Range
            </label>
            <select id="budget_range" className="form-input" {...register("budget_range")}>
              <option value="">Select budget range...</option>
              {budgetOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="timeline" className="form-label">
              Start Timeline
            </label>
            <select id="timeline" className="form-input" {...register("timeline")}>
              <option value="">Select timeline...</option>
              <option value="ASAP">As soon as possible</option>
              <option value="1-2 weeks">Within 1–2 weeks</option>
              <option value="1 month">Within 1 month</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="additional_notes" className="form-label">
            Additional Notes
          </label>
          <textarea
            id="additional_notes"
            rows={3}
            placeholder="Any other information that would help us find the right talent for you..."
            className="form-input resize-none"
            {...register("additional_notes")}
          />
        </div>

        {error && (
          <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-input p-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting Request...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Hiring Request
            </>
          )}
        </button>
      </form>
    </div>
  );
}
