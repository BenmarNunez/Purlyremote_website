import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

interface RequestBody {
  query: string
}

interface Candidate {
  user_id: string
  full_name: string
  bio: string | null
  skills: string[]
  services: string[]
  hourly_rate: number | null
  availability: boolean
}

interface MatchResult {
  user_id: string
  score: number
  reason: string
}

const SYSTEM_PROMPT = `You match clients with remote freelancers from a candidate pool.

You will be given:
1. A client's free-text request describing what they need.
2. A JSON array of candidate freelancers, each with: user_id, full_name, bio, skills, services, hourly_rate, availability.

Pick the TOP 3 candidates that best match the request. Reply with ONLY a JSON object — no prose, no markdown:

{
  "matches": [
    { "user_id": "<uuid>", "score": <0-100>, "reason": "<one short sentence, max 120 chars>" }
  ]
}

Score reflects fit (skill overlap, service match, availability, budget if mentioned). Higher is better. Order descending. Return fewer than 3 only if the pool has fewer candidates.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (user.app_metadata?.role !== 'client') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const query = (body.query ?? '').trim()
  if (!query) return NextResponse.json({ error: 'Query required.' }, { status: 400 })
  if (query.length > 1000) return NextResponse.json({ error: 'Query too long (max 1000 chars).' }, { status: 400 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Matching service unavailable.' }, { status: 503 })
  }

  // Load approved freelancers
  const { data: freelancers, error: dbErr } = await adminClient
    .from('freelancer_profiles')
    .select('user_id, full_name, bio, skills, services, hourly_rate, availability')
    .eq('approved', true)
    .limit(50)

  if (dbErr) return NextResponse.json({ error: 'Failed to load candidates.' }, { status: 500 })

  const candidates = (freelancers ?? []) as Candidate[]
  if (candidates.length === 0) {
    return NextResponse.json({ matches: [] })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let raw: string
  try {
    const completion = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Client request:\n"""\n${query}\n"""\n\nCandidates:\n${JSON.stringify(candidates)}`,
        },
      ],
    })
    raw = completion.content[0].type === 'text' ? completion.content[0].text : ''
  } catch (err) {
    console.error('Anthropic match call failed:', err)
    return NextResponse.json({ error: 'Matching failed.' }, { status: 500 })
  }

  // Parse model output — strip code fences if present
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  let parsed: { matches?: MatchResult[] }
  try {
    parsed = JSON.parse(cleaned) as { matches?: MatchResult[] }
  } catch {
    return NextResponse.json({ error: 'Could not parse match response.' }, { status: 500 })
  }

  const validIds = new Set(candidates.map(c => c.user_id))
  const matches: MatchResult[] = (parsed.matches ?? [])
    .filter(m => validIds.has(m.user_id))
    .slice(0, 3)

  return NextResponse.json({ matches })
}
