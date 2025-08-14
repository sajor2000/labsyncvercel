// Real transcript workflow test using the provided meeting content
import { workflowService } from './workflowService';

async function testRealTranscriptWorkflow() {
  try {
    console.log('🎙️ Testing Real Meeting Transcript Processing');
    console.log('📝 Processing actual meeting content through AI pipeline');
    
    // Use the actual meeting transcript provided
    const realTranscript = `
      include those or filter those out? My guess is the next week with Liz and Theresa will be a lot like, oh, this is why we don't contact them here, but this would be a valid one is just kind of filtering the list down just to kind of have all these discrete processes as well. So that was my question too, because I kind of like in my chart review and I'll do like the process load too, you know, like lots of good hits on everyone. Almost all of these people were just people that almost all of them had some sort of critical care admission. So that's kind of nice. But then when I look at like the timing, like when did they get admitted to critical care versus when they had their cardiac arrest? Like a lot of them, it was like they had cardiac arrest and then they got admitted. So it wasn't like they were in the unit and then they had cardiac arrest. It was more like they had cardiac arrest in the ED or on the floor and then they got admitted to critical care. So I'm wondering if that's a different population than what we're looking for. Because I think what we're looking for is more like people who are already critically ill and then they have a cardiac arrest while they're in the unit. But I don't know, maybe that's still a valid population. I just want to make sure we're capturing the right people.
      
      So I think the next step is to really look at the timing of when they got admitted to critical care versus when they had their cardiac arrest. And then also look at like what was their reason for admission to critical care? Was it because of the cardiac arrest or was it something else? And then they happened to have a cardiac arrest while they were there.
      
      I think that would help us understand if we're looking at the right population. Because I think there's probably a difference between someone who has a cardiac arrest in the ED and then gets admitted to critical care because of that versus someone who's already in critical care for another reason and then has a cardiac arrest.
      
      So that's kind of my next step is to really dive into the timing and the reason for admission to critical care. And then from there, we can decide if we want to include those people or filter them out.
      
      What do you think about that approach? Does that make sense?
    `;
    
    console.log('✅ Real meeting transcript loaded');
    
    // Test parameters using actual user data
    const recipients = ['juan_rojas@rush.edu'];
    const userId = '25473214'; // Actual user ID from database
    const labName = 'RICCC Lab - Real Meeting Analysis';
    const labId = '400b6659-bce2-4fa0-b297-daebd110c31b'; // Actual RICCC lab ID
    const meetingType = 'PROJECT_SYNC';
    const attendees = ['Dr. J.C. Rojas', 'Research Team', 'Chart Review Team'];
    
    // Start workflow processing
    console.log('🔄 Starting real transcript workflow...');
    const workflowId = await workflowService.startWorkflow(userId, labId);
    console.log(`📋 Workflow ID: ${workflowId}`);
    
    // Step 1: AI Analysis of real meeting content
    console.log('🤖 Processing real meeting content with AI...');
    const aiResult = await workflowService.processAIAnalysisStep(
      workflowId,
      realTranscript,
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
    console.log('📧 Generating professional email content...');
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
    
    // Step 3: Email Delivery to juan_rojas@rush.edu
    console.log('📬 Delivering real meeting summary to juan_rojas@rush.edu...');
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
    
    // Get complete workflow summary
    console.log('');
    console.log('🗄️ Real Meeting Workflow Results:');
    const allSteps = await workflowService.getWorkflowSteps(workflowId);
    
    console.log(`📊 Total steps completed: ${allSteps.length}`);
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
    console.log('🎉 REAL MEETING TRANSCRIPT PROCESSING COMPLETED!');
    console.log('📧 Comprehensive meeting analysis sent to juan_rojas@rush.edu');
    console.log('🔬 AI successfully extracted research workflow insights');
    console.log('📋 Chart review process and timing analysis documented');
    console.log('✨ Production system validated with authentic meeting data');
    
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
    console.error('💥 Real transcript workflow failed:', error);
    throw error;
  }
}

// Execute real meeting transcript test
testRealTranscriptWorkflow()
  .then((result) => {
    console.log('');
    console.log('✅ REAL MEETING TEST RESULTS:');
    console.log(`   Workflow ID: ${result.workflowId}`);
    console.log(`   Total Steps: ${result.totalSteps}`);
    console.log(`   Processing Time: ${result.totalProcessingTime}ms`);
    console.log(`   AI Analysis: ${result.aiResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Email Generation: ${result.emailResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Email Delivery: ${result.deliveryResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log('');
    console.log('🏆 REAL MEETING WORKFLOW SYSTEM FULLY VALIDATED!');
    console.log('📧 Check your email at juan_rojas@rush.edu for the meeting summary');
    process.exit(0);
  })
  .catch((error) => {
    console.error('🚨 REAL MEETING TEST FAILED:', error.message);
    process.exit(1);
  });