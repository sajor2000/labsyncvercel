/**
 * OpenAI System Prompt for Standup Meeting Summaries
 * Matches the standup_summaries table schema exactly
 */

export const STANDUP_SUMMARY_SYSTEM_PROMPT = `You are an expert meeting analyst for Lab Sync, a scientific research management platform. Your task is to analyze standup meeting transcripts and extract structured information.

IMPORTANT: Output ONLY valid JSON matching the exact schema below. No additional text or formatting.

Your response must be a JSON object with this EXACT structure:

{
  "executive_summary": "2-3 sentence high-level summary of the entire meeting",
  "detailed_summary": "Comprehensive formatted summary with sections:\n\n## Progress Updates\n- Key accomplishments\n\n## Current Work\n- Active tasks\n\n## Blockers\n- Issues and solutions\n\n## Decisions\n- Important decisions made\n\n## Next Steps\n- Upcoming priorities",
  "action_items": [
    "Specific, actionable task with clear owner and deadline if mentioned"
  ],
  "blockers_identified": [
    "Specific blocker or impediment to progress"
  ],
  "achievements": [
    "Completed task or milestone achieved"
  ],
  "key_decisions": [
    "Important decision made during the meeting"
  ],
  "topics_discussed": [
    "Main topic or theme discussed"
  ],
  "sentiment_analysis": {
    "overall": "positive|neutral|negative",
    "confidence": 0.85,
    "by_participant": {
      "participant_name": {
        "sentiment": "positive|neutral|negative",
        "engagement": "high|medium|low"
      }
    }
  },
  "participation_metrics": {
    "total_speakers": 5,
    "speaker_time": {
      "participant_name": "percentage_of_meeting_time"
    },
    "engagement_score": 0.75
  },
  "extracted_tasks": [
    {
      "title": "Task title",
      "description": "Optional task description",
      "assigned_to": "Person's name if mentioned",
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "due_date": "YYYY-MM-DD if mentioned",
      "confidence_score": 0.9
    }
  ]
}

EXTRACTION RULES:
1. Action items must be specific and actionable
2. Include confidence scores (0-1) when uncertain
3. Extract speaker names when identifiable
4. Identify priority based on urgency words (ASAP=URGENT, important=HIGH, etc.)
5. Format dates as YYYY-MM-DD
6. Blockers should include context about what's blocked
7. Achievements should be concrete completions
8. Topics should be high-level themes, not details
9. Sentiment analysis should consider tone, energy, and progress
10. If information is not available, use null or empty arrays

PRIORITY MAPPING:
- "ASAP", "immediately", "critical", "emergency" → URGENT
- "important", "priority", "soon" → HIGH  
- "normal", "standard", "regular" → MEDIUM
- "when possible", "nice to have", "eventually" → LOW

SENTIMENT INDICATORS:
- Positive: "excited", "great progress", "ahead of schedule", "solved"
- Negative: "frustrated", "blocked", "delayed", "concerned"
- Neutral: factual updates without emotional language

Remember: Output ONLY the JSON object, no markdown formatting, no explanation.`;

/**
 * Function to process transcript with OpenAI
 */
export async function processStandupTranscript(
  transcript: string,
  meetingDate: string,
  participants: string[]
): Promise<StandupSummaryData> {
  const userPrompt = `Meeting Date: ${meetingDate}
Participants: ${participants.join(', ')}

TRANSCRIPT:
${transcript}

Extract the structured summary following the exact JSON schema provided.`;

  // TODO: Implement OpenAI API call
  throw new Error('processStandupTranscript not implemented yet - integrate with OpenAI API');

  // This will be called from your API endpoint
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [
  //     { role: "system", content: STANDUP_SUMMARY_SYSTEM_PROMPT },
  //     { role: "user", content: userPrompt }
  //   ],
  //   temperature: 0.3, // Lower temperature for more consistent extraction
  //   response_format: { type: "json_object" } // Force JSON response
  // });

  // return JSON.parse(response.choices[0].message.content);
}

/**
 * TypeScript interface matching the database schema
 */
export interface StandupSummaryData {
  executive_summary: string;
  detailed_summary: string;
  action_items: string[];
  blockers_identified: string[];
  achievements: string[];
  key_decisions: string[];
  topics_discussed: string[];
  sentiment_analysis: {
    overall: 'positive' | 'neutral' | 'negative';
    confidence: number;
    by_participant: Record<string, {
      sentiment: 'positive' | 'neutral' | 'negative';
      engagement: 'high' | 'medium' | 'low';
    }>;
  };
  participation_metrics: {
    total_speakers: number;
    speaker_time: Record<string, string>;
    engagement_score: number;
  };
  extracted_tasks: Array<{
    title: string;
    description?: string;
    assigned_to?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    due_date?: string;
    confidence_score: number;
  }>;
}

/**
 * Function to save the processed summary to database
 */
export async function saveProcessedSummary(
  standupId: string,
  transcript: string,
  summaryData: StandupSummaryData
) {
  // Convert extracted_tasks to actual tasks if confidence > 0.7
  const highConfidenceTasks = summaryData.extracted_tasks.filter(
    task => task.confidence_score > 0.7
  );

  // Call the database function
  // const { data, error } = await supabase.rpc('save_standup_summary', {
  //   p_standup_id: standupId,
  //   p_transcript: transcript,
  //   p_executive_summary: summaryData.executive_summary,
  //   p_detailed_summary: summaryData.detailed_summary,
  //   p_action_items: summaryData.action_items,
  //   p_blockers: summaryData.blockers_identified,
  //   p_topics: summaryData.topics_discussed,
  //   p_sentiment: summaryData.sentiment_analysis,
  //   p_model: 'gpt-4'
  // });

  // Create tasks from high-confidence extracted tasks
  // for (const task of highConfidenceTasks) {
  //   await createTaskFromAI(task, standupId);
  // }
}