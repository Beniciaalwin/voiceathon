import fetch from 'node-fetch';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export interface LLMOutcomeResult {
  call_connected: boolean;
  participant_answered: boolean;
  interest: 'interested' | 'not_interested' | 'follow_up' | 'unknown';
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
    | 'not_started';
  confidence: number;
  reason: string;
}

export async function analyzeCallOutcomeWithLLM(
  durationSeconds: number,
  callStatus: string,
  outcome: string,
  transcript: string,
  summary: string,
  agentId: string
): Promise<LLMOutcomeResult> {
  const apiKey = process.env.GROQ_API_KEY || GROQ_API_KEY;

  // Fast path for call drops / empty calls
  const isNoAnswer =
    callStatus === 'no_answer' ||
    callStatus === 'busy' ||
    outcome === 'busy' ||
    outcome === 'no_answer' ||
    durationSeconds < 20 ||
    !transcript ||
    transcript.includes('No conversation took place') ||
    transcript.toLowerCase().includes('conversation has just begun with the agent\'s greeting');

  if (isNoAnswer) {
    const isCallFailed = callStatus === 'failed' || outcome === 'failed';
    const isInvalidNumber = outcome === 'invalid' || outcome === 'wrong_number';

    return {
      call_connected: !isCallFailed && !isInvalidNumber,
      participant_answered: false,
      interest: 'unknown',
      follow_up_required: true, // Dropped calls/no answer should be retried (follow up needed)
      reminder_required: false,
      participated: false,
      required_condition: 'not_discussed',
      phone_valid: !isInvalidNumber,
      final_outcome: isInvalidNumber
        ? 'invalid_number'
        : isCallFailed
        ? 'call_failed'
        : 'no_answer',
      confidence: 1.0,
      reason: isInvalidNumber
        ? 'Invalid or wrong phone number.'
        : isCallFailed
        ? 'AI call failed to connect.'
        : `Call dropped/no answer after ${durationSeconds} seconds.`,
    };
  }

  const prompt = `You are an AI Hackathon Call Verification Audit Assistant for Voiceathon 2026.
Analyze the following call logs and transcript. Return ONLY a valid JSON object matching the requested schema. No extra text.

## Call Details
Duration: ${durationSeconds} seconds
Call Status: ${callStatus}
Call Outcome: ${outcome}
Agent ID: ${agentId}
Call Summary: ${summary}
Transcript: ${transcript}

## Mapping Guidelines & Business Rules:
1. "call_connected": Set to true if the call connected successfully (duration > 0 and status is not failed).
2. "participant_answered": Set to true if a human actually responded and talked (conversational transcript exists).
3. "interest":
   - "interested": Confirmed they want to participate in Voiceathon.
   - "not_interested": Explicitly declined/withdrew (e.g. "I'm not interested", "I will not participate"). Exception: If they say "I'm not interested right now, call me tomorrow", this is "follow_up".
   - "follow_up": Requested to be called back later, tomorrow, or is unsure/needs time.
   - "unknown": Call ended before interest could be established.
4. "follow_up_required": true if participant asked to be called back, needs more info, promised to buy/register later, or call dropped.
5. "reminder_required": true if participant requested a reminder for deadline/ceremony.
6. "participated": true only if they confirmed they are active, building, or participating in the event.
7. "required_condition" (refers to purchasing a SnapServe phone number / registering):
   - "completed": Confirmed they purchased/activated the number (e.g. "I already bought it yesterday").
   - "pending": promised to buy it later or tomorrow (e.g. "I'll buy it tomorrow").
   - "not_completed": explicitly refused to buy or said they won't do it.
   - "not_discussed": default if not mentioned in the transcript.
8. "phone_valid": true unless wrong number/invalid number outcome is evident.
9. "final_outcome":
   - "invalid_number" / "call_failed": if call failed or was invalid number.
   - "no_answer": if participant did not answer.
   - "not_interested": if they explicitly declined.
   - "follow_up_pending": if they requested a callback or promised to buy/build later.
   - "reminder_pending": if they requested a reminder.
   - "completed": if they confirmed they bought/completed the required item.
   - "not_completed": if they explicitly said they did not buy/register the item and won't do it.
   - "participated": if they confirmed interest and participation but haven't bought number yet.

## Return format (Strict JSON object):
{
  "call_connected": boolean,
  "participant_answered": boolean,
  "interest": "interested" | "not_interested" | "follow_up" | "unknown",
  "follow_up_required": boolean,
  "reminder_required": boolean,
  "participated": boolean,
  "required_condition": "completed" | "pending" | "not_completed" | "not_discussed",
  "phone_valid": boolean,
  "final_outcome": "no_answer" | "not_interested" | "follow_up_pending" | "reminder_pending" | "participated" | "completed" | "not_completed" | "call_failed" | "invalid_number" | "not_started",
  "confidence": number (between 0.0 and 1.0),
  "reason": "1-sentence description explaining why this outcome was chosen based on the transcript"
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
        max_tokens: 350,
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
    console.error('[Groq Outcome Analysis Error]', err.message);

    // Dynamic fallback based on keyword parsing
    const text = (summary + ' ' + transcript).toLowerCase();
    const isDeclined = text.includes('not interested') || text.includes('declined') || text.includes('opt out');
    const isCallBack = text.includes('call back') || text.includes('call tomorrow') || text.includes('callback') || text.includes('later');
    const isBought = text.includes('bought') || text.includes('purchased') || text.includes('got a number');
    const isBuild = text.includes('build') || text.includes('building') || text.includes('coding');

    let interest: 'interested' | 'not_interested' | 'follow_up' | 'unknown' = 'unknown';
    if (isDeclined) interest = 'not_interested';
    else if (isCallBack) interest = 'follow_up';
    else if (isBought || isBuild) interest = 'interested';

    return {
      call_connected: true,
      participant_answered: true,
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
    };
  }
}
