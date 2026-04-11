import type { ElementType } from "react";
import { Globe, Home, Users, ShieldCheck, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";

const freelancerServices = [
  {
    icon: Globe,
    title: "Access to Global Opportunities",
    description:
      "Connect with international clients across the US, UK, Canada, and Australia. Expand your career beyond borders.",
  },
  {
    icon: Home,
    title: "Flexible Work-From-Home Setup",
    description:
      "Enjoy 100% remote work arrangements designed around your lifestyle. Work on your schedule, from your home.",
  },
  {
    icon: Users,
    title: "Continuous Support & Matching",
    description:
      "Our team provides ongoing support throughout your journey — from initial matching to long-term placement.",
  },
];

const clientServices = [
  {
    icon: ShieldCheck,
    title: "Pre-Screened Remote Professionals",
    description:
      "Every freelancer in our network is vetted for skills, reliability, and professionalism before being matched.",
  },
  {
    icon: DollarSign,
    title: "Cost-Effective Hiring Solutions",
    description:
      "Access top-tier global talent at competitive rates. Reduce overhead without compromising on quality.",
  },
  {
    icon: TrendingUp,
    title: "Reliable & Scalable Workforce",
    description:
      "Scale your team up or down as needed. Build a flexible, remote workforce that grows with your business.",
  },
];

function ServiceCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="card card-hover group">
      <div className="w-11 h-11 bg-brand-blue-light rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-blue transition-colors">
        <Icon className="w-5 h-5 text-brand-blue group-hover:text-white transition-colors" />
      </div>
      <h3 className="font-heading font-semibold text-neutral-text mb-2">{title}</h3>
      <p className="text-sm text-neutral-muted leading-relaxed">{description}</p>
    </div>
  );
}

export default function ServicesSection() {
  return (
    <section id="services" className="section-padding bg-white">
      <div className="container-max">
        <div className="text-center mb-14">
          <div className="section-tag mb-4 mx-auto w-fit">Our Services</div>
          <h2 className="section-title mb-4">
            Solutions for Every Side of Remote Work
          </h2>
          <p className="section-subtitle max-w-xl mx-auto">
            Whether you're a freelancer seeking opportunities or a business
            seeking talent, Purly Remote has a tailored solution for you.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* For Freelancers */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-neutral-border" />
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-blue text-white text-sm font-semibold rounded-full">
                👤 For Freelancers
              </span>
              <div className="h-px flex-1 bg-neutral-border" />
            </div>
            <div className="space-y-4">
              {freelancerServices.map((service) => (
                <ServiceCard key={service.title} {...service} />
              ))}
            </div>
            <div className="mt-6">
              <Link href="/apply" className="btn-primary w-full justify-center">
                Apply as Freelancer
              </Link>
            </div>
          </div>

          {/* For Clients */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-neutral-border" />
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-neutral-text text-white text-sm font-semibold rounded-full">
                🏢 For Clients
              </span>
              <div className="h-px flex-1 bg-neutral-border" />
            </div>
            <div className="space-y-4">
              {clientServices.map((service) => (
                <ServiceCard key={service.title} {...service} />
              ))}
            </div>
            <div className="mt-6">
              <Link href="/hire" className="btn-outline w-full justify-center">
                Hire Talent
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
