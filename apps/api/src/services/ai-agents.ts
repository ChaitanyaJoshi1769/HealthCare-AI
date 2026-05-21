import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import type { AgentMessage, AgentType, ToolCall, ToolResult } from '@healthos/types';
import { generateId } from '@healthos/shared';

const client = new Anthropic({
  apiKey: config.ANTHROPIC_API_KEY,
});

// Tool definitions for healthcare domain
const healthcareTools: Anthropic.Tool[] = [
  {
    name: 'search_medical_literature',
    description: 'Search PubMed and medical literature for relevant research articles',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query for medical literature',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'analyze_genetic_variant',
    description: 'Analyze genetic variants for pathogenicity and clinical significance',
    input_schema: {
      type: 'object' as const,
      properties: {
        chromosome: {
          type: 'string',
          description: 'Chromosome number',
        },
        position: {
          type: 'number',
          description: 'Position on chromosome',
        },
        ref: {
          type: 'string',
          description: 'Reference allele',
        },
        alt: {
          type: 'string',
          description: 'Alternate allele',
        },
      },
      required: ['chromosome', 'position', 'ref', 'alt'],
    },
  },
  {
    name: 'check_drug_interactions',
    description: 'Check for potential drug interactions and contraindications',
    input_schema: {
      type: 'object' as const,
      properties: {
        medications: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of medications to check',
        },
      },
      required: ['medications'],
    },
  },
  {
    name: 'calculate_risk_score',
    description: 'Calculate personalized disease risk scores based on patient data',
    input_schema: {
      type: 'object' as const,
      properties: {
        condition: {
          type: 'string',
          description: 'Medical condition to assess risk for',
        },
        patientFactors: {
          type: 'object',
          description: 'Patient risk factors',
        },
      },
      required: ['condition', 'patientFactors'],
    },
  },
  {
    name: 'retrieve_clinical_guidelines',
    description: 'Retrieve relevant clinical guidelines and standards of care',
    input_schema: {
      type: 'object' as const,
      properties: {
        condition: {
          type: 'string',
          description: 'Medical condition',
        },
        specialty: {
          type: 'string',
          description: 'Medical specialty',
        },
      },
      required: ['condition'],
    },
  },
];

async function executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
  const toolName = toolCall.name;
  const toolInput = toolCall.input as Record<string, unknown>;

  // In production, these would call actual APIs
  // For demo, we'll return structured mock responses

  switch (toolName) {
    case 'search_medical_literature': {
      return {
        toolCallId: toolCall.id,
        content: JSON.stringify({
          results: [
            {
              pmid: '12345678',
              title: 'A comprehensive study on the condition',
              authors: ['Smith J', 'Johnson M'],
              year: 2023,
              relevanceScore: 0.92,
            },
          ],
          totalResults: 142,
        }),
        isError: false,
      };
    }

    case 'analyze_genetic_variant': {
      return {
        toolCallId: toolCall.id,
        content: JSON.stringify({
          variant: `${toolInput.chromosome}:${toolInput.position}`,
          pathogenicity: 'likely_pathogenic',
          clinicalSignificance: 'Increased risk for hereditary condition',
          alleleFrequency: 0.001,
          affectedGenes: ['BRCA1'],
        }),
        isError: false,
      };
    }

    case 'check_drug_interactions': {
      const medications = toolInput.medications as string[];
      return {
        toolCallId: toolCall.id,
        content: JSON.stringify({
          interactions: medications.length > 1 ? [] : [],
          warnings: ['Monitor liver function with this combination'],
          severity: medications.length > 1 ? 'moderate' : 'none',
        }),
        isError: false,
      };
    }

    case 'calculate_risk_score': {
      return {
        toolCallId: toolCall.id,
        content: JSON.stringify({
          condition: toolInput.condition,
          riskScore: Math.floor(Math.random() * 100),
          percentile: Math.floor(Math.random() * 100),
          riskLevel: 'moderate',
          contributors: ['Age', 'Family history', 'Lifestyle'],
        }),
        isError: false,
      };
    }

    case 'retrieve_clinical_guidelines': {
      return {
        toolCallId: toolCall.id,
        content: JSON.stringify({
          condition: toolInput.condition,
          guidelines: [
            {
              organization: 'American Medical Association',
              title: 'Clinical Practice Guidelines',
              recommendations: ['Screening recommended', 'Annual monitoring'],
            },
          ],
        }),
        isError: false,
      };
    }

    default: {
      return {
        toolCallId: toolCall.id,
        content: `Unknown tool: ${toolName}`,
        isError: true,
      };
    }
  }
}

