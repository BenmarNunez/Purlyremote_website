import { Target, Eye, Heart } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="section-padding bg-neutral-bg">
      <div className="container-max">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Visual */}
          <div className="relative">
            <div className="bg-white rounded-2xl p-8 shadow-card border border-neutral-border">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { emoji: "🌏", title: "Global Reach", desc: "Talent across 20+ countries" },
                  { emoji: "🏠", title: "100% Remote", desc: "Work from anywhere" },
                  { emoji: "🤝", title: "Long-Term", desc: "Sustainable partnerships" },
                  { emoji: "⚡", title: "Fast Matching", desc: "Matched within 48 hours" },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="p-4 bg-neutral-bg rounded-xl hover:bg-brand-blue-light transition-colors"
                  >
                    <span className="text-2xl mb-2 block">{item.emoji}</span>
                    <p className="text-sm font-semibold text-neutral-text">{item.title}</p>
                    <p className="text-xs text-neutral-muted mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="pt-5 border-t border-neutral-border text-center">
                <p className="text-xs text-neutral-muted uppercase tracking-widest font-semibold mb-2">
                  Trusted by businesses in
                </p>
                <div className="flex items-center justify-center gap-4 text-sm font-semibold text-neutral-muted">
                  {["🇺🇸 USA", "🇬🇧 UK", "🇦🇺 Australia", "🇨🇦 Canada"].map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
            {/* Accent */}
            <div className="absolute -z-10 -bottom-4 -right-4 w-full h-full bg-brand-blue/5 rounded-2xl" />
          </div>

          {/* Right: Content */}
          <div>
            <div className="section-tag mb-5">About Us</div>
            <h2 className="section-title mb-5">
              Bridging the Gap Between Talent & Opportunity
            </h2>
            <p className="text-neutral-muted leading-relaxed mb-8">
              Purly Remote LLC is a remote-first company dedicated to bridging
              the gap between skilled freelancers and businesses seeking
              reliable remote talent. We focus on building long-term
              partnerships by matching the right people with the right
              opportunities — every time.
            </p>

            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-blue-light flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-brand-blue" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-neutral-text mb-1">
                    Our Mission
                  </h3>
                  <p className="text-sm text-neutral-muted leading-relaxed">
                    Empower individuals to work remotely while helping businesses
                    grow with global talent — creating sustainable, meaningful
                    opportunities on both sides.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-blue-light flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5 text-brand-blue" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-neutral-text mb-1">
                    Our Vision
                  </h3>
                  <p className="text-sm text-neutral-muted leading-relaxed">
                    Become a leading platform for remote workforce solutions
                    worldwide — where talent knows no borders and opportunity is
                    accessible to everyone.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-blue-light flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-brand-blue" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-neutral-text mb-1">
                    Our Values
                  </h3>
                  <p className="text-sm text-neutral-muted leading-relaxed">
                    Trust, transparency, professionalism, and continuous support
                    are the cornerstones of every relationship we build.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
