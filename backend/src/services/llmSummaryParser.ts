import dotenv from 'dotenv';
dotenv.config();

export interface AgentLLMTicks {
  agent1?: {
    phoneValidated: boolean;
    welcomeCallConnected: boolean;
    trackQuestionsAnswered: boolean;
    onboardingEmailDispatched: boolean;
    noEscalationPending: boolean;
  };
  agent2?: {
    techScreeningCompleted: boolean;
    architectureVerified: boolean;
    repoGuidelinesConfirmed: boolean;
    mentorEscalationChecked: boolean;
  };
  agent3?: {
    confirmationCallConnected: boolean;
    attendanceConfirmed: boolean;
    discordJoined: boolean;
    hardwareReadinessChecked: boolean;
  };
  agent4?: {
    ceremonyReminderDelivered: boolean;
    scheduleAcknowledged: boolean;
    portalAccessVerified: boolean;
    countdownConfirmed: boolean;
  };
  agent5?: {
    surveyCallCompleted: boolean;
    ratingRecorded: boolean;
    demoVideoVerified: boolean;
    certificateDispatched: boolean;
  };
}

export class LLMSummaryParser {
  private groqApiKey: string;

  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY || '';
  }

  /**
   * Main Entrypoint: Uses Groq LLM API if GROQ_API_KEY exists,
   * otherwise falls back to ultra-fast built-in NLP pattern matching.
   */
  public async parseSummaryToTicks(
    summary: string = '',
    transcript: string = '',
    agentId: string = ''
  ): Promise<AgentLLMTicks> {
    const apiKey = process.env.GROQ_API_KEY || this.groqApiKey;

    if (apiKey && apiKey.startsWith('gsk_')) {
      try {
        console.log('[Groq LLM] Calling Groq Cloud API (llama-3.3-70b-versatile)...');
        return await this.callGroqAPI(summary, transcript, agentId, apiKey);
      } catch (err: any) {
        console.error('[Groq LLM Error] Falling back to rule parser:', err.message);
      }
    }

    return this.fallbackRuleParser(summary, transcript, agentId);
  }

  /**
   * Groq Cloud Llama-3 API Call for Structured JSON Verification Ticks
   */
  private async callGroqAPI(
    summary: string,
    transcript: string,
    agentId: string,
    apiKey: string
  ): Promise<AgentLLMTicks> {
    const prompt = `You are an AI Hackathon Call Verification Audit Assistant for SnapServe.
Analyze the following call summary and transcript for Agent ID "${agentId}".
Evaluate the conversation and return ONLY a raw JSON object containing boolean true/false flags for verification ticks.

Agent ID mapping:
- Agent 1 ("agent_registration" or "agent_snapserve_01"): Return object key "agent1" with fields:
  phoneValidated (boolean), welcomeCallConnected (boolean), trackQuestionsAnswered (boolean), onboardingEmailDispatched (boolean), noEscalationPending (boolean).
- Agent 2 ("agent_tech_screening"): Return object key "agent2" with fields:
  techScreeningCompleted (boolean), architectureVerified (boolean), repoGuidelinesConfirmed (boolean), mentorEscalationChecked (boolean).
- Agent 3 ("agent_confirmation"): Return object key "agent3" with fields:
  confirmationCallConnected (boolean), attendanceConfirmed (boolean), discordJoined (boolean), hardwareReadinessChecked (boolean).
- Agent 4 ("agent_reminder"): Return object key "agent4" with fields:
  ceremonyReminderDelivered (boolean), scheduleAcknowledged (boolean), portalAccessVerified (boolean), countdownConfirmed (boolean).
- Agent 5 ("agent_feedback"): Return object key "agent5" with fields:
  surveyCallCompleted (boolean), ratingRecorded (boolean), demoVideoVerified (boolean), certificateDispatched (boolean).

Call Summary: "${summary}"
Call Transcript: "${transcript}"`;

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
    const parsedObj = JSON.parse(json.choices[0].message.content);
    console.log('[Groq LLM Extracted Ticks Successfully]', parsedObj);
    return parsedObj;
  }

  /**
   * Fast Fallback Rule Parser
   */
  private fallbackRuleParser(summary: string, transcript: string, agentId: string): AgentLLMTicks {
    const text = (summary + ' ' + transcript).toLowerCase();

    const isCompleted = !text.includes('failed') && !text.includes('unreachable') && !text.includes('wrong number');
    const isPositive = isCompleted && (text.includes('confirm') || text.includes('agree') || text.includes('ready') || text.includes('accepted') || text.includes('answered') || text.includes('yes'));
    const hasCallback = text.includes('callback') || text.includes('follow-up') || text.includes('clarify');

    if (agentId === 'agent_registration' || agentId === 'agent_snapserve_01' || !agentId) {
      return {
        agent1: {
          phoneValidated: !text.includes('invalid') && !text.includes('wrong number'),
          welcomeCallConnected: isCompleted,
          trackQuestionsAnswered: isCompleted && (text.includes('track') || text.includes('question') || text.includes('inquiry') || isPositive),
          onboardingEmailDispatched: isCompleted || text.includes('email'),
          noEscalationPending: !hasCallback,
        },
      };
    }

    if (agentId === 'agent_tech_screening' || agentId === 'agent_snapserve_02') {
      return {
        agent2: {
          techScreeningCompleted: isCompleted,
          architectureVerified: isCompleted && (text.includes('tech') || text.includes('architecture') || text.includes('stack') || text.includes('llm') || isPositive),
          repoGuidelinesConfirmed: isCompleted && (text.includes('repo') || text.includes('github') || text.includes('rules') || isPositive),
          mentorEscalationChecked: !hasCallback,
        },
      };
    }

    if (agentId === 'agent_confirmation') {
      return {
        agent3: {
          confirmationCallConnected: isCompleted,
          attendanceConfirmed: isCompleted && (text.includes('attend') || text.includes('presence') || text.includes('ready') || isPositive),
          discordJoined: isCompleted && (text.includes('discord') || text.includes('channel') || isPositive),
          hardwareReadinessChecked: isCompleted,
        },
      };
    }

    if (agentId === 'agent_reminder') {
      return {
        agent4: {
          ceremonyReminderDelivered: isCompleted,
          scheduleAcknowledged: isCompleted && (text.includes('schedule') || text.includes('zoom') || text.includes('ceremony') || isPositive),
          portalAccessVerified: isCompleted && (text.includes('portal') || text.includes('submit') || isPositive),
          countdownConfirmed: isCompleted,
        },
      };
    }

    if (agentId === 'agent_feedback') {
      return {
        agent5: {
          surveyCallCompleted: isCompleted,
          ratingRecorded: isCompleted && (text.includes('rating') || text.includes('feedback') || text.includes('experience') || isPositive),
          demoVideoVerified: isCompleted && (text.includes('demo') || text.includes('video') || isPositive),
          certificateDispatched: isCompleted || text.includes('certificate'),
        },
      };
    }

    return {};
  }
}

export const llmSummaryParser = new LLMSummaryParser();
