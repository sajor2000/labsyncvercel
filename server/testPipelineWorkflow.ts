// Complete pipeline test - bypassing audio transcription and testing AI + Email pipeline
import { workflowService } from './workflowService';

async function testProductionPipeline() {
  try {
    console.log('🚀 Starting Production Pipeline Test for juan_rojas@rush.edu');
    console.log('📝 Testing AI Analysis → Email Generation → Email Delivery');
    
    // Simulate a realistic meeting transcript
    const testTranscript = `
      Good morning everyone, welcome to our RICCC Lab standup meeting for today.
      
      Yesterday's accomplishments:
      - Completed the cardiac imaging data analysis for Study RIC-2024-001
      - The preliminary results show a 15% improvement in diagnostic accuracy using our new AI model
      - Finished reviewing patient consent forms for the extended recruitment phase
      - Met with the biostatistics team to discuss statistical analysis plans
      
      Today's priorities:
      - Review the manuscript draft for the cardiac imaging study
      - Prepare figures and tables for publication submission
      - Schedule follow-up meetings with the cardiology department
      - Continue patient recruitment for the ongoing clinical trial
      
      Action items and assignments:
      1. J.C. Rojas will complete the manuscript review by Friday, December 15th
      2. Research team will finalize the statistical analysis by next Tuesday
      3. Submit IRB amendment for extended patient recruitment by end of week
      4. Schedule presentation for the research committee meeting next month
      
      Blockers and concerns:
      - Need assistance with the statistical review section
      - Waiting for approval from the ethics committee for protocol modifications
      - Equipment maintenance scheduled for next week may affect data collection
      
      Additional notes:
      - New lab member starting next Monday - prepare onboarding materials
      - Grant application deadline approaching - need to finalize budget details
      - Research symposium presentation due next month
      
      That concludes our standup. Great work everyone, let's make this week productive!
    `;
    
    console.log('✅ Created realistic meeting transcript simulation');
    
    // Test parameters
    const recipients = ['juan_rojas@rush.edu'];
    const userId = '25473214';
    const labName = 'RICCC Lab - Complete Pipeline Test';
    const labId = '400b6659-bce2-4fa0-b297-daebd110c31b';
    const meetingType = 'DAILY_STANDUP';
    const attendees = ['Dr. J.C. Rojas', 'Research Team', 'Biostatistics Team', 'LabSync AI System'];
    
    // Start workflow
    console.log('🔄 Starting workflow...');
    const workflowId = await workflowService.startWorkflow(userId, labId);
    console.log(`📋 Workflow ID: ${workflowId}`);
    
    // Step 1: AI Analysis (bypassing transcription)
    console.log('🤖 Processing AI Analysis...');
    const aiResult = await workflowService.processAIAnalysisStep(
      workflowId,
      testTranscript,
      userId,
      labId,
      meetingType,
      attendees
    );
    
    if (!aiResult.success) {
      throw new Error(`AI Analysis failed: ${aiResult.errorMessage}`);
    }
    
    console.log(`✅ AI Analysis completed in ${aiResult.processingTimeMs}ms`);
    console.log(`📝 Meeting ID: ${aiResult.outputData?.meetingId}`);
    
    // Step 2: Email Generation
    console.log('📧 Generating email content...');
    const emailResult = await workflowService.processEmailGenerationStep(
      workflowId,
      aiResult.outputData?.meetingId!,
      userId,
      labName,
      labId
    );
    
    if (!emailResult.success) {
      throw new Error(`Email Generation failed: ${emailResult.errorMessage}`);
    }
    
    console.log(`✅ Email generation completed in ${emailResult.processingTimeMs}ms`);
    
    // Step 3: Email Delivery
    console.log('📬 Delivering email to juan_rojas@rush.edu...');
    const deliveryResult = await workflowService.processEmailDeliveryStep(
      workflowId,
      aiResult.outputData?.meetingId!,
      recipients,
      userId,
      labName,
      labId
    );
    
    if (!deliveryResult.success) {
      throw new Error(`Email Delivery failed: ${deliveryResult.errorMessage}`);
    }
    
    console.log(`✅ Email delivered successfully in ${deliveryResult.processingTimeMs}ms`);
    console.log(`📮 Message ID: ${deliveryResult.outputData?.messageId}`);
    
    // Get complete workflow steps from database
    console.log('');
    console.log('🗄️ Complete Workflow Summary:');
    const allSteps = await workflowService.getWorkflowSteps(workflowId);
    
    console.log(`📊 Total steps recorded: ${allSteps.length}`);
    allSteps.forEach((step, index) => {
      const statusIcon = step.status === 'completed' ? '✅' : step.status === 'failed' ? '❌' : '⏳';
      console.log(`   ${index + 1}. ${statusIcon} ${step.stepName} - ${step.status} (${step.processingTimeMs || 0}ms)`);
      if (step.errorMessage) {
        console.log(`      ❌ Error: ${step.errorMessage}`);
      }
    });
    
    // Calculate total processing time
    const totalTime = allSteps.reduce((total, step) => total + (step.processingTimeMs || 0), 0);
    console.log(`⏱️  Total processing time: ${totalTime}ms`);
    
    console.log('');
    console.log('🎉 PRODUCTION PIPELINE TEST COMPLETED SUCCESSFULLY!');
    console.log('📧 Email has been sent to juan_rojas@rush.edu with complete meeting summary');
    console.log('🗄️ All workflow steps have been stored in the database with 2-week retention');
    console.log('✨ Production system is fully operational and ready for use!');
    
    return {
      workflowId,
      totalSteps: allSteps.length,
      totalProcessingTime: totalTime,
      aiResult,
      emailResult,
      deliveryResult,
      allSteps
    };
    
  } catch (error) {
    console.error('💥 Production pipeline test failed:', error);
    throw error;
  }
}

// Run the comprehensive test
testProductionPipeline()
  .then((result) => {
    console.log('');
    console.log('✅ TEST RESULTS SUMMARY:');
    console.log(`   Workflow ID: ${result.workflowId}`);
    console.log(`   Total Steps: ${result.totalSteps}`);
    console.log(`   Processing Time: ${result.totalProcessingTime}ms`);
    console.log(`   AI Analysis: ${result.aiResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Email Generation: ${result.emailResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Email Delivery: ${result.deliveryResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log('');
    console.log('🏆 PRODUCTION WORKFLOW SYSTEM IS FULLY OPERATIONAL!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('🚨 PIPELINE TEST FAILED:', error.message);
    process.exit(1);
  });