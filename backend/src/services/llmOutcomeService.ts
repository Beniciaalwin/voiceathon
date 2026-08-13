import fetch from 'node-fetch';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export interface LLMOutcomeResult {
  participant?: string;
  interest: {
    status: 'confirmed' | 'declined' | 'unclear' | 'no_evidence';
    evidence: string | null;
    confidence: number;
  };
  participation: {
    status: 'confirmed' | 'promised_pending' | 'declined' | 'no_evidence';
    evidence: string | null;
    confidence: number;
  };
  follow_up: {
    status: 'pending' | 'completed' | 'not_required' | 'no_evidence';
    evidence: string | null;
    confidence: number;
  };
  reminder: {
    status: 'pending' | 'completed' | 'not_required' | 'no_evidence';
    evidence: string | null;
    confidence: number;
  };
  number: {
    status: 'purchased' | 'already_has' | 'planning_pending' | 'not_purchased' | 'not_required' | 'no_evidence';
    evidence: string | null;
    confidence: number;
  };
  final_outcome:
    | 'no_answer'
    | 'not_interested'
    | 'follow_up_pending'
    | 'reminder_pending'
    | 'participated'
    | 'completed'
    | 'not_completed'
    | 'call_failed'
    | 'invalid_number'
    | 'unclear'
    | 'not_started';
  confidence: number;
  reason: string;
}

