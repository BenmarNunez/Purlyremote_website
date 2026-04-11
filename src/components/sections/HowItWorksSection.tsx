import type { ElementType } from "react";
import { UserPlus, Handshake, Laptop, FileText, Search, Rocket } from "lucide-react";

const freelancerSteps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Apply & Submit Your Profile",
    description:
      "Create your profile with your expertise, experience, and portfolio. Our team reviews your application within 7 business days.",
  },
  {
    icon: Handshake,
    step: "02",
    title: "Get Matched with Clients",
    description:
      "We intelligently match you with clients whose needs align with your skills. You'll be notified of opportunities that fit.",
  },
  {
    icon: Laptop,
    step: "03",
    title: "Start Working Remotely",
    description:
      "Once matched, you'll begin collaborating with your client fully remotely — from your home, on your schedule.",
  },
];

const clientSteps = [
  {
    icon: FileText,
    step: "01",
    title: "Submit Your Hiring Requirements",
    description:
      "Tell us about the role, required skills, project scope, and timeline. We'll take it from there.",
  },
  {
    icon: Search,
    step: "02",
    title: "Get Matched with Qualified Freelancers",
    description:
      "We source and present pre-screened candidates from our global talent pool that match your exact requirements.",
  },
  {
    icon: Rocket,
    step: "03",
    title: "Start Collaboration",
    description:
      "Review our shortlist, select your preferred talent, and kick off your project — all within days, not weeks.",
  },
];

function StepCard({
  icon: Icon,
  step,
  title,
  description,
  isLast,
}: {
  icon: ElementType;
  step: string;
  title: string;
  description: string;
  isLast: boolean;
}) {
  return (
    <div className="relative flex gap-5">
      {/* Step connector */}
      {!isLast && (
        <div className="absolute left-6 top-14 bottom-0 w-px bg-brand-blue/20 z-0" />
      )}
      <div className="relative z-10 shrink-0">
        <div className="w-12 h-12 rounded-xl bg-brand-blue flex items-center justify-center shadow-btn">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="pb-10">
        <span className="text-xs font-bold text-brand-blue uppercase tracking-widest">
          Step {step}
        </span>
        <h3 className="font-heading font-semibold text-neutral-text mt-0.5 mb-1.5">
          {title}
        </h3>
        <p className="text-sm text-neutral-muted leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section-padding bg-neutral-bg">
      <div className="container-max">
        <div className="text-center mb-14">
          <div className="section-tag mb-4 mx-auto w-fit">How It Works</div>
          <h2 className="section-title mb-4">
            Simple Steps to Remote Success
          </h2>
          <p className="section-subtitle max-w-xl mx-auto">
            Our streamlined process gets freelancers working and clients staffed
            faster than traditional hiring methods.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Freelancer Flow */}
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-blue text-white text-sm font-semibold px-4 py-2 rounded-full mb-8">
              👤 For Freelancers
            </div>
            <div>
              {freelancerSteps.map((step, i) => (
                <StepCard
                  key={step.step}
                  {...step}
                  isLast={i === freelancerSteps.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Client Flow */}
          <div>
            <div className="inline-flex items-center gap-2 bg-neutral-text text-white text-sm font-semibold px-4 py-2 rounded-full mb-8">
              🏢 For Clients
            </div>
            <div>
              {clientSteps.map((step, i) => (
                <StepCard
                  key={step.step}
                  {...step}
                  isLast={i === clientSteps.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
