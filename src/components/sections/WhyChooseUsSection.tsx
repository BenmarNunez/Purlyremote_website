import { Home, Globe, Zap, Award, Clock, Shield } from "lucide-react";

const reasons = [
  {
    icon: Home,
    title: "100% Remote Work Environment",
    description:
      "Every engagement is fully remote. No commutes, no office requirements — just productive, location-independent collaboration.",
  },
  {
    icon: Globe,
    title: "Global Network of Talent",
    description:
      "Access a curated pool of skilled professionals from around the world, with a strong talent base in the Philippines and Southeast Asia.",
  },
  {
    icon: Zap,
    title: "Efficient Matching System",
    description:
      "Our intelligent process reduces time-to-hire dramatically. Most clients receive qualified candidate profiles within 48 hours.",
  },
  {
    icon: Award,
    title: "Reliable & Professional Service",
    description:
      "We hold our talent to the highest professional standards. Pre-screening, background checks, and skills validation are built-in.",
  },
  {
    icon: Clock,
    title: "Flexible Engagement Models",
    description:
      "Whether you need full-time, part-time, or project-based talent, we offer engagement structures that fit your needs and budget.",
  },
  {
    icon: Shield,
    title: "Dedicated Support Throughout",
    description:
      "Our team doesn't disappear after the match. We remain your partner throughout the engagement to ensure success on both sides.",
  },
];

export default function WhyChooseUsSection() {
  return (
    <section id="why-us" className="section-padding bg-white">
      <div className="container-max">
        <div className="text-center mb-14">
          <div className="section-tag mb-4 mx-auto w-fit">Why Choose Us</div>
          <h2 className="section-title mb-4">
            The Purly Remote Difference
          </h2>
          <p className="section-subtitle max-w-xl mx-auto">
            We're not just a staffing agency. We're a long-term partner dedicated
            to building successful remote working relationships.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <div
                key={reason.title}
                className="card card-hover group border border-neutral-border"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-blue-light flex items-center justify-center mb-5 group-hover:bg-brand-blue transition-colors duration-300">
                  <Icon className="w-5 h-5 text-brand-blue group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-heading font-semibold text-neutral-text mb-2">
                  {reason.title}
                </h3>
                <p className="text-sm text-neutral-muted leading-relaxed">
                  {reason.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-16 rounded-2xl bg-brand-blue p-10 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-heading font-bold mb-3">
              Ready to experience the Purly Remote difference?
            </h3>
            <p className="text-white/80 mb-8 max-w-md mx-auto">
              Join hundreds of freelancers and clients who have found their
              perfect remote working match.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/apply"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-white text-brand-blue font-semibold rounded-btn hover:bg-brand-blue-light transition-colors"
              >
                Apply as Freelancer
              </a>
              <a
                href="/hire"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 border-2 border-white text-white font-semibold rounded-btn hover:bg-white/10 transition-colors"
              >
                Hire Talent
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
