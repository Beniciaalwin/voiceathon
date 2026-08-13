import fetch from 'node-fetch';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export interface LLMOutcomeResult {
  call_connected: boolean;
  participant_answered: boolean;
  interest: 'interested' | 'not_interested' | 'follow_up' | 'unclear' | 'unknown';
  follow_up_required: boolean;
  reminder_required: boolean;
  participated: boolean;
  required_condition: 'completed' | 'pending' | 'not_completed' | 'not_discussed';
  phone_valid: boolean;
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
  number_status: 'Purchased' | 'Not Purchased' | 'Planning to Purchase' | 'Already Has It' | 'Not Required' | 'Unclear';
  number_reason: string;
  needs_review: boolean;
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
      call_connected: false,
      participant_answered: false,
      interest: 'unknown',
      follow_up_required: false,
      reminder_required: false,
      participated: false,
      required_condition: 'not_discussed',
      phone_valid: true,
      final_outcome: 'not_started',
      confidence: 1.0,
      reason: 'No calls recorded yet.',
      number_status: 'Unclear',
      number_reason: 'No calls recorded yet.',
      needs_review: false,
    };
  }

  // Format all call history chronologically
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

  const prompt = `You are an AI Hackathon Call Verification Audit Assistant for Voiceathon 2026.
Analyze the following chronological call history of a participant. Return ONLY a valid JSON object matching the requested schema. No extra text or markdown blocks.

## Participant Chronological Call History
${callHistoryText}

## Mapping Guidelines & Business Rules:
1. "call_connected": Set to true if at least one call connected successfully (duration > 0 and status is not failed).
2. "participant_answered": Set to true if a human actually responded and talked (conversational transcript exists in at least one call).
3. "interest":
   - "interested": Confirmed they want to participate in Voiceathon (e.g. "I already registered").
   - "not_interested": Explicitly declined/withdrew (e.g. "I will not participate", "I am not interested").
   - "follow_up": Requested to be called back later or tomorrow, or needs more time to decide.
   - "unclear": If they are unsure or statements conflict.
   - "unknown": Call dropped or ended before interest could be established.
4. "follow_up_required": true if participant asked to be called back, needs more info, promised to buy/register later, or call dropped.
5. "reminder_required": true if participant requested a reminder for deadline/ceremony.
6. "participated": true only if they confirmed they are active, building, or participating in the event.
7. "required_condition":
   - "completed": Confirmed they purchased/activated the required phone number (e.g. "I bought the phone number already", "I already have the required number").
   - "pending": promised to buy it later or tomorrow (e.g. "I'll buy the number tomorrow", "I'm planning to get it soon").
   - "not_completed": explicitly refused to buy or said they won't do it.
   - "not_discussed": default if not mentioned in the transcripts.
8. "phone_valid": true unless wrong number/invalid number outcome is evident in all calls.
9. "final_outcome":
   - "invalid_number" / "call_failed": if call failed or was invalid number.
   - "no_answer": if participant did not answer any calls.
   - "not_interested": if they explicitly declined.
   - "follow_up_pending": if they requested a callback, call tomorrow, or promised to buy/build later.
   - "reminder_pending": if they requested a reminder.
   - "completed": if they confirmed they completed the required number purchase condition.
   - "not_completed": if they explicitly said they did not buy/register the item and won't do it.
   - "participated": if they confirmed interest and participation but haven't bought number yet.
   - "unclear": if transcripts do not provide enough evidence or are ambiguous. DO NOT GUESS.
10. "needs_review": true if final_outcome is unclear or if evidence is ambiguous/missing.
11. "number_status":
   - "Purchased": if they bought it.
   - "Not Purchased": if they explicitly said they did not buy it.
   - "Planning to Purchase": if they plan to get it.
   - "Already Has It": if they already have one.
   - "Not Required": if they don't need one.
   - "Unclear": if not discussed or ambiguous.
12. "number_reason": 1-sentence description explaining phone number status.
13. "reason": 1-sentence description explaining the final outcome.

## Context Understanding Rules:
- "I'm not interested right now, maybe call me tomorrow" -> interest: "follow_up", final_outcome: "follow_up_pending".
- "Maybe, I'll decide later" -> interest: "unclear", final_outcome: "unclear", needs_review: true.
- "I already registered for the Voiceathon" -> interest: "interested", participated: true, final_outcome: "participated" (or "completed" if phone bought).
- "I couldn't talk now, call me later" -> interest: "unknown", follow_up_required: true, final_outcome: "follow_up_pending".
- Call completed but participant never answered -> participant_answered: false, final_outcome: "no_answer".
- "I'll get the number after I confirm my participation" -> required_condition: "pending", final_outcome: "follow_up_pending".
- OVERRIDING RULE: Chronologically later calls override earlier ones. If Call 1 is interested but Call 2 declines, final_outcome is "not_interested". If Call 1 is pending but Call 2 confirms purchase, final_outcome is "completed".
- EVIDENCE RULE: If there is not enough evidence to verify, set final_outcome to "unclear" and needs_review to true. DO NOT GUESS.

## Return format (Strict JSON object):
{
  "call_connected": boolean,
  "participant_answered": boolean,
  "interest": "interested" | "not_interested" | "follow_up" | "unclear" | "unknown",
  "follow_up_required": boolean,
  "reminder_required": boolean,
  "participated": boolean,
  "required_condition": "completed" | "pending" | "not_completed" | "not_discussed",
  "phone_valid": boolean,
  "final_outcome": "no_answer" | "not_interested" | "follow_up_pending" | "reminder_pending" | "participated" | "completed" | "not_completed" | "call_failed" | "invalid_number" | "unclear" | "not_started",
  "confidence": number,
  "reason": "explanation of final outcome based on transcripts",
  "number_status": "Purchased" | "Not Purchased" | "Planning to Purchase" | "Already Has It" | "Not Required" | "Unclear",
  "number_reason": "explanation of number status based on transcripts",
  "needs_review": boolean
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
        temperature: 0.15,
        max_tokens: 450,
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
    console.error('[Groq Unified Analysis Error]', err.message);

    // Chronicle aggregation fallback
    const latestLog = logs[logs.length - 1];
    const text = ((latestLog.summary || '') + ' ' + (latestLog.transcript || '')).toLowerCase();
    const isDeclined = text.includes('not interested') || text.includes('declined') || text.includes('opt out');
    const isCallBack = text.includes('call back') || text.includes('call tomorrow') || text.includes('callback') || text.includes('later');
    const isBought = text.includes('bought') || text.includes('purchased') || text.includes('got a number');
    const isBuild = text.includes('build') || text.includes('building') || text.includes('coding');

    let interest: 'interested' | 'not_interested' | 'follow_up' | 'unclear' | 'unknown' = 'unknown';
    if (isDeclined) interest = 'not_interested';
    else if (isCallBack) interest = 'follow_up';
    else if (isBought || isBuild) interest = 'interested';

    return {
      call_connected: true,
      participant_answered: logs.some(l => (l.duration || 0) > 20),
      interest,
      follow_up_required: isCallBack || interest === 'follow_up',
      reminder_required: text.includes('remind'),
      participated: interest === 'interested',
      required_condition: isBought ? 'completed' : text.includes('buy tomorrow') ? 'pending' : 'not_discussed',
      phone_valid: true,
      final_outcome: isDeclined
        ? 'not_interested'
        : isCallBack
        ? 'follow_up_pending'
        : isBought
        ? 'completed'
        : 'participated',
      confidence: 0.5,
      reason: 'Fallback keyword analysis used due to Groq API error.',
      number_status: isBought ? 'Purchased' : text.includes('buy tomorrow') ? 'Planning to Purchase' : 'Unclear',
      number_reason: isBought ? 'Confirmed purchase.' : 'Ambiguous.',
      needs_review: interest === 'unknown',
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
  // Map single call into array format and run unified logic
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