export async function runHealthcareAgent(
  agentType: AgentType,
  userMessage: string,
  conversationHistory: AgentMessage[] = []
): Promise<{ response: string; messages: AgentMessage[] }> {
  const systemPrompts = {
    diagnostic: `You are a diagnostic AI assistant helping to analyze patient symptoms and medical history.
Provide differential diagnoses, recommend further testing, and suggest when specialist consultation is needed.
Always emphasize that AI suggestions are not replacements for clinical judgment.`,

    genomics: `You are a genomics expert AI assistant. Analyze genetic variants and their clinical significance.
Help interpret genetic test results and provide personalized genetic risk information.`,

    longevity: `You are a longevity optimization AI assistant. Help patients optimize healthspan through
lifestyle modifications, preventive care, and evidence-based interventions.`,

    wearables: `You are a wearables data analyst AI. Interpret health tracking data and identify patterns
in sleep, activity, heart rate, and other metrics.`,

    research: `You are a clinical research matching AI. Help identify relevant clinical trials and research
studies based on patient characteristics.`,

    preventive: `You are a preventive care AI assistant. Recommend screening tests, vaccines, and preventive
measures based on age, risk factors, and guidelines.`,

    medication: `You are a medication intelligence AI. Analyze medication effectiveness, interactions,
and suggest optimization strategies.`,
  };

  const messages: AgentMessage[] = [...conversationHistory];

  let iterationCount = 0;
  const maxIterations = 10; // Prevent infinite loops

  while (iterationCount < maxIterations) {
    iterationCount++;

    // Build messages for Claude API
    const claudeMessages = messages
      .filter((m) => m.agentType === agentType || m.agentType === undefined)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Add current user message if not already in history
    if (claudeMessages[claudeMessages.length - 1]?.role !== 'user') {
      claudeMessages.push({
        role: 'user' as const,
        content: userMessage,
      });
    }

    try {
      const response = await client.messages.create({
        model: config.CLAUDE_MODEL,
        max_tokens: config.MAX_TOKENS,
        system: systemPrompts[agentType],
        tools: healthcareTools,
        messages: claudeMessages as Anthropic.MessageParam[],
      });

      // Process response
      let assistantMessage = '';
      const toolCalls: ToolCall[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          assistantMessage += block.text;
        } else if (block.type === 'tool_use') {
          const toolCall: ToolCall = {
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          };
          toolCalls.push(toolCall);
        }
      }

      // Add assistant message to history
      const agentMessage: AgentMessage = {
        id: generateId(),
        agentType,
        role: 'assistant',
        content: assistantMessage,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        timestamp: new Date(),
      };

      messages.push(agentMessage);

      // If no tool calls, we're done
      if (toolCalls.length === 0 || response.stop_reason === 'end_turn') {
        return {
          response: assistantMessage,
          messages,
        };
      }

      // Execute tool calls and add results
      const toolResults: ToolResult[] = [];
      for (const toolCall of toolCalls) {
        const result = await executeToolCall(toolCall);
        toolResults.push(result);
      }

      // Add tool results as user message
      messages.push({
        id: generateId(),
        agentType,
        role: 'user',
        content: JSON.stringify(toolResults),
        toolResults,
        timestamp: new Date(),
      });

      // Continue loop to process tool results
    } catch (error) {
      throw new Error(`Agent execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error('Agent exceeded maximum iterations');
}

export async function runMultiAgentDiagnosis(
  userMessage: string,
  patientContext?: Record<string, unknown>
): Promise<{
  diagnosticInsights: string;
  genomicsContext?: string;
  riskAssessment?: string;
}> {
  const diagnosticMessages: AgentMessage[] = [];

  // Run diagnostic agent
  const { response: diagnosticInsights } = await runHealthcareAgent(
    'diagnostic',
    userMessage,
    diagnosticMessages
  );

  // Optionally run genomics agent if patient has genetic data
  let genomicsContext: string | undefined;
  if (patientContext?.hasGenomicData) {
    const { response: genomicsResponse } = await runHealthcareAgent(
      'genomics',
      `${userMessage} - Patient has genomic data available for analysis`,
      []
    );
    genomicsContext = genomicsResponse;
  }

  // Run risk assessment
  const { response: riskAssessment } = await runHealthcareAgent(
    'preventive',
    `Based on this presentation: ${userMessage}. What are the key preventive measures?`,
    []
  );

  return {
    diagnosticInsights,
    genomicsContext,
    riskAssessment,
  };
}
