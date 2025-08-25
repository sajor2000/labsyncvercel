/**
 * Simple OpenAI integration for practical lab features
 * Clean, direct, no over-engineering
 */

import OpenAI from 'openai'
import type { Task, CreateTaskInput } from '@/lib/db/types'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  maxRetries: 2,
})

/**
 * Transcribe audio file to text
 */
export async function transcribeAudio(audioFile: File): Promise<string> {
  try {
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    })
    
    return response.text
  } catch (error) {
    console.error('Transcription error:', error)
    throw new Error('Failed to transcribe audio')
  }
}

/**
 * Extract actionable tasks from meeting transcript or notes
 */
export async function extractTasks(
  text: string,
  projectId: string
): Promise<Partial<CreateTaskInput>[]> {
  try {
    const prompt = `
Extract actionable tasks from this text. Return as JSON array.
Each task should have: title, description, priority (low/medium/high/urgent).
Be concise and specific.

Text: ${text}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts actionable tasks from meeting notes.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return []

    const parsed = JSON.parse(content)
    const tasks = parsed.tasks || []

    // Format tasks for our schema
    return tasks.map((task: any) => ({
      project_id: projectId,
      title: task.title || 'Untitled Task',
      description: task.description || null,
      priority: task.priority || 'medium',
      status: 'todo',
    }))
  } catch (error) {
    console.error('Task extraction error:', error)
    return []
  }
}

/**
 * Generate a summary for a project based on its tasks and progress
 */
export async function generateProjectSummary(
  projectTitle: string,
  tasks: Task[]
): Promise<string> {
  try {
    const completedTasks = tasks.filter(t => t.status === 'done').length
    const totalTasks = tasks.length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const taskList = tasks
      .slice(0, 10) // Limit to avoid token limits
      .map(t => `- ${t.title} (${t.status})`)
      .join('\n')

    const prompt = `
Generate a brief summary for this project:
Project: ${projectTitle}
Progress: ${progress}% (${completedTasks}/${totalTasks} tasks completed)
Recent tasks:
${taskList}

Provide a 2-3 sentence summary of the project status and next steps.
`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful research assistant providing concise project summaries.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 200,
    })

    return response.choices[0]?.message?.content || 'Summary unavailable'
  } catch (error) {
    console.error('Summary generation error:', error)
    return 'Unable to generate summary'
  }
}

/**
 * Generate email content for notifications
 */
export async function generateEmailContent(
  type: 'task_assignment' | 'deadline_reminder' | 'project_update',
  data: any
): Promise<{ subject: string; body: string }> {
  try {
    let prompt = ''
    
    switch (type) {
      case 'task_assignment':
        prompt = `
Generate a brief, professional email for a task assignment:
Task: ${data.taskTitle}
Assigned to: ${data.assigneeName}
Due: ${data.dueDate || 'No due date'}
Project: ${data.projectTitle}

Keep it under 5 sentences.
`
        break
      
      case 'deadline_reminder':
        prompt = `
Generate a brief reminder email for an upcoming deadline:
Task: ${data.taskTitle}
Due: ${data.dueDate}
Days until due: ${data.daysUntilDue}

Keep it friendly and under 4 sentences.
`
        break
      
      case 'project_update':
        prompt = `
Generate a brief project update email:
Project: ${data.projectTitle}
Progress: ${data.progress}%
Recent milestone: ${data.milestone}

Keep it informative and under 5 sentences.
`
        break
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Generate concise, professional email content. Return JSON with "subject" and "body" fields.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 300,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated')
    }

    return JSON.parse(content)
  } catch (error) {
    console.error('Email content generation error:', error)
    // Fallback content
    return {
      subject: `Lab Sync: ${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      body: 'You have a new notification from Lab Sync. Please check your dashboard for details.'
    }
  }
}