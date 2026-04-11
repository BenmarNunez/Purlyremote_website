# Purly Remote LLC — Corporate Website

A modern, professional marketing website for **Purly Remote LLC**, a remote staffing and freelancing solutions provider. Built with Next.js 15, TypeScript, and Tailwind CSS.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod validation |
| Icons | Lucide React |
| Email | [Resend](https://resend.com) (configured, requires API key) |
| Hosting | Vercel (recommended) |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Homepage (all sections)
│   ├── apply/page.tsx            # Freelancer Application page
│   ├── hire/page.tsx             # Client Hiring Request page
│   ├── privacy/page.tsx          # Privacy Policy
│   ├── terms/page.tsx            # Terms of Service
│   ├── api/
│   │   ├── contact/route.ts      # POST /api/contact
│   │   ├── apply/route.ts        # POST /api/apply
│   │   └── hire/route.ts         # POST /api/hire
│   ├── layout.tsx                # Root layout (fonts, metadata)
│   └── globals.css               # Global styles & Tailwind layers
│
└── components/
    ├── layout/
    │   ├── Header.tsx            # Sticky nav with mobile menu
    │   └── Footer.tsx            # Footer with links
    └── sections/
        ├── HeroSection.tsx
        ├── AboutSection.tsx
        ├── ServicesSection.tsx
        ├── HowItWorksSection.tsx
        ├── WhyChooseUsSection.tsx
        ├── TestimonialsSection.tsx
        ├── ContactSection.tsx
        ├── FreelancerApplicationForm.tsx
        └── ClientInquiryForm.tsx
```

---

## ⚙️ Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

Key variables:

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Email delivery for form submissions ([resend.com](https://resend.com)) |
| `CONTACT_TO_EMAIL` | Where form submissions are sent |
| `CONTACT_FROM_EMAIL` | Verified sender address in Resend |
| `HUBSPOT_API_KEY` | (Optional) HubSpot CRM integration |
| `AIRTABLE_API_KEY` | (Optional) Airtable database integration |

### 3. Enable email sending

In `src/app/api/contact/route.ts`, `apply/route.ts`, and `hire/route.ts`, uncomment the Resend section once your API key is configured.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📧 Form Submission Flow

All three forms (Contact, Freelancer Apply, Client Hire) POST to their respective API routes:

- `POST /api/contact` — General contact inquiries
- `POST /api/apply` — Freelancer applications
- `POST /api/hire` — Client hiring requests

**Current state:** Submissions are logged to console.  
**To activate email:** Uncomment the Resend block in each API route and set `RESEND_API_KEY`.  
**Future CRM:** HubSpot and Airtable integration stubs are included as comments in each route.

---

## 🌐 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set all environment variables in your Vercel project dashboard under **Settings → Environment Variables**.

### Netlify

```bash
npm run build
# Deploy the .next/out folder or connect your Git repo
```

---

## 🎨 Brand Guidelines

| Token | Value |
|---|---|
| Primary Blue | `#007BFF` |
| Background White | `#FFFFFF` |
| Surface Gray | `#F8F9FA` |
| Text Dark | `#212529` |
| Muted Text | `#6C757D` |
| Heading Font | Syne |
| Body Font | DM Sans |

---

## 📋 Pages & Routes

| Route | Description |
|---|---|
| `/` | Homepage (Hero, About, Services, How It Works, Why Us, Testimonials, Contact) |
| `/apply` | Freelancer Application page + form |
| `/hire` | Client Hiring Request page + form |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |

---

## 🔮 Future Roadmap

- [ ] CMS integration (Contentful or Sanity) for content management
- [ ] HubSpot / Airtable CRM live integration
- [ ] Google Analytics via `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- [ ] Blog / Resources section
- [ ] Freelancer portal (authenticated dashboard)
- [ ] Multilingual support (EN + PH)
