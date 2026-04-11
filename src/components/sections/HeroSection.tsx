import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";

const highlights = [
  "100% remote workforce",
  "Global talent network",
  "Pre-screened professionals",
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-blue-light/40 rounded-bl-[80px]" />
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-brand-blue/5 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-brand-blue/8 blur-2xl" />
        {/* Grid dots */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle, #007BFF22 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container-max section-padding pt-28 lg:pt-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <div className="section-tag mb-6 animate-fade-up">
              🌍 Global Remote Staffing
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-[4rem] xl:text-[4.5rem] font-heading font-bold text-neutral-text leading-[1.05] mb-6 animate-fade-up animate-delay-100">
              Connecting{" "}
              <span className="text-brand-blue">Global Talent</span> to Remote
              Opportunities
            </h1>
            <p className="section-subtitle max-w-lg mb-8 animate-fade-up animate-delay-200">
              Purly Remote LLC connects talented freelancers with clients
              worldwide, providing seamless remote work opportunities and
              reliable staffing solutions.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10 animate-fade-up animate-delay-300">
              <Link href="/apply" className="btn-primary text-base py-3.5 px-8">
                Apply as Freelancer
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/hire" className="btn-outline text-base py-3.5 px-8">
                Hire Talent
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <ul className="flex flex-col sm:flex-row flex-wrap gap-x-6 gap-y-2 animate-fade-up animate-delay-400">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-neutral-muted">
                  <CheckCircle className="w-4 h-4 text-brand-blue shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Visual Card Stack */}
          <div className="relative hidden lg:flex items-center justify-center animate-fade-in animate-delay-300">
            <div className="relative w-full max-w-sm">
              {/* Back card */}
              <div className="absolute -top-4 -right-4 w-full h-full bg-brand-blue/10 rounded-2xl" />
              {/* Main card */}
              <div className="relative card p-8 border border-neutral-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-brand-blue-light rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🌐</span>
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-neutral-text">Global Talent Pool</p>
                    <p className="text-xs text-neutral-muted">Philippines · US · UK · AU</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    { role: "Full-Stack Developer", match: "98%", color: "bg-success" },
                    { role: "Digital Marketer", match: "95%", color: "bg-brand-blue" },
                    { role: "UI/UX Designer", match: "92%", color: "bg-purple-500" },
                  ].map((item) => (
                    <div key={item.role} className="flex items-center justify-between p-3 bg-neutral-bg rounded-lg">
                      <span className="text-sm font-medium text-neutral-text">{item.role}</span>
                      <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${item.color}`}>
                        {item.match}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-muted pt-4 border-t border-neutral-border">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success inline-block animate-pulse" />
                    Live matching active
                  </span>
                  <span>Avg. 48hr match</span>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white shadow-card border border-neutral-border rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-xl">✅</span>
                <div>
                  <p className="text-xs font-semibold text-neutral-text">Pre-screened</p>
                  <p className="text-[10px] text-neutral-muted">Verified talent only</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-20 pt-10 border-t border-neutral-border grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { value: "500+", label: "Verified Freelancers" },
            { value: "50+", label: "Global Clients" },
            { value: "98%", label: "Client Satisfaction" },
            { value: "48hr", label: "Average Match Time" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-heading font-bold text-brand-blue">{stat.value}</p>
              <p className="text-sm text-neutral-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
