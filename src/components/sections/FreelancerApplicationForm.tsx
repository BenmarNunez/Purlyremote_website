"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  expertise_area: z.string().min(2, "Please enter your primary expertise"),
  years_experience: z.string().min(1, "Please select years of experience"),
  portfolio_link: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  preferred_role: z.string().optional(),
  availability_status: z.enum(["Immediate", "Within 1 Month", "Flexible"]),
  additional_notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const expertiseOptions = [
  "Software Development",
  "UI/UX Design",
  "Digital Marketing",
  "Content Writing & Copywriting",
  "Virtual Assistant",
  "Project Management",
  "Data Analysis",
  "Graphic Design",
  "Video Editing",
  "Customer Support",
  "Accounting & Finance",
  "Other",
];

export default function FreelancerApplicationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { availability_status: "Flexible" },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const res = await fetch("/api/apply", {
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
          Application Received!
        </h3>
        <p className="text-neutral-muted text-sm max-w-sm">
          Thank you for applying! Our team will review your profile and reach
          out within <strong>7 business days</strong> if you're a great match.
        </p>
        <div className="flex gap-3 mt-4">
          <button onClick={() => setSubmitted(false)} className="btn-ghost text-sm">
            Submit another application
          </button>
          <Link href="/" className="btn-outline text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card border border-neutral-border">
      <div className="mb-7">
        <h2 className="font-heading font-bold text-xl text-neutral-text">
          Freelancer Application
        </h2>
        <p className="text-sm text-neutral-muted mt-1">
          Fill in your details below. Fields marked with * are required.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name + Email */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="full_name" className="form-label">
              Full Name *
            </label>
            <input
              id="full_name"
              type="text"
              placeholder="Your full name"
              className="form-input"
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="form-error">{errors.full_name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="email" className="form-label">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@email.com"
              className="form-input"
              {...register("email")}
            />
            {errors.email && (
              <p className="form-error">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Expertise */}
        <div>
          <label htmlFor="expertise_area" className="form-label">
            Primary Expertise / Skill Area *
          </label>
          <select
            id="expertise_area"
            className="form-input"
            {...register("expertise_area")}
          >
            <option value="">Select your expertise...</option>
            {expertiseOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errors.expertise_area && (
            <p className="form-error">{errors.expertise_area.message}</p>
          )}
        </div>

        {/* Experience + Role */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="years_experience" className="form-label">
              Years of Experience *
            </label>
            <select
              id="years_experience"
              className="form-input"
              {...register("years_experience")}
            >
              <option value="">Select...</option>
              <option value="0-1">Less than 1 year</option>
              <option value="1-2">1–2 years</option>
              <option value="3-5">3–5 years</option>
              <option value="5-10">5–10 years</option>
              <option value="10+">10+ years</option>
            </select>
            {errors.years_experience && (
              <p className="form-error">{errors.years_experience.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="preferred_role" className="form-label">
              Preferred Role / Job Title
            </label>
            <input
              id="preferred_role"
              type="text"
              placeholder="e.g. Senior React Developer"
              className="form-input"
              {...register("preferred_role")}
            />
          </div>
        </div>

        {/* Portfolio */}
        <div>
          <label htmlFor="portfolio_link" className="form-label">
            Portfolio / LinkedIn / GitHub URL
          </label>
          <input
            id="portfolio_link"
            type="url"
            placeholder="https://your-portfolio.com"
            className="form-input"
            {...register("portfolio_link")}
          />
          {errors.portfolio_link && (
            <p className="form-error">{errors.portfolio_link.message}</p>
          )}
        </div>

        {/* Availability */}
        <div>
          <label className="form-label">Availability *</label>
          <div className="flex flex-wrap gap-3">
            {(["Immediate", "Within 1 Month", "Flexible"] as const).map(
              (opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    value={opt}
                    {...register("availability_status")}
                    style={{ accentColor: "#007BFF" }}
                  />
                  <span className="text-sm text-neutral-text">{opt}</span>
                </label>
              )
            )}
          </div>
          {errors.availability_status && (
            <p className="form-error">{errors.availability_status.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="additional_notes" className="form-label">
            Additional Notes
          </label>
          <textarea
            id="additional_notes"
            rows={3}
            placeholder="Tell us anything else we should know about you..."
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
              Submitting Application...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Application
            </>
          )}
        </button>
      </form>
    </div>
  );
}
