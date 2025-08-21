import { Router } from 'express';
import { domainManager } from '../domainManager';
import { isAuthenticated } from '../auth/localAuth';

const router = Router();

// Get email system status and domain info
router.get('/status', isAuthenticated, async (req, res) => {
  try {
    const status = await domainManager.getSystemStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting email system status:', error);
    res.status(500).json({ 
      error: 'Failed to get email system status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// List all domains
router.get('/list', isAuthenticated, async (req, res) => {
  try {
    const result = await domainManager.listDomains();
    res.json(result);
  } catch (error) {
    console.error('Error listing domains:', error);
    res.status(500).json({ 
      error: 'Failed to list domains',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add a new domain
router.post('/add', isAuthenticated, async (req, res) => {
  try {
    // Check if user has admin privileges
    const userRole = (req as any).user?.role;
    if (!userRole || !['ADMIN', 'PRINCIPAL_INVESTIGATOR', 'CO_PRINCIPAL_INVESTIGATOR'].includes(userRole)) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain name is required' });
    }

    const result = await domainManager.addDomain(domain);
    res.json(result);
  } catch (error) {
    console.error('Error adding domain:', error);
    res.status(500).json({ 
      error: 'Failed to add domain',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Verify a domain
router.post('/verify/:domainId', isAuthenticated, async (req, res) => {
  try {
    // Check if user has admin privileges
    const userRole = (req as any).user?.role;
    if (!userRole || !['ADMIN', 'PRINCIPAL_INVESTIGATOR', 'CO_PRINCIPAL_INVESTIGATOR'].includes(userRole)) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    const { domainId } = req.params;
    const result = await domainManager.verifyDomain(domainId);
    res.json(result);
  } catch (error) {
    console.error('Error verifying domain:', error);
    res.status(500).json({ 
      error: 'Failed to verify domain',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get domain details
router.get('/:domainId', isAuthenticated, async (req, res) => {
  try {
    const { domainId } = req.params;
    const result = await domainManager.getDomainDetails(domainId);
    res.json(result);
  } catch (error) {
    console.error('Error getting domain details:', error);
    res.status(500).json({ 
      error: 'Failed to get domain details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Send test email
router.post('/test-email', isAuthenticated, async (req, res) => {
  try {
    const { email, domain } = req.body;
    const userEmail = (req as any).user?.email;
    const testEmail = email || userEmail;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const result = await domainManager.testEmailSend(testEmail, domain);
    res.json(result);
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as domainRoutes };