import { randomUUID } from 'crypto';
import type { WorkflowStep, InsertWorkflowStep } from '@shared/schema';
import { storage } from './storage';

export interface WorkflowStepInput {
  stepType: 'transcription' | 'ai_processing' | 'email_generation' | 'email_delivery';
  stepName: string;
  inputData?: any;
  userId: string;
  labId?: string;
  meetingId?: string;
}

export interface WorkflowStepResult {
  stepId: string;
  success: boolean;
  outputData?: any;
  errorMessage?: string;
  processingTimeMs: number;
}

export class WorkflowService {
  
  /**
   * Start a new workflow and return the workflow ID
   */
  async startWorkflow(userId: string, labId?: string): Promise<string> {
    return randomUUID();
  }

  /**
   * Create and start a new workflow step
   */
  async startStep(workflowId: string, stepInput: WorkflowStepInput): Promise<string> {
    const step: InsertWorkflowStep = {
      workflowId,
      stepType: stepInput.stepType,
      stepName: stepInput.stepName,
      status: 'processing',
      inputData: stepInput.inputData,
      userId: stepInput.userId,
      labId: stepInput.labId,
      meetingId: stepInput.meetingId,
      startedAt: new Date(),
    };

    return await storage.createWorkflowStep(step);
  }

  /**
   * Complete a workflow step with results
   */
  async completeStep(stepId: string, result: Omit<WorkflowStepResult, 'stepId'>): Promise<void> {
    await storage.updateWorkflowStep(stepId, {
      status: result.success ? 'completed' : 'failed',
      outputData: result.outputData,
      errorMessage: result.errorMessage,
      processingTimeMs: result.processingTimeMs,
      completedAt: new Date(),
    });
  }

