import { Star, Quote } from "lucide-react";

// Placeholder testimonials — replace with real data when available
const testimonials = [
  {
    quote:
      "Purly Remote matched me with an amazing US-based startup within 48 hours. I've been working with them full-time for over a year now. Life-changing experience.",
    name: "Maria Santos",
    role: "Full-Stack Developer",
    type: "Freelancer",
    avatar: "MS",
    stars: 5,
  },
  {
    quote:
      "We needed a skilled project manager fast. Purly Remote delivered two pre-vetted candidates in less than a week. We hired one and haven't looked back.",
    name: "James Holloway",
    role: "CEO, Tech Startup",
    type: "Client",
    avatar: "JH",
    stars: 5,
  },
  {
    quote:
      "The quality of talent is exceptional. Our remote VA handles everything professionally. I'd recommend Purly Remote to any business looking to scale smartly.",
    name: "Rachel Kim",
    role: "E-Commerce Business Owner",
    type: "Client",
    avatar: "RK",
    stars: 5,
  },
  {
    quote:
      "As a digital marketer, finding quality remote work was tough until Purly Remote. They understood my skills and matched me with the right client immediately.",
    name: "Carlo Reyes",
    role: "Digital Marketing Specialist",
    type: "Freelancer",
    avatar: "CR",
    stars: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="section-padding bg-neutral-bg">
      <div className="container-max">
        <div className="text-center mb-14">
          <div className="section-tag mb-4 mx-auto w-fit">Testimonials</div>
          <h2 className="section-title mb-4">
            What Our Community Says
          </h2>
          <p className="section-subtitle max-w-xl mx-auto">
            Real stories from freelancers and clients who have built successful
            remote partnerships through Purly Remote LLC.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="card border border-neutral-border flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="w-5 h-5 text-brand-blue/30" />
              </div>
              <p className="text-sm text-neutral-muted leading-relaxed flex-1 mb-5">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-border">
                <div className="w-9 h-9 rounded-full bg-brand-blue text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-text leading-none">
                    {t.name}
                  </p>
                  <p className="text-xs text-neutral-muted mt-0.5">{t.role}</p>
                </div>
                <span
                  className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    t.type === "Freelancer"
                      ? "bg-brand-blue-light text-brand-blue"
                      : "bg-neutral-bg text-neutral-muted border border-neutral-border"
                  }`}
                >
                  {t.type}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Logo strip placeholder */}
        <div className="mt-14 pt-10 border-t border-neutral-border">
          <p className="text-center text-xs text-neutral-muted uppercase tracking-widest font-semibold mb-6">
            Trusted by businesses worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-40 grayscale">
            {["Acme Corp", "TechFlow", "StartupX", "GrowthLabs", "DevHouse"].map(
              (name) => (
                <div
                  key={name}
                  className="px-6 py-3 border border-neutral-border rounded-lg"
                >
                  <span className="font-heading font-bold text-neutral-text text-sm">
                    {name}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
