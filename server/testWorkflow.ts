// Production workflow test script
import { workflowService } from './workflowService';
import fs from 'fs';
import path from 'path';

async function testProductionWorkflow() {
  try {
    console.log('🚀 Starting Production Workflow Test for juan_rojas@rush.edu');
    
    // Create a test audio buffer simulating a meeting recording
    const testTranscript = `
      Good morning team, this is our standup meeting for RICCC Lab.
      
      Yesterday I completed the data analysis for the cardiac imaging study.
      The preliminary results show a 15% improvement in diagnostic accuracy.
      
      Today I'm planning to review the manuscript draft and prepare the figures for publication.
      
      I need help with the statistical review section - can someone from the biostatistics team assist?
      
      Action items:
      1. Complete manuscript review by Friday
      2. Schedule follow-up meeting with cardiology team
      3. Submit IRB amendment for extended patient recruitment
      
      Any blockers or questions? Let's make this week productive.
    `;
    
    // Create a small test audio file buffer
    const testAudioBuffer = Buffer.from(testTranscript, 'utf8');
    
    // Simulate a Multer file object
    const mockFile = {
      buffer: testAudioBuffer,
      originalname: 'production-test-recording.webm',
      mimetype: 'audio/webm',
      size: testAudioBuffer.length
    } as Express.Multer.File;
    
    console.log('📝 Created test audio file simulation');
    
    // Test the complete workflow
    const recipients = ['juan_rojas@rush.edu'];
    const userId = 'production-test-user';
    const labName = 'RICCC Lab - Production Pipeline Test';
    const labId = 'riccc-prod-test';
    const meetingType = 'standup';
    const attendees = ['J.C. Rojas', 'Production Test System', 'LabSync AI'];
    
    console.log('🔄 Processing complete workflow...');
    
    const result = await workflowService.processCompleteWorkflow(
      mockFile,
      recipients,
      userId,
      labName,
      labId,
      meetingType,
      attendees
    );
    
    console.log('✅ Workflow completed successfully!');
    console.log('📊 Workflow Results:');
    console.log(`   Workflow ID: ${result.workflowId}`);
    console.log(`   Meeting ID: ${result.aiAnalysisResult.outputData?.meetingId || 'N/A'}`);
    console.log('');
    
    console.log('📈 Step Performance:');
    console.log(`   Transcription: ${result.transcriptionResult.success ? '✅' : '❌'} (${result.transcriptionResult.processingTimeMs}ms)`);
    console.log(`   AI Analysis: ${result.aiAnalysisResult.success ? '✅' : '❌'} (${result.aiAnalysisResult.processingTimeMs}ms)`);
    console.log(`   Email Generation: ${result.emailGenerationResult.success ? '✅' : '❌'} (${result.emailGenerationResult.processingTimeMs}ms)`);
    console.log(`   Email Delivery: ${result.emailDeliveryResult.success ? '✅' : '❌'} (${result.emailDeliveryResult.processingTimeMs}ms)`);
    
    if (result.emailDeliveryResult.errorMessage) {
      console.log(`❌ Email Error: ${result.emailDeliveryResult.errorMessage}`);
    }
    
    // Get workflow steps from database
    console.log('');
    console.log('🗄️ Database Workflow Steps:');
    const steps = await workflowService.getWorkflowSteps(result.workflowId);
    steps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step.stepName} - ${step.status} (${step.processingTimeMs || 0}ms)`);
      if (step.errorMessage) {
        console.log(`      Error: ${step.errorMessage}`);
      }
    });
    
    console.log('');
    console.log('✨ Production workflow test completed successfully!');
    console.log(`📧 Email should be delivered to: ${recipients.join(', ')}`);
    
    return result;
    
  } catch (error) {
    console.error('💥 Production workflow test failed:', error);
    throw error;
  }
}

// Run the test
testProductionWorkflow()
  .then(() => {
    console.log('🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('🚨 Test failed:', error);
    process.exit(1);
  });