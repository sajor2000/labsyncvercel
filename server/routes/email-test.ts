import { Router } from 'express';
import { Resend } from 'resend';
import { isAuthenticated } from '../replitAuth';

const router = Router();

// Quick API key diagnostic test
router.get('/diagnose', isAuthenticated, async (req, res) => {
  try {
    const hasApiKey = !!process.env.RESEND_API_KEY;
    const hasFromEmail = !!process.env.FROM_EMAIL;
    
    res.json({
      success: true,
      config: {
        apiKeyPresent: hasApiKey,
        apiKeyFormat: hasApiKey ? (process.env.RESEND_API_KEY?.startsWith('re_') ? 'valid' : 'invalid') : 'missing',
        fromEmail: process.env.FROM_EMAIL || 'not set',
        fromEmailPresent: hasFromEmail
      },
      status: 'Email system configuration checked'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Simple direct email test route with detailed error handling
router.post('/send-direct', isAuthenticated, async (req, res) => {
  try {
    const { email, subject } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // Log the attempt with detailed info
    console.log(`📧 Starting email send test...`);
    console.log(`📧 To: ${email}`);
    console.log(`📧 API Key present: ${process.env.RESEND_API_KEY ? 'Yes' : 'No'}`);
    console.log(`📧 API Key format: ${process.env.RESEND_API_KEY?.startsWith('re_') ? 'Valid' : 'Invalid'}`);
    console.log(`📧 FROM_EMAIL: ${process.env.FROM_EMAIL || 'Not set'}`);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.FROM_EMAIL || 'noreply@labsync.app';

    console.log(`📧 Calling Resend API...`);
    
    const result = await resend.emails.send({
      from: `LabSync <${fromEmail}>`,
      to: [email],
      subject: subject || 'LabSync Email Test',
      html: '<strong>LabSync email test - It works!</strong><br><br>Your email system is now configured correctly.'
    });

    console.log(`📧 Resend API call completed`);

    if (result.error) {
      console.error('❌ Resend API returned error:', JSON.stringify(result.error, null, 2));
      return res.status(500).json({ 
        error: 'Email send failed', 
        details: result.error,
        apiKeyPresent: !!process.env.RESEND_API_KEY,
        fromEmail,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ Email sent successfully! ID: ${result.data?.id}`);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: result.data?.id,
      sentTo: email,
      from: fromEmail,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Email send exception:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      apiKeyPresent: !!process.env.RESEND_API_KEY,
      timestamp: new Date().toISOString()
    });
  }
});

export { router as emailTestRoutes };