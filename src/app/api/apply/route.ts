import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      full_name,
      email,
      expertise_area,
      years_experience,
      portfolio_link,
      preferred_role,
      availability_status,
      additional_notes,
    } = body;

    if (!full_name || !email || !expertise_area || !years_experience) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // --- Email via Resend ---
    // Uncomment and configure once RESEND_API_KEY is set in .env.local
    //
    // const { Resend } = await import("resend");
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: process.env.CONTACT_FROM_EMAIL!,
    //   to: process.env.CONTACT_TO_EMAIL!,
    //   subject: `New Freelancer Application from ${full_name}`,
    //   html: `
    //     <h2>New Freelancer Application</h2>
    //     <p><strong>Name:</strong> ${full_name}</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Expertise:</strong> ${expertise_area}</p>
    //     <p><strong>Years of Experience:</strong> ${years_experience}</p>
    //     <p><strong>Preferred Role:</strong> ${preferred_role || "N/A"}</p>
    //     <p><strong>Portfolio:</strong> ${portfolio_link || "N/A"}</p>
    //     <p><strong>Availability:</strong> ${availability_status}</p>
    //     <p><strong>Notes:</strong> ${additional_notes || "N/A"}</p>
    //   `,
    // });

    // --- Airtable Integration (Future) ---
    // if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
    //   await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/FreelancerApplications`, {
    //     method: "POST",
    //     headers: {
    //       Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       fields: {
    //         "Full Name": full_name,
    //         "Email": email,
    //         "Expertise Area": expertise_area,
    //         "Years Experience": years_experience,
    //         "Portfolio Link": portfolio_link,
    //         "Preferred Role": preferred_role,
    //         "Availability": availability_status,
    //         "Notes": additional_notes,
    //         "Status": "Pending Review",
    //       },
    //     }),
    //   });
    // }

    console.log("Freelancer application received:", {
      full_name,
      email,
      expertise_area,
      availability_status,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Apply form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
