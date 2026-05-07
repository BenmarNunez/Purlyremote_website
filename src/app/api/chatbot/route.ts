import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { adminClient } from '@/lib/supabase/admin'

const SYSTEM_PROMPT = `You are a helpful assistant for Purly Remote LLC, a remote staffing platform that connects clients with skilled Filipino remote professionals.
Your job is to help website visitors understand our services, find the right freelancer type for their needs, and collect their inquiry details.

Services we offer: Virtual Assistance, Customer Support, Data Entry, Social Media Management, Content Writing, Graphic Design, Web Development, Appointment Setting, Email Management, Lead Generation.

When a visitor asks about a service:
- Explain what we offer in that area
- Ask what their specific needs are
- Ask for their timeline and budget (casual, no pressure)
- Ask for their email for follow-up

When you have their service type and email:
- Tell them a team member will reach out within 24 hours
- Encourage them to create an account to browse freelancers directly

If no freelancer seems available for their need:
- Collect their request details
- Assure them the team will find the right match
- Provide estimated response time: within 24 hours

Keep responses short (2-4 sentences max), friendly, and professional.
Never make up specific pricing or availability details.`

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/

const SERVICES = [
  'Virtual Assistance',
  'Customer Support',
  'Data Entry',
  'Social Media Management',
  'Content Writing',
  'Graphic Design',
  'Web Development',
  'Appointment Setting',
  'Email Management',
  'Lead Generation',
]

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  messages: ChatMessage[]
  session_token: string
  email?: string
}

function extractEmailFromMessages(messages: ChatMessage[]): string | null {
  for (const msg of messages) {
    if (msg.role === 'user') {
      const match = msg.content.match(EMAIL_REGEX)
      if (match) return match[0]
    }
  }
  return null
}

function extractServiceFromMessages(messages: ChatMessage[]): string | null {
  const allText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ')
    .toLowerCase()

  for (const service of SERVICES) {
    if (allText.includes(service.toLowerCase())) {
      return service
    }
  }
  return null
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: RequestBody

  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { messages, session_token, email: bodyEmail } = body

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'messages must be a non-empty array' },
      { status: 400 }
    )
  }

  if (!session_token || typeof session_token !== 'string') {
    return NextResponse.json(
      { error: 'session_token must be a non-empty string' },
      { status: 400 }
    )
  }

  // Call Anthropic
  let responseText: string
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: messages,
    })

    responseText =
      completion.content[0].type === 'text' ? completion.content[0].text : ''
  } catch {
    return NextResponse.json(
      { error: 'Failed to get response' },
      { status: 500 }
    )
  }

  // Side effects: persist session and notify admin if email found
  const detectedEmail = extractEmailFromMessages(messages) ?? bodyEmail ?? null
  const detectedService = extractServiceFromMessages(messages)
  const lastUserMessage =
    [...messages].reverse().find((m) => m.role === 'user')?.content ?? null

  if (detectedEmail) {
    try {
      await adminClient.from('chatbot_sessions').upsert(
        {
          session_token,
          email: detectedEmail,
          service_needed: detectedService ?? null,
          notes: lastUserMessage,
          notified: false,
        },
        { onConflict: 'session_token' }
      )

      const { data: adminUsers } = await adminClient
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1)

      if (adminUsers && adminUsers.length > 0) {
        const adminId = (adminUsers[0] as { id: string }).id
        await adminClient.from('notifications').insert({
          user_id: adminId,
          type: 'chatbot_lead',
          title: 'New chatbot lead',
          content: `${detectedEmail} needs ${detectedService ?? 'assistance'}`,
        })
      }
    } catch {
      // Non-fatal: don't fail the response if DB side-effects fail
    }
  }

  return NextResponse.json({ response: responseText })
}