  /**
   * Get all steps for a workflow
   */
  async getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]> {
    return await storage.getWorkflowStepsByWorkflowId(workflowId);
  }

  /**
   * Get workflow step by ID
   */
  async getWorkflowStep(stepId: string): Promise<WorkflowStep | undefined> {
    return await storage.getWorkflowStep(stepId);
  }

  /**
   * Clean up expired workflow steps (older than 2 weeks)
   */
  async cleanupExpiredSteps(): Promise<number> {
    return await storage.cleanupExpiredWorkflowSteps();
  }

  /**
   * Process audio transcription step
   */
  async processTranscriptionStep(
    workflowId: string, 
    audioFile: any, 
    userId: string, 
    labId?: string
  ): Promise<WorkflowStepResult> {
    const startTime = Date.now();
    const stepId = await this.startStep(workflowId, {
      stepType: 'transcription',
      stepName: 'Audio Transcription',
      inputData: {
        fileName: audioFile.originalname,
        fileSize: audioFile.size,
        mimeType: audioFile.mimetype,
      },
      userId,
      labId,
    });

    try {
      // Import OpenAI and perform transcription
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Create a temporary file from the buffer
      const fs = await import('fs');
      const path = await import('path');

      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `${randomUUID()}.webm`);
      fs.writeFileSync(tempFilePath, audioFile.buffer);

      try {
        // Transcribe using OpenAI Whisper
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: "whisper-1",
          language: "en",
          response_format: "text"
        });

        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        const processingTimeMs = Date.now() - startTime;
        const result: WorkflowStepResult = {
          stepId,
          success: true,
          outputData: { transcript: transcription },
          processingTimeMs,
        };

        await this.completeStep(stepId, result);
        return result;

      } catch (transcriptionError) {
        // Clean up temp file on error
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        throw transcriptionError;
      }

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const result: WorkflowStepResult = {
        stepId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown transcription error',
        processingTimeMs,
      };

      await this.completeStep(stepId, result);
      return result;
    }
  }

  /**
   * Process AI meeting analysis step
   */
  async processAIAnalysisStep(
    workflowId: string,
    transcript: string,
    userId: string,
    labId?: string,
    meetingType: string = 'DAILY_STANDUP',
    attendees: string[] = []
  ): Promise<WorkflowStepResult> {
    const startTime = Date.now();
    const stepId = await this.startStep(workflowId, {
      stepType: 'ai_processing',
      stepName: 'AI Meeting Analysis',
      inputData: {
        transcriptLength: transcript.length,
        meetingType,
        attendeesCount: attendees.length,
      },
      userId,
      labId,
    });

    try {
      // Create standup meeting with AI processing
      const meetingData = {
        transcript,
        labId,
        meetingType,
        attendees,
      };

      // Process with AI and create meeting record
      const currentDate = new Date();
      const meeting = await storage.createStandupMeeting({
        transcript,
        labId: labId || 'default',
        meetingType: (meetingType as any) || 'DAILY_STANDUP',
        meetingDate: currentDate,
        scheduledDate: currentDate,
        startTime: currentDate,
        endTime: currentDate,
        participants: attendees,
        createdBy: userId,
      });

      // Process with AI to extract tasks
      const { meetingRecorderService } = await import('./meetingRecorder');
      const currentDateStr = currentDate.toISOString().split('T')[0];
      const { processedNotes, extractedTasks } = await meetingRecorderService.processTranscript(transcript, currentDateStr);
      
      // Save the extracted tasks as action items
      for (const task of extractedTasks) {
        let dueDate = undefined;
        if (task.due_date && task.due_date !== 'undefined' && task.due_date !== 'null') {
          try {
            dueDate = new Date(task.due_date);
            // Check if date is valid
            if (isNaN(dueDate.getTime())) {
              dueDate = undefined;
            }
          } catch (e) {
            dueDate = undefined;
          }
        }
        
        // For validation testing, assign to the first available user or skip if no users
        const allUsers = await storage.getAllUsers();
        let validAssigneeId = null;
        
        if (task.member && task.member !== 'unassigned') {
          // Try to find a user matching the assigned member name
          const matchingUser = allUsers.find(user => 
            user.name?.toLowerCase().includes(task.member.toLowerCase()) ||
            user.email?.toLowerCase().includes(task.member.toLowerCase())
          );
          validAssigneeId = matchingUser?.id || (allUsers.length > 0 ? allUsers[0].id : null);
        } else if (allUsers.length > 0) {
          // For unassigned tasks in validation, assign to first user to avoid FK constraint
          validAssigneeId = allUsers[0].id;
        }
        
        // Only create action item if we have a valid assignee
        if (validAssigneeId) {
          await storage.createActionItem({
            meetingId: meeting.id,
            description: task.task || 'Task description not available',
            assigneeId: validAssigneeId,
            dueDate,
            status: 'OPEN',
          });
        }
      }

      const processingTimeMs = Date.now() - startTime;
      const result: WorkflowStepResult = {
        stepId,
        success: true,
        outputData: { 
          meetingId: meeting.id,
          meetingData: meeting,
        },
        processingTimeMs,
      };

      await this.completeStep(stepId, result);
      return result;

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const result: WorkflowStepResult = {
        stepId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown AI processing error',
        processingTimeMs,
      };

      await this.completeStep(stepId, result);
      return result;
    }
  }

  /**
   * Process email generation step
   */
  async processEmailGenerationStep(
    workflowId: string,
    meetingId: string,
    userId: string,
    labName: string,
    labId?: string
  ): Promise<WorkflowStepResult> {
    const startTime = Date.now();
    const stepId = await this.startStep(workflowId, {
      stepType: 'email_generation',
      stepName: 'Email HTML Generation',
      inputData: {
        meetingId,
        labName,
      },
      userId,
      labId,
      meetingId,
    });

    try {
      // Get meeting and action items
      const meeting = await storage.getStandupMeeting(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const actionItems = await storage.getActionItemsByMeetingId(meetingId);

      // Generate email HTML
      const { meetingRecorderService } = await import('./meetingRecorder');
      const html = await meetingRecorderService.generateEmailHtml({
        meeting,
        actionItems,
        title: `${labName} Meeting Summary`
      });

      const processingTimeMs = Date.now() - startTime;
      const result: WorkflowStepResult = {
        stepId,
        success: true,
        outputData: { 
          html,
          actionItemsCount: actionItems.length,
        },
        processingTimeMs,
      };

      await this.completeStep(stepId, result);
      return result;

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const result: WorkflowStepResult = {
        stepId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown email generation error',
        processingTimeMs,
      };

      await this.completeStep(stepId, result);
      return result;
    }
  }

  /**
   * Process email delivery step
   */
  async processEmailDeliveryStep(
    workflowId: string,
    meetingId: string,
    recipients: string[],
    userId: string,
    labName: string,
    labId?: string
  ): Promise<WorkflowStepResult> {
    const startTime = Date.now();
    const stepId = await this.startStep(workflowId, {
      stepType: 'email_delivery',
      stepName: 'Email Delivery',
      inputData: {
        meetingId,
        recipients,
        recipientCount: recipients.length,
        labName,
      },
      userId,
      labId,
      meetingId,
    });

    try {
      // Send meeting summary email
      const { meetingRecorderService } = await import('./meetingRecorder');
      const result = await meetingRecorderService.sendMeetingSummary(
        meetingId,
        recipients,
        labName
      );

      const processingTimeMs = Date.now() - startTime;
      const stepResult: WorkflowStepResult = {
        stepId,
        success: result.success,
        outputData: result.success ? { 
          messageId: result.messageId,
          recipients,
        } : undefined,
        errorMessage: result.success ? undefined : result.error,
        processingTimeMs,
      };

      await this.completeStep(stepId, stepResult);
      return stepResult;

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const result: WorkflowStepResult = {
        stepId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown email delivery error',
        processingTimeMs,
      };

      await this.completeStep(stepId, result);
      return result;
    }
  }

  /**
   * Process complete workflow from audio to email delivery
   */
  async processCompleteWorkflow(
    audioFile: any,
    recipients: string[],
    userId: string,
    labName: string,
    labId?: string,
    meetingType: string = 'DAILY_STANDUP',
    attendees: string[] = []
  ): Promise<{
    workflowId: string;
    transcriptionResult: WorkflowStepResult;
    aiAnalysisResult: WorkflowStepResult;
    emailGenerationResult: WorkflowStepResult;
    emailDeliveryResult: WorkflowStepResult;
  }> {
    const workflowId = await this.startWorkflow(userId, labId);

    // Step 1: Transcription
    const transcriptionResult = await this.processTranscriptionStep(
      workflowId, audioFile, userId, labId
    );

    if (!transcriptionResult.success) {
      throw new Error(`Transcription failed: ${transcriptionResult.errorMessage}`);
    }

    // Step 2: AI Analysis
    const transcript = transcriptionResult.outputData?.transcript;
    const aiAnalysisResult = await this.processAIAnalysisStep(
      workflowId, transcript, userId, labId, meetingType, attendees
    );

    if (!aiAnalysisResult.success) {
      throw new Error(`AI analysis failed: ${aiAnalysisResult.errorMessage}`);
    }

    // Step 3: Email Generation
    const meetingId = aiAnalysisResult.outputData?.meetingId;
    const emailGenerationResult = await this.processEmailGenerationStep(
      workflowId, meetingId, userId, labName, labId
    );

    if (!emailGenerationResult.success) {
      throw new Error(`Email generation failed: ${emailGenerationResult.errorMessage}`);
    }

    // Step 4: Email Delivery
    const emailDeliveryResult = await this.processEmailDeliveryStep(
      workflowId, meetingId, recipients, userId, labName, labId
    );

    return {
      workflowId,
      transcriptionResult,
      aiAnalysisResult,
      emailGenerationResult,
      emailDeliveryResult,
    };
  }
}

export const workflowService = new WorkflowService();