import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, message, inquiry_type } = body;

    // Validate required fields
    if (!name || !email || !message) {
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
    //   subject: `New Contact Inquiry [${inquiry_type}] from ${name}`,
    //   html: `
    //     <h2>New Contact Inquiry</h2>
    //     <p><strong>Type:</strong> ${inquiry_type}</p>
    //     <p><strong>Name:</strong> ${name}</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Message:</strong></p>
    //     <p>${message}</p>
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
    //         firstname: name.split(" ")[0],
    //         lastname: name.split(" ").slice(1).join(" "),
    //         email,
    //         message,
    //         hs_lead_status: "NEW",
    //       },
    //     }),
    //   });
    // }

    console.log("Contact inquiry received:", { name, email, inquiry_type, message });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