export async function analyzeUnifiedParticipantOutcomeWithLLM(
  logs: Array<{
    duration: number;
    call_status: string;
    outcome?: string;
    transcript?: string;
    summary?: string;
    agent_id?: string;
    created_at?: string;
  }>
): Promise<LLMOutcomeResult> {
  const apiKey = process.env.GROQ_API_KEY || GROQ_API_KEY;

  if (!logs || logs.length === 0) {
    return {
      participant: 'Unknown',
      interest: { status: 'no_evidence', evidence: null, confidence: 1.0 },
      participation: { status: 'no_evidence', evidence: null, confidence: 1.0 },
      follow_up: { status: 'no_evidence', evidence: null, confidence: 1.0 },
      reminder: { status: 'no_evidence', evidence: null, confidence: 1.0 },
      number: { status: 'no_evidence', evidence: null, confidence: 1.0 },
      final_outcome: 'not_started',
      confidence: 1.0,
      reason: 'No call history found.',
    };
  }

  // Check if any call connected
  const hasConnected = logs.some(l => l.duration > 0 && l.call_status !== 'failed');
  const hasAnswered = logs.some(l => l.duration >= 20 && l.transcript && !l.transcript.includes('No conversation took place'));

  if (!hasConnected) {
    const isInvalid = logs.some(l => l.outcome === 'invalid' || l.outcome === 'wrong_number');
    return {
      participant: 'Unknown',
      interest: { status: 'no_evidence', evidence: null, confidence: 1.0 },
      participation: { status: 'no_evidence', evidence: null, confidence: 1.0 },
      follow_up: { status: 'no_evidence', evidence: null, confidence: 1.0 },
      reminder: { status: 'no_evidence', evidence: null, confidence: 1.0 },
      number: { status: 'no_evidence', evidence: null, confidence: 1.0 },
      final_outcome: isInvalid ? 'invalid_number' : 'call_failed',
      confidence: 1.0,
      reason: isInvalid ? 'Invalid or wrong phone number.' : 'All call attempts failed to connect.',
    };
  }

  if (!hasAnswered) {
    return {
      participant: 'Unknown',
      interest: { status: 'no_evidence', evidence: null, confidence: 1.0 },
      participation: { status: 'no_evidence', evidence: null, confidence: 1.0 },
      follow_up: { status: 'no_evidence', evidence: null, confidence: 1.0 },
      reminder: { status: 'no_evidence', evidence: null, confidence: 1.0 },
      number: { status: 'no_evidence', evidence: null, confidence: 1.0 },
      final_outcome: 'no_answer',
      confidence: 1.0,
      reason: 'Call connected but participant did not answer or hung up immediately.',
    };
  }

  // Format call history chronologically
  const callHistoryText = logs
    .map((log, idx) => {
      return `Call #${idx + 1} (${log.created_at || 'unknown date'}):
Agent ID: ${log.agent_id || 'unknown'}
Call Status: ${log.call_status}
Outcome: ${log.outcome || 'unknown'}
Duration: ${log.duration} seconds
Summary: ${log.summary || 'no summary'}
Transcript: ${log.transcript || 'no transcript'}`;
    })
    .join('\n\n---\n\n');

  const prompt = `You are a strict Voiceathon 2026 AI Participant Audit Assistant.
Analyze the following chronological call history of a participant. Return ONLY a valid JSON object matching the requested schema. Do NOT guess or assume any status without explicit evidence in the transcripts or summaries.

## Participant Chronological Call History
${callHistoryText}

## Strict Evidence Rules & Mappings:

1. interest:
   - status: 
     - "confirmed": ONLY if the participant explicitly says they are interested or want to join (e.g., "Yes, I am interested in joining the Voiceathon").
     - "declined": if they explicitly reject or withdraw (e.g., "No, I'm not interested").
     - "unclear": if they say "I am not sure yet" or make conflicting statements.
     - "no_evidence": if not mentioned.
   - evidence: Exact quote or short explanation of the explicit interest confirmation/decline. Null if no_evidence.
   
2. participation:
   - status:
     - "confirmed": ONLY if they confirm they have registered/completed participation (e.g., "Yes, I have confirmed my participation", "I already registered").
     - "promised_pending": if they say they will participate soon or tomorrow but have NOT yet completed it (e.g., "I will participate tomorrow").
     - "declined": if they explicitly decline participation.
     - "no_evidence": if not discussed.
   - evidence: Exact quote or short explanation of confirmation/promised status. Null if no_evidence.

3. follow_up:
   - status:
     - "pending": if they ask to be called back later, tomorrow, or at a specific time (e.g., "Call me tomorrow").
     - "completed": ONLY if a later callback transcript shows they were successfully reached after a follow-up request.
     - "not_required": if they never requested a callback.
     - "no_evidence": default.
   - evidence: Quote of follow-up request or evidence of callback completion. Null if no_evidence/not_required.

4. reminder:
   - status:
     - "pending": if they explicitly request a reminder call or message for deadline/ceremony.
     - "completed": if a later call transcript confirms the reminder was conveyed.
     - "not_required": default.
     - "no_evidence": default.
   - evidence: Quote of reminder request or proof of reminder delivery. Null if no_evidence.

5. number:
   - status:
     - "purchased": if they explicitly confirm they bought/activated the required phone number (e.g., "I already bought it").
     - "already_has": if they confirm they already own/have the required number (e.g., "I already have it").
     - "planning_pending": if they say they will buy it tomorrow or soon (e.g., "I'll buy it tomorrow").
     - "not_purchased": if they explicitly say they did not buy it.
     - "not_required": if explicitly stated they do not need one.
     - "no_evidence": default if not discussed.
   - evidence: Quote confirming the number status. Null if no_evidence.

6. final_outcome:
   - "invalid_number" / "call_failed": if call failed or was invalid.
   - "no_answer": if participant did not answer.
   - "not_interested": if they declined interest.
   - "follow_up_pending": if they requested callback or promised to register/buy later.
   - "reminder_pending": if reminder requested.
   - "completed": if participation is confirmed AND number purchased.
   - "not_completed": if explicitly refused number purchase/participation.
   - "participated": if participation confirmed but number status is planning_pending/no_evidence.
   - "unclear": if statements are ambiguous or they are unsure ("I am not sure yet").
   - "not_started": default.

7. confidence: confidence score (between 0.0 and 1.0).
8. reason: 1-sentence explanation of the overall final outcome.

## Overriding & Evidence Rule:
- Chronologically later calls override earlier ones.
- DO NOT AUTO-TICK OR GUESS. If there is no explicit citation or statement, status MUST be "no_evidence" or "not_required" and evidence MUST be null.
- A "completed call" status in the system DOES NOT mean participation is confirmed.

## Return format (Strict JSON object, no markdown wrappers):
{
  "participant": "name of participant or Unknown",
  "interest": {
    "status": "confirmed" | "declined" | "unclear" | "no_evidence",
    "evidence": string or null,
    "confidence": number
  },
  "participation": {
    "status": "confirmed" | "promised_pending" | "declined" | "no_evidence",
    "evidence": string or null,
    "confidence": number
  },
  "follow_up": {
    "status": "pending" | "completed" | "not_required" | "no_evidence",
    "evidence": string or null,
    "confidence": number
  },
  "reminder": {
    "status": "pending" | "completed" | "not_required" | "no_evidence",
    "evidence": string or null,
    "confidence": number
  },
  "number": {
    "status": "purchased" | "already_has" | "planning_pending" | "not_purchased" | "not_required" | "no_evidence",
    "evidence": string or null,
    "confidence": number
  },
  "final_outcome": "no_answer" | "not_interested" | "follow_up_pending" | "reminder_pending" | "participated" | "completed" | "not_completed" | "call_failed" | "invalid_number" | "unclear" | "not_started",
  "confidence": number,
  "reason": "explanation string"
}`;

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API returned HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json() as any;
    const content = data?.choices?.[0]?.message?.content || '{}';
    return JSON.parse(content) as LLMOutcomeResult;
  } catch (err: any) {
    console.error('[Groq Strict Analysis Error]', err.message);

    // Fallback keyword parsing (strictly following rules)
    const latestLog = logs[logs.length - 1];
    const text = ((latestLog.summary || '') + ' ' + (latestLog.transcript || '')).toLowerCase();
    
    const isDeclined = text.includes('not interested') || text.includes('declined') || text.includes('opt out');
    const isInterested = text.includes('join the voiceathon') || text.includes('interested in joining');
    const isParticipated = text.includes('confirmed my participation') || text.includes('already registered');
    const isWillParticipate = text.includes('will participate tomorrow') || text.includes('will participate');
    
    const isCallBack = text.includes('call me tomorrow') || text.includes('call back');
    const isBought = text.includes('already bought') || text.includes('purchased') || text.includes('already have');
    const isBuyTomorrow = text.includes('buy it tomorrow') || text.includes('planning to get');
    const isNotBought = text.includes("haven't bought") || text.includes("not bought");

    return {
      participant: 'Fallback',
      interest: {
        status: isInterested ? 'confirmed' : isDeclined ? 'declined' : 'no_evidence',
        evidence: isInterested ? 'Fallback interested' : null,
        confidence: 0.6
      },
      participation: {
        status: isParticipated ? 'confirmed' : isWillParticipate ? 'promised_pending' : 'no_evidence',
        evidence: isParticipated ? 'Fallback participated' : null,
        confidence: 0.6
      },
      follow_up: {
        status: isCallBack ? 'pending' : 'not_required',
        evidence: isCallBack ? 'Fallback callback' : null,
        confidence: 0.6
      },
      reminder: {
        status: text.includes('remind') ? 'pending' : 'not_required',
        evidence: null,
        confidence: 0.6
      },
      number: {
        status: isBought ? 'purchased' : isBuyTomorrow ? 'planning_pending' : isNotBought ? 'not_purchased' : 'no_evidence',
        evidence: isBought ? 'Fallback bought' : null,
        confidence: 0.6
      },
      final_outcome: isDeclined
        ? 'not_interested'
        : isCallBack
        ? 'follow_up_pending'
        : isBought
        ? 'completed'
        : 'unclear',
      confidence: 0.5,
      reason: 'Fallback keyword analysis used due to Groq API error.',
    };
  }
}

export async function analyzeCallOutcomeWithLLM(
  durationSeconds: number,
  callStatus: string,
  outcome: string,
  transcript: string,
  summary: string,
  agentId: string
): Promise<LLMOutcomeResult> {
  return analyzeUnifiedParticipantOutcomeWithLLM([
    {
      duration: durationSeconds,
      call_status: callStatus,
      outcome,
      transcript,
      summary,
      agent_id: agentId,
    },
  ]);
}
