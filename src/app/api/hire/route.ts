import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      company_name,
      contact_name,
      email,
      role_needed,
      required_skills_summary,
      project_scope,
      budget_range,
      timeline,
      additional_notes,
    } = body;

    if (!company_name || !contact_name || !email || !role_needed || !required_skills_summary) {
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
    //   subject: `New Hiring Request from ${company_name}`,
    //   html: `
    //     <h2>New Client Hiring Request</h2>
    //     <p><strong>Company:</strong> ${company_name}</p>
    //     <p><strong>Contact:</strong> ${contact_name}</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Role Needed:</strong> ${role_needed}</p>
    //     <p><strong>Required Skills:</strong> ${required_skills_summary}</p>
    //     <p><strong>Project Scope:</strong> ${project_scope || "N/A"}</p>
    //     <p><strong>Budget Range:</strong> ${budget_range || "N/A"}</p>
    //     <p><strong>Timeline:</strong> ${timeline || "N/A"}</p>
    //     <p><strong>Additional Notes:</strong> ${additional_notes || "N/A"}</p>
    //   `,
    // });

    // --- HubSpot CRM Integration (Future) ---
    // if (process.env.HUBSPOT_API_KEY) {
    //   await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
    //     method: "POST",
    //     headers: {
    //       Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       properties: {
    //         company: company_name,
    //         firstname: contact_name.split(" ")[0],
    //         lastname: contact_name.split(" ").slice(1).join(" "),
    //         email,
    //         jobtitle: role_needed,
    //         hs_lead_status: "NEW",
    //       },
    //     }),
    //   });
    // }

    console.log("Client hiring request received:", {
      company_name,
      contact_name,
      email,
      role_needed,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hire form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
