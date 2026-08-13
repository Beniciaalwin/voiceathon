import fetch from 'node-fetch';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export interface CallAnalysisResult {
  leadId: string;
  phone: string;
  participantName: string | null;
  callDropped: boolean;
  durationSeconds: number;
  interest: 'interested' | 'not_interested' | 'call_dropped' | 'unknown';
  phoneBought: 'yes' | 'no' | 'not_discussed';
  agentBuild: 'completed' | 'in_progress' | 'not_started' | 'not_discussed';
  willAttendEvent: 'yes' | 'no' | 'maybe' | 'not_discussed';
  keyInsight: string;
  followUpNeeded: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export async function analyzeCallWithLLM(
  leadId: string,
  phone: string,
  webhookJson: Record<string, any>,
  durationSeconds: number,
  transcript: string,
  summary: string
): Promise<CallAnalysisResult> {

  // Fast path: clearly dropped call
  if (durationSeconds < 20 || !transcript || transcript.includes('No conversation took place')) {
    return {
      leadId,
      phone,
      participantName: null,
      callDropped: true,
      durationSeconds,
      interest: 'call_dropped',
      phoneBought: 'not_discussed',
      agentBuild: 'not_discussed',
      willAttendEvent: 'not_discussed',
      keyInsight: `Call dropped after ${durationSeconds}s — no conversation. Needs follow-up call.`,
      followUpNeeded: true,
      confidence: 'high',
    };
  }

  const llmTicks = webhookJson?.llm_ticks || {};
  const allTicks = {
    ...(llmTicks.agent1 || {}),
    ...(llmTicks.agent2 || {}),
    ...(llmTicks.agent3 || {}),
    ...(llmTicks.agent4 || {}),
  };

  const prompt = `You are analyzing a Voiceathon (Voice Agent Hackathon) participant call log. 
Read the following call data carefully and return ONLY valid JSON with NO explanation.

## Call Data
Duration: ${durationSeconds} seconds
LLM Ticks (from SnapServe AI): ${JSON.stringify(allTicks, null, 2)}
Call Summary: ${summary}
Transcript (first 800 chars): ${transcript.substring(0, 800)}

## Task
Extract the following information from the data above. If information is not available, use "not_discussed".

Return ONLY this JSON object, nothing else:
{
  "participantName": "string or null — real name if mentioned in transcript/summary",
  "interest": "interested|not_interested|call_dropped|unknown",
  "phoneBought": "yes|no|not_discussed — did participant buy a SnapServe phone number (199 rupees)?",
  "agentBuild": "completed|in_progress|not_started|not_discussed — did participant build/start their voice agent?",
  "willAttendEvent": "yes|no|maybe|not_discussed — will they attend Voiceathon event?",
  "keyInsight": "1 sentence max — most important thing from this call",
  "followUpNeeded": true|false,
  "confidence": "high|medium|low"
}

Rules:
- LLM Ticks are MOST reliable. If tick says "verified" → treat as confirmed "yes".
- If tick says "not_yet" → treat as "no".
- If tick says "not_asked" AND transcript confirms it → use transcript.
- If tick says "not_asked" AND transcript is unclear → "not_discussed".
- participantName: ONLY if clearly mentioned (e.g. "customer, John, called"). Not generic words like "customer" or "caller".`;

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Groq API Error]', err);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const content = data?.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
      leadId,
      phone,
      participantName: parsed.participantName || null,
      callDropped: false,
      durationSeconds,
      interest: parsed.interest || 'unknown',
      phoneBought: parsed.phoneBought || 'not_discussed',
      agentBuild: parsed.agentBuild || 'not_discussed',
      willAttendEvent: parsed.willAttendEvent || 'not_discussed',
      keyInsight: parsed.keyInsight || 'Call completed.',
      followUpNeeded: parsed.followUpNeeded ?? true,
      confidence: parsed.confidence || 'medium',
    };
  } catch (err: any) {
    console.error('[LLM Analysis Error]', err.message);
    // Fallback to tick-based analysis
    const phoneBoughtFromTick = allTicks.phoneNumberPurchased || allTicks.phonePurchased;
    const agentBuildFromTick = allTicks.agentBuildCompleted || allTicks.agentBuildStarted;
    return {
      leadId,
      phone,
      participantName: null,
      callDropped: false,
      durationSeconds,
      interest: 'unknown',
      phoneBought: phoneBoughtFromTick === 'verified' ? 'yes' : phoneBoughtFromTick === 'not_yet' ? 'no' : 'not_discussed',
      agentBuild: agentBuildFromTick === 'verified' ? 'completed' : agentBuildFromTick === 'not_yet' ? 'not_started' : 'not_discussed',
      willAttendEvent: 'not_discussed',
      keyInsight: 'LLM analysis unavailable. Tick-based fallback used.',
      followUpNeeded: true,
      confidence: 'low',
    };
  }
}
