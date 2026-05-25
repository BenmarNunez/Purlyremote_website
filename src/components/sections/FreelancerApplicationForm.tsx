"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle, Paperclip, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone_number: z.string().min(7, "Enter a valid phone number"),
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

type ResumeState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "uploaded"; path: string; name: string }
  | { status: "error"; message: string };

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
  const [resumeState, setResumeState] = useState<ResumeState>({ status: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { availability_status: "Flexible" },
  });

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      setResumeState({ status: "error", message: "Only PDF, DOC, DOCX files allowed." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeState({ status: "error", message: "File must be under 5MB." });
      return;
    }

    setResumeState({ status: "uploading" });
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `applications/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setResumeState({ status: "error", message: "Upload failed. Please try again." });
    } else {
      setResumeState({ status: "uploaded", path, name: file.name });
    }
  };

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const resume_url = resumeState.status === "uploaded" ? resumeState.path : null;
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, resume_url }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
      reset();
      setResumeState({ status: "idle" });
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
          out within <strong>7 business days</strong> if you&apos;re a great match.
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
            <label htmlFor="full_name" className="form-label">Full Name *</label>
            <input id="full_name" type="text" placeholder="Your full name" className="form-input" {...register("full_name")} />
            {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className="form-label">Email Address *</label>
            <input id="email" type="email" placeholder="you@email.com" className="form-input" {...register("email")} />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone_number" className="form-label">Phone Number *</label>
          <input id="phone_number" type="tel" placeholder="+1 234 567 8900" className="form-input" {...register("phone_number")} />
          {errors.phone_number && <p className="form-error">{errors.phone_number.message}</p>}
        </div>

        {/* Expertise */}
        <div>
          <label htmlFor="expertise_area" className="form-label">Primary Expertise / Skill Area *</label>
          <select id="expertise_area" className="form-input" {...register("expertise_area")}>
            <option value="">Select your expertise...</option>
            {expertiseOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors.expertise_area && <p className="form-error">{errors.expertise_area.message}</p>}
        </div>

        {/* Experience + Role */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="years_experience" className="form-label">Years of Experience *</label>
            <select id="years_experience" className="form-input" {...register("years_experience")}>
              <option value="">Select...</option>
              <option value="0-1">Less than 1 year</option>
              <option value="1-2">1–2 years</option>
              <option value="3-5">3–5 years</option>
              <option value="5-10">5–10 years</option>
              <option value="10+">10+ years</option>
            </select>
            {errors.years_experience && <p className="form-error">{errors.years_experience.message}</p>}
          </div>
          <div>
            <label htmlFor="preferred_role" className="form-label">Preferred Role / Job Title</label>
            <input id="preferred_role" type="text" placeholder="e.g. Senior React Developer" className="form-input" {...register("preferred_role")} />
          </div>
        </div>

        {/* Portfolio */}
        <div>
          <label htmlFor="portfolio_link" className="form-label">Portfolio / LinkedIn / GitHub URL</label>
          <input id="portfolio_link" type="url" placeholder="https://your-portfolio.com" className="form-input" {...register("portfolio_link")} />
          {errors.portfolio_link && <p className="form-error">{errors.portfolio_link.message}</p>}
        </div>

        {/* Resume Upload */}
        <div>
          <label className="form-label">Resume / CV</label>
          <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            resumeState.status === "uploaded" ? "border-green-300 bg-green-50" :
            resumeState.status === "error" ? "border-red-300 bg-red-50" :
            "border-neutral-200 bg-neutral-50 hover:border-[#007BFF] hover:bg-blue-50"
          }`}>
            <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeChange} disabled={resumeState.status === "uploading"} />
            {resumeState.status === "uploading" && <Loader2 className="w-4 h-4 text-[#007BFF] animate-spin flex-shrink-0" />}
            {resumeState.status === "uploaded" && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
            {(resumeState.status === "idle" || resumeState.status === "error") && <Paperclip className="w-4 h-4 text-neutral-400 flex-shrink-0" />}
            <div className="min-w-0">
              {resumeState.status === "idle" && <span className="text-sm text-neutral-500">Click to upload resume — PDF, DOC, DOCX up to 5MB</span>}
              {resumeState.status === "uploading" && <span className="text-sm text-[#007BFF]">Uploading...</span>}
              {resumeState.status === "uploaded" && <span className="text-sm text-green-700 truncate block">{resumeState.name} — uploaded ✓</span>}
              {resumeState.status === "error" && <span className="text-sm text-red-600">{resumeState.message}</span>}
            </div>
          </label>
        </div>

        {/* Availability */}
        <div>
          <label className="form-label">Availability *</label>
          <div className="flex flex-wrap gap-3">
            {(["Immediate", "Within 1 Month", "Flexible"] as const).map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={opt} {...register("availability_status")} style={{ accentColor: "#007BFF" }} />
                <span className="text-sm text-neutral-text">{opt}</span>
              </label>
            ))}
          </div>
          {errors.availability_status && <p className="form-error">{errors.availability_status.message}</p>}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="additional_notes" className="form-label">Additional Notes</label>
          <textarea id="additional_notes" rows={3} placeholder="Tell us anything else we should know about you..." className="form-input resize-none" {...register("additional_notes")} />
        </div>

        {error && (
          <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-input p-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || resumeState.status === "uploading"}
          className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting Application...</>
          ) : (
            <><Send className="w-4 h-4" />Submit Application</>
          )}
        </button>
      </form>
    </div>
  );
}
