// routes/licenseRoutes.js
const express = require('express');
const router = express.Router();
const { LicenseManager } = require('../config/licenseConfig');
const { licenseManager } = require('../middleware/licenseMiddleware');

// Activate license with master key
router.post('/activate', async (req, res) => {
    try {
        const { masterKey, domain } = req.body;
        
        // Validate domain matches request
        const currentDomain = req.headers.host?.replace(/^www\./, '');
        
        if (currentDomain !== domain) {
            return res.status(400).json({
                success: false,
                error: 'Domain mismatch',
                message: `License domain (${domain}) doesn't match current domain (${currentDomain})`
            });
        }
        
        // Save license and generate 10 keys
        const licenseManager = new LicenseManager();
        const tenKeys = licenseManager.saveLicense(masterKey, domain);
        
        res.json({
            success: true,
            message: 'License activated successfully',
            data: {
                domain: domain,
                keysGenerated: Object.keys(tenKeys).length,
                message: 'All 10 license keys have been generated and stored securely'
            }
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Check license status
router.get('/check', async (req, res) => {
    const licenseManager = new LicenseManager();
    const isLicensed = licenseManager.isLicensed();
    const licenseInfo = licenseManager.getLicenseInfo();
    
    res.json({
        success: true,
        licensed: isLicensed,
        data: isLicensed ? {
            domain: licenseInfo.domain,
            installedAt: licenseInfo.installedAt,
            keysCount: Object.keys(licenseInfo.keys).length
        } : null
    });
});

// Get license info (for debugging - protected)
router.get('/info', async (req, res) => {
    // Only allow from localhost or admin
    const ip = req.ip;
    if (!ip.includes('127.0.0.1') && !ip.includes('::1')) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const licenseManager = new LicenseManager();
    const licenseInfo = licenseManager.getLicenseInfo();
    
    res.json({
        licensed: licenseManager.isLicensed(),
        licenseInfo: licenseInfo ? {
            domain: licenseInfo.domain,
            installedAt: licenseInfo.installedAt,
            keys: Object.keys(licenseInfo.keys)
        } : null
    });
});

// Reset license (for testing)
router.post('/reset', async (req, res) => {
    // Only allow from localhost
    const ip = req.ip;
    if (!ip.includes('127.0.0.1') && !ip.includes('::1')) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const licenseManager = new LicenseManager();
    licenseManager.deleteLicense();
    
    res.json({
        success: true,
        message: 'License reset successfully'
    });
});

module.exports = router;