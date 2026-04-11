"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  inquiry_type: z.enum(["General", "Apply Now", "Request Talent"]),
});

type FormData = z.infer<typeof schema>;

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { inquiry_type: "General" },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
      reset();
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    }
  };

  return (
    <section id="contact" className="section-padding bg-white">
      <div className="container-max">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Info */}
          <div>
            <div className="section-tag mb-5">Get in Touch</div>
            <h2 className="section-title mb-5">
              Let's Start a Conversation
            </h2>
            <p className="section-subtitle mb-10">
              Whether you're a freelancer ready to find remote work or a
              business looking for global talent — we'd love to hear from you.
            </p>

            <div className="space-y-4 mb-10">
              <a
                href="mailto:purlyremotellc@gmail.com"
                className="flex items-center gap-4 p-4 bg-neutral-bg rounded-xl hover:bg-brand-blue-light transition-colors group"
              >
                <div className="w-10 h-10 bg-brand-blue-light rounded-lg flex items-center justify-center group-hover:bg-brand-blue transition-colors">
                  <Mail className="w-4 h-4 text-brand-blue group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-xs text-neutral-muted font-semibold uppercase tracking-wide">
                    Email Us
                  </p>
                  <p className="text-sm font-medium text-neutral-text">
                    purlyremotellc@gmail.com
                  </p>
                </div>
              </a>
              <div className="flex items-center gap-4 p-4 bg-neutral-bg rounded-xl">
                <div className="w-10 h-10 bg-brand-blue-light rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-brand-blue" />
                </div>
                <div>
                  <p className="text-xs text-neutral-muted font-semibold uppercase tracking-wide">
                    Response Time
                  </p>
                  <p className="text-sm font-medium text-neutral-text">
                    Within 24 business hours
                  </p>
                </div>
              </div>
            </div>

            {/* Quick CTAs */}
            <div className="p-6 bg-brand-blue-light rounded-xl border border-brand-blue/20">
              <p className="text-sm font-semibold text-neutral-text mb-4">
                Ready to take the next step?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/apply" className="btn-primary text-sm py-2.5 flex-1 justify-center">
                  Apply Now
                </Link>
                <Link href="/hire" className="btn-outline text-sm py-2.5 flex-1 justify-center">
                  Request Talent
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="card border border-neutral-border">
            {submitted ? (
              <div className="flex flex-col items-center text-center py-10 gap-4">
                <div className="w-16 h-16 bg-brand-blue-light rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-brand-blue" />
                </div>
                <h3 className="font-heading font-bold text-xl text-neutral-text">
                  Message Received!
                </h3>
                <p className="text-neutral-muted text-sm max-w-xs">
                  Thank you for reaching out. We'll get back to you within 24 business hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn-ghost text-sm mt-2"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <h3 className="font-heading font-semibold text-lg text-neutral-text mb-1">
                    Send us a message
                  </h3>
                  <p className="text-sm text-neutral-muted">
                    All fields are required.
                  </p>
                </div>

                {/* Inquiry Type */}
                <div>
                  <label className="form-label">Inquiry Type</label>
                  <div className="flex gap-2 flex-wrap">
                    {(["General", "Apply Now", "Request Talent"] as const).map(
                      (type) => (
                        <label
                          key={type}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <input
                            type="radio"
                            value={type}
                            {...register("inquiry_type")}
                            style={{ accentColor: "#007BFF" }}
                          />
                          <span className="text-sm text-neutral-text">{type}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="name" className="form-label">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    className="form-input"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="form-error">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="form-label">
                    Email Address
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

                {/* Message */}
                <div>
                  <label htmlFor="message" className="form-label">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    placeholder="Tell us how we can help..."
                    className="form-input resize-none"
                    {...register("message")}
                  />
                  {errors.message && (
                    <p className="form-error">{errors.message.message}</p>
                  )}
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
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
