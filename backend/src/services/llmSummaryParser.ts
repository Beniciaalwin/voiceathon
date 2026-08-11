export interface AgentLLMTicks {
  [key: string]: any;
}

export class LLMSummaryParser {
  private groqApiKey: string;

  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY || '';
  }

  public async parseSummaryToTicks(
    summary: string = '',
    transcript: string = '',
    agentId: string = '',
    rawPayload?: any
  ): Promise<AgentLLMTicks> {
    const apiKey = process.env.GROQ_API_KEY || this.groqApiKey;

    if (apiKey && apiKey.startsWith('gsk_')) {
      try {
        console.log('[Groq LLM] Executing Voiceathon 5-Agent Verification Checklist Evaluation...');
        return await this.callGroqAPI(summary, transcript, agentId, apiKey, rawPayload);
      } catch (err: any) {
        console.error('[Groq LLM Error] Falling back to Voiceathon rule parser:', err.message);
      }
    }

    return this.fallbackRuleParser(summary, transcript, agentId, rawPayload);
  }

  private async callGroqAPI(
    summary: string,
    transcript: string,
    agentId: string,
    apiKey: string,
    rawPayload?: any
  ): Promise<AgentLLMTicks> {
    const jsonString = rawPayload ? JSON.stringify(rawPayload, null, 2) : '';

    const prompt = `You are an AI Hackathon Call Verification Audit Assistant for Voiceathon 2026.
Analyze the FULL JSON payload, call summary, evidence, notes, and transcript for Agent ID "${agentId}".
Evaluate the conversation and return ONLY a raw JSON object with status fields set to "verified", "not_yet", or "not_asked".

Checklist mappings per agent:
Agent 1 ("agent_registration" or "agent_snapserve_01" or "456"): Return object key "agent1" with:
  welcomeConnected ("verified" | "not_yet"),
  interestedInParticipating ("verified" | "not_yet"),
  phoneNumberPurchased ("verified" | "not_yet" | "not_asked"),
  agentBuildStarted ("verified" | "not_yet" | "not_asked"),
  aug21DeadlineConveyed ("verified" | "not_yet").

Agent 2 ("agent_tech_screening"): Return object key "agent2" with:
  reconnectConnected ("verified" | "not_yet"),
  phoneNumberPurchased ("verified" | "not_yet" | "not_asked"),
  agentBuildCompleted ("verified" | "not_yet" | "not_asked"),
  helpOfferedStuckPoints ("verified" | "not_asked"),
  submissionRequirementReconfirmed ("verified" | "not_yet").

Agent 3 ("agent_confirmation"): Return object key "agent3" with:
  reconnectConnected ("verified" | "not_yet"),
  phoneNumberPurchased ("verified" | "not_yet" | "not_asked"),
  agentBuildCompleted ("verified" | "not_yet" | "not_asked"),
  agentTested ("verified" | "not_yet" | "not_asked"),
  submissionOnTrack ("verified" | "not_yet").

Agent 4 ("agent_reminder"): Return object key "agent4" with:
  reconnectConnected ("verified" | "not_yet"),
  phoneNumberPurchased ("verified" | "not_yet" | "not_asked"),
  agentBuildCompleted ("verified" | "not_yet" | "not_asked"),
  submittedOnPlatform ("verified" | "not_yet" | "not_asked"),
  callbackOfferedDoubts ("verified" | "not_yet").

Agent 5 ("agent_feedback"): Return object key "agent5" with:
  reconnectConnected ("verified" | "not_yet"),
  phoneNumberWorking ("verified" | "not_yet"),
  agentWorking ("verified" | "not_yet"),
  submissionConfirmedOnFile ("verified" | "not_yet"),
  eventLogisticsReconfirmed ("verified" | "not_yet").

Full Raw JSON Event Payload:
${jsonString || 'N/A'}

Call Summary: "${summary}"
Call Transcript & Evidence: "${transcript}"`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API returned HTTP ${res.status}: ${errText}`);
    }

    const json = await res.json();
    return JSON.parse(json.choices[0].message.content);
  }

  private fallbackRuleParser(summary: string, transcript: string, agentId: string, rawPayload?: any): AgentLLMTicks {
    const rawStr = rawPayload ? JSON.stringify(rawPayload).toLowerCase() : '';
    const text = (summary + ' ' + transcript + ' ' + rawStr).toLowerCase();
    const isCompleted = !text.includes('failed') && !text.includes('unreachable') && !text.includes('wrong number');
    const isNotInterested =
      text.includes('not interested') ||
      text.includes('lack of interest') ||
      text.includes('declined') ||
      text.includes('not_interested') ||
      text.includes('no further assistance') ||
      text.includes('opt out') ||
      text.includes('cancel');

    const hasPhonePurchased =
      text.includes('number purchased') ||
      text.includes('purchased phone') ||
      text.includes('purchased a phone') ||
      text.includes('purchased a number') ||
      text.includes('bought phone') ||
      text.includes('bought number') ||
      text.includes('obtained a number') ||
      text.includes('obtained number') ||
      text.includes('paid the bill') ||
      text.includes('got a number') ||
      text.includes('got number') ||
      text.includes('has a number') ||
      text.includes('has phone number');

    const hasBuildStarted =
      text.includes('build started') ||
      text.includes('agent build') ||
      text.includes('started building') ||
      text.includes('start பண்ணி') ||
      text.includes('start பண்ணிட்டேன்') ||
      text.includes('built agent') ||
      text.includes('built the agent') ||
      text.includes('built an agent') ||
      text.includes('built his agent') ||
      text.includes('building an agent') ||
      text.includes('building the agent') ||
      text.includes('building his agent') ||
      text.includes('building his voice agent') ||
      text.includes('building her agent') ||
      text.includes('build their agent') ||
      text.includes('building their agent') ||
      text.includes('progress of building') ||
      text.includes('customer started building');

    const hasDeadlineConveyed =
      text.includes('aug 21') ||
      text.includes('august 21') ||
      text.includes('21 august') ||
      text.includes('aug 20') ||
      text.includes('august 20') ||
      text.includes('20 august') ||
      text.includes('september 5') ||
      text.includes('deadline') ||
      text.includes('submit by');

    if (agentId === 'agent_registration' || agentId === 'agent_snapserve_01' || agentId === '456' || !agentId) {
      return {
        agent1: {
          welcomeConnected: isCompleted ? 'verified' : 'not_yet',
          interestedInParticipating: isCompleted && !isNotInterested ? 'verified' : 'not_yet',
          phoneNumberPurchased: !isNotInterested && hasPhonePurchased ? 'verified' : 'not_yet',
          agentBuildStarted: !isNotInterested && hasBuildStarted ? 'verified' : 'not_yet',
          aug21DeadlineConveyed: !isNotInterested && hasDeadlineConveyed ? 'verified' : 'not_yet',
        },
      };
    }

    if (agentId === 'agent_tech_screening' || agentId === 'agent_snapserve_02' || agentId === '457') {
      return {
        agent2: {
          reconnectConnected: isCompleted ? 'verified' : 'not_yet',
          phoneNumberPurchased: !isNotInterested && hasPhonePurchased ? 'verified' : 'not_asked',
          agentBuildCompleted: !isNotInterested && hasBuildStarted ? 'verified' : 'not_asked',
          helpOfferedStuckPoints: isCompleted ? 'verified' : 'not_asked',
          submissionRequirementReconfirmed: !isNotInterested && hasDeadlineConveyed ? 'verified' : 'not_yet',
        },
      };
    }

    return {
      agent1: {
        welcomeConnected: isCompleted ? 'verified' : 'not_yet',
        interestedInParticipating: isCompleted && !isNotInterested ? 'verified' : 'not_yet',
        phoneNumberPurchased: !isNotInterested && hasPhonePurchased ? 'verified' : 'not_yet',
        agentBuildStarted: !isNotInterested && hasBuildStarted ? 'verified' : 'not_yet',
        aug21DeadlineConveyed: !isNotInterested && hasDeadlineConveyed ? 'verified' : 'not_yet',
      },
    };
  }
}

export const llmSummaryParser = new LLMSummaryParser();
