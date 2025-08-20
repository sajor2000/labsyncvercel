/**
 * Comprehensive Workflow Validation Script
 * Tests each step of the meeting recording workflow end-to-end
 */

import { WorkflowService } from './workflowService';
import { storage } from './storage';

export async function validateCompleteWorkflow(): Promise<{
  success: boolean;
  steps: { [key: string]: { success: boolean; details: string; error?: string } };
  summary: string;
}> {
  const results = {
    success: true,
    steps: {} as { [key: string]: { success: boolean; details: string; error?: string } },
    summary: ''
  };

  const workflowService = new WorkflowService();

  try {
    // Step 1: Test Meeting Creation
    console.log('🔍 STEP 1: Testing Meeting Creation...');
    try {
      // Get real lab IDs from database
      const labs = await storage.getLabs();
      const testLabId = labs.length > 0 ? labs[0].id : null;
      
      if (!testLabId) {
        throw new Error('No labs found in database. Please create a lab first.');
      }

      // Get a real user ID from database to avoid foreign key constraint
      const allUsers = await storage.getAllUsers();
      const testUserId = allUsers.length > 0 ? allUsers[0].id : null;

      const testMeeting = {
        title: 'Workflow Validation Test Meeting',
        description: 'Testing the complete meeting recording workflow',
        labId: testLabId,
        meetingType: 'DAILY_STANDUP' as const,
        meetingDate: new Date(),
        scheduledDate: new Date(),
        startTime: new Date(),
        createdBy: testUserId || 'default-user'
      };

      const meeting = await storage.createStandupMeeting(testMeeting);
      results.steps['meeting_creation'] = {
        success: true,
        details: `Meeting created with ID: ${meeting.id}`
      };
      console.log('✅ Meeting creation successful');
    } catch (error) {
      results.steps['meeting_creation'] = {
        success: false,
        details: 'Failed to create meeting',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.success = false;
      console.log('❌ Meeting creation failed:', error);
    }

    // Step 2: Test Workflow Initialization
    console.log('🔍 STEP 2: Testing Workflow Initialization...');
    try {
      // Get real lab ID for workflow testing
      const labs = await storage.getLabs();
      const testLabId = labs.length > 0 ? labs[0].id : 'default-lab';
      
      const workflowId = await workflowService.startWorkflow('test-user', testLabId);
      results.steps['workflow_init'] = {
        success: true,
        details: `Workflow initialized with ID: ${workflowId}`
      };
      console.log('✅ Workflow initialization successful');
    } catch (error) {
      results.steps['workflow_init'] = {
        success: false,
        details: 'Failed to initialize workflow',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.success = false;
      console.log('❌ Workflow initialization failed:', error);
    }

    // Step 3: Test Transcription Service
    console.log('🔍 STEP 3: Testing Transcription Service...');
    try {
      // Create a proper 1-second WAV file for testing
      const sampleRate = 44100;
      const duration = 1; // 1 second 
      const samples = sampleRate * duration;
      const audioBuffer = Buffer.alloc(44 + samples * 2);
      
      // WAV header
      audioBuffer.write('RIFF', 0);
      audioBuffer.writeUInt32LE(36 + samples * 2, 4);
      audioBuffer.write('WAVE', 8);
      audioBuffer.write('fmt ', 12);
      audioBuffer.writeUInt32LE(16, 16);
      audioBuffer.writeUInt16LE(1, 20); // PCM
      audioBuffer.writeUInt16LE(1, 22); // mono
      audioBuffer.writeUInt32LE(sampleRate, 24);
      audioBuffer.writeUInt32LE(sampleRate * 2, 28);
      audioBuffer.writeUInt16LE(2, 32);
      audioBuffer.writeUInt16LE(16, 34);
      audioBuffer.write('data', 36);
      audioBuffer.writeUInt32LE(samples * 2, 40);
      
      // Generate 440Hz sine wave for 1 second
      for (let i = 0; i < samples; i++) {
        const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 32767;
        audioBuffer.writeInt16LE(Math.round(sample), 44 + i * 2);
      }

      const mockFile = {
        buffer: audioBuffer,
        originalname: 'test-audio.wav',
        mimetype: 'audio/wav',
        size: audioBuffer.length
      } as Express.Multer.File;

      // Get real lab ID
      const labs = await storage.getLabs();
      const testLabId = labs.length > 0 ? labs[0].id : 'default-lab';
      
      const workflowId = await workflowService.startWorkflow('test-user', testLabId);
      
      // Note: This will use mock transcription in test mode
      const transcriptionResult = await workflowService.processTranscriptionStep(
        workflowId,
        mockFile,
        'test-user',
        'test-lab'
      );

      results.steps['transcription'] = {
        success: transcriptionResult.success,
        details: transcriptionResult.success 
          ? 'Transcription service available and functional'
          : 'Transcription service failed',
        error: transcriptionResult.errorMessage
      };
      
      if (!transcriptionResult.success) {
        results.success = false;
      }
      
      console.log(transcriptionResult.success ? '✅ Transcription test successful' : '❌ Transcription test failed');
    } catch (error) {
      results.steps['transcription'] = {
        success: false,
        details: 'Transcription service error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.success = false;
      console.log('❌ Transcription test failed:', error);
    }

    // Step 4: Test AI Analysis Service
    console.log('🔍 STEP 4: Testing AI Analysis Service...');
    try {
      // Get real lab ID for AI analysis testing
      const labs = await storage.getLabs();
      const testLabId = labs.length > 0 ? labs[0].id : 'default-lab';
      
      const workflowId = await workflowService.startWorkflow('test-user', testLabId);
      const testTranscript = `
        Test meeting transcript:
        John: I'm working on the data analysis project, should be done by Friday.
        Jane: I completed the literature review and will start the draft this week.
        Action items: 1. Submit IRB application 2. Schedule team meeting
      `;

      const aiResult = await workflowService.processAIAnalysisStep(
        workflowId,
        testTranscript,
        'test-user',
        testLabId,
        'DAILY_STANDUP',
        ['John', 'Jane']
      );

      results.steps['ai_analysis'] = {
        success: aiResult.success,
        details: aiResult.success 
          ? 'AI analysis service available and functional'
          : 'AI analysis service failed',
        error: aiResult.errorMessage
      };
      
      if (!aiResult.success) {
        results.success = false;
      }
      
      console.log(aiResult.success ? '✅ AI analysis test successful' : '❌ AI analysis test failed');
    } catch (error) {
      results.steps['ai_analysis'] = {
        success: false,
        details: 'AI analysis service error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.success = false;
      console.log('❌ AI analysis test failed:', error);
    }

    // Step 5: Test Email Generation
    console.log('🔍 STEP 5: Testing Email Generation...');
    try {
      // Get real lab ID for email testing
      const labs = await storage.getLabs();
      const testLabId = labs.length > 0 ? labs[0].id : null;
      
      if (!testLabId) {
        throw new Error('No labs found for email testing');
      }

      // Get a real user ID from database to avoid foreign key constraint
      const allUsers = await storage.getAllUsers();
      const testUserId = allUsers.length > 0 ? allUsers[0].id : null;

      // Test email generation requires a meeting with AI summary
      const testMeeting = {
        title: 'Email Test Meeting',
        description: 'Testing email generation',
        labId: testLabId,
        meetingType: 'DAILY_STANDUP' as const,
        meetingDate: new Date(),
        scheduledDate: new Date(),
        startTime: new Date(),
        createdBy: testUserId || 'default-user',
        aiSummary: {
          participants: ['John Doe', 'Jane Smith'],
          actionItems: [
            { description: 'Complete data analysis', assignee: 'John Doe', dueDate: '2025-01-20' }
          ],
          keyTopics: ['Data Analysis', 'Project Timeline'],
          nextSteps: ['Submit IRB application', 'Schedule follow-up meeting']
        }
      };

      const meeting = await storage.createStandupMeeting(testMeeting);
      const workflowId = await workflowService.startWorkflow('test-user', testLabId);

      const emailResult = await workflowService.processEmailGenerationStep(
        workflowId,
        meeting.id,
        'Test Lab',
        testLabId
      );

      results.steps['email_generation'] = {
        success: emailResult.success,
        details: emailResult.success 
          ? 'Email generation service available and functional'
          : 'Email generation service failed',
        error: emailResult.errorMessage
      };
      
      if (!emailResult.success) {
        results.success = false;
      }
      
      console.log(emailResult.success ? '✅ Email generation test successful' : '❌ Email generation test failed');
    } catch (error) {
      results.steps['email_generation'] = {
        success: false,
        details: 'Email generation service error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.success = false;
      console.log('❌ Email generation test failed:', error);
    }

    // Step 6: Test Email Delivery (without actually sending)
    console.log('🔍 STEP 6: Testing Email Delivery Service...');
    try {
      const workflowId = await workflowService.startWorkflow('test-user', 'test-lab');
      
      // Test if Resend API key is available
      const hasResendKey = !!process.env.RESEND_API_KEY;
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

      results.steps['email_delivery'] = {
        success: hasResendKey,
        details: hasResendKey 
          ? 'Email delivery service configured and ready'
          : 'Email delivery service missing API key',
        error: hasResendKey ? undefined : 'RESEND_API_KEY not found in environment'
      };

      results.steps['openai_service'] = {
        success: hasOpenAIKey,
        details: hasOpenAIKey 
          ? 'OpenAI service configured and ready'
          : 'OpenAI service missing API key',
        error: hasOpenAIKey ? undefined : 'OPENAI_API_KEY not found in environment'
      };
      
      if (!hasResendKey || !hasOpenAIKey) {
        results.success = false;
      }
      
      console.log(hasResendKey ? '✅ Email delivery service configured' : '❌ Email delivery service not configured');
      console.log(hasOpenAIKey ? '✅ OpenAI service configured' : '❌ OpenAI service not configured');
    } catch (error) {
      results.steps['email_delivery'] = {
        success: false,
        details: 'Email delivery service error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.success = false;
      console.log('❌ Email delivery test failed:', error);
    }

    // Generate Summary
    const successCount = Object.values(results.steps).filter(step => step.success).length;
    const totalCount = Object.keys(results.steps).length;
    
    results.summary = `Workflow Validation Complete: ${successCount}/${totalCount} steps successful`;
    
    console.log('\n📊 VALIDATION SUMMARY:');
    console.log(`Overall Success: ${results.success ? '✅' : '❌'}`);
    console.log(`Steps Passed: ${successCount}/${totalCount}`);
    console.log('\nStep Details:');
    
    Object.entries(results.steps).forEach(([step, result]) => {
      console.log(`  ${result.success ? '✅' : '❌'} ${step}: ${result.details}`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });

    return results;

  } catch (error) {
    console.error('❌ Critical validation error:', error);
    return {
      success: false,
      steps: {
        critical_error: {
          success: false,
          details: 'Critical validation error occurred',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      summary: 'Validation failed due to critical error'
    };
  }
}