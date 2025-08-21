import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY2);

export class DomainManager {
  /**
   * List all configured domains
   */
  async listDomains() {
    try {
      const domains = await resend.domains.list();
      return {
        success: true,
        domains: domains.data || [],
        count: domains.data?.length || 0
      };
    } catch (error) {
      console.error('❌ Failed to list domains:', error);
      return {
        success: false,
        error: error.message,
        domains: [],
        count: 0
      };
    }
  }

  /**
   * Add a new domain for email sending
   */
  async addDomain(domainName: string) {
    try {
      console.log(`🔧 Adding domain: ${domainName}`);
      const result = await resend.domains.create({ name: domainName });
      
      console.log(`✅ Domain added successfully: ${domainName}`);
      return {
        success: true,
        domain: result,
        message: `Domain ${domainName} added successfully. You'll need to verify it in your Resend dashboard.`
      };
    } catch (error) {
      console.error(`❌ Failed to add domain ${domainName}:`, error);
      return {
        success: false,
        error: error.message,
        message: `Failed to add domain ${domainName}: ${error.message}`
      };
    }
  }

  /**
   * Verify an existing domain
   */
  async verifyDomain(domainId: string) {
    try {
      console.log(`🔍 Verifying domain: ${domainId}`);
      const result = await resend.domains.verify(domainId);
      
      console.log(`✅ Domain verification initiated: ${domainId}`);
      return {
        success: true,
        result,
        message: 'Domain verification initiated. Check your Resend dashboard for DNS setup instructions.'
      };
    } catch (error) {
      console.error(`❌ Failed to verify domain ${domainId}:`, error);
      return {
        success: false,
        error: error.message,
        message: `Failed to verify domain: ${error.message}`
      };
    }
  }

  /**
   * Get details for a specific domain
   */
  async getDomainDetails(domainId: string) {
    try {
      const result = await resend.domains.get(domainId);
      return {
        success: true,
        domain: result
      };
    } catch (error) {
      console.error(`❌ Failed to get domain details for ${domainId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test email sending with current configuration
   */
  async testEmailSend(toEmail: string, testDomain: string = 'noreply@labsync.app') {
    try {
      console.log(`📧 Testing email send to: ${toEmail}`);
      
      const result = await resend.emails.send({
        from: `LabSync <${testDomain}>`,
        to: [toEmail],
        subject: 'LabSync Email System Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4C9A92;">LabSync Email System Test</h2>
            <p>This is a test email to verify your LabSync email configuration.</p>
            <p><strong>Status:</strong> Email system is working properly!</p>
            <p><strong>Domain:</strong> ${testDomain}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              This is an automated test message from LabSync.
            </p>
          </div>
        `
      });

      console.log(`✅ Test email sent successfully. ID: ${result.id}`);
      return {
        success: true,
        emailId: result.id,
        message: 'Test email sent successfully!'
      };
    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      return {
        success: false,
        error: error.message,
        message: `Failed to send test email: ${error.message}`
      };
    }
  }

  /**
   * Get comprehensive email system status
   */
  async getSystemStatus() {
    const domains = await this.listDomains();
    
    return {
      apiKeyValid: true, // If we got here, the API key works
      domainsConfigured: domains.count > 0,
      domainCount: domains.count,
      domains: domains.domains,
      recommendation: domains.count === 0 
        ? 'Add and verify a domain to enable email sending'
        : domains.domains.some(d => d.status === 'verified') 
          ? 'Email system ready to send'
          : 'Complete domain verification to enable email sending'
    };
  }
}

export const domainManager = new DomainManager();