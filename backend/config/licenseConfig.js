// config/licenseConfig.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ONLY ALLOWED DOMAIN - HARDCODED
const ALLOWED_DOMAINS = {
    'hecatevoyance.fr': {
        enabled: true,
        productionOnly: true,
        licenseRequired: true
    },
    'localhost': {
        enabled: true,
        productionOnly: false,
        licenseRequired: false
    },
    '127.0.0.1': {
        enabled: true,
        productionOnly: false,
        licenseRequired: false
    }
};

// 10 Different License Keys Storage
const LICENSE_FILE = path.join(__dirname, '../.license');
const ENCRYPTION_KEY = process.env.LICENSE_ENCRYPTION_KEY || 'default-key-change-this-32chars!';

class LicenseManager {
    constructor() {
        this.licenseData = null;
        this.loadLicense();
    }

    // Generate 10 different keys from master key
    generateTenKeys(masterKey, domain) {
        const keys = {};
        const keyTypes = [
            'MASTER', 'DATABASE', 'USER_PANEL', 'PSYCHIC_PANEL', 
            'ADMIN_PANEL', 'BLOG_PANEL', 'CHAT_SYSTEM', 
            'CALL_SYSTEM', 'PAYMENT_SYSTEM', 'API_GATEWAY'
        ];
        
        keyTypes.forEach((type, index) => {
            const hash = crypto.createHmac('sha256', masterKey)
                .update(`${type}|${domain}|${index}`)
                .digest('hex')
                .substring(0, 32);
            keys[type] = hash;
        });
        
        return keys;
    }

    // Verify specific key type
    verifyKey(key, keyType, domain) {
        if (!this.licenseData || !this.licenseData.keys) {
            return false;
        }
        
        const expectedKey = this.licenseData.keys[keyType];
        return key === expectedKey;
    }

    // Save license
    saveLicense(masterKey, domain) {
        // Validate domain
        if (!ALLOWED_DOMAINS[domain] || !ALLOWED_DOMAINS[domain].enabled) {
            throw new Error(`Domain ${domain} is not authorized for this software`);
        }
        
        // Generate all 10 keys
        const keys = this.generateTenKeys(masterKey, domain);
        
        const licenseData = {
            masterKey: masterKey,
            domain: domain,
            keys: keys,
            installedAt: Date.now(),
            machineId: this.getMachineId(),
            version: '1.0'
        };
        
        // Encrypt and save
        const encrypted = this.encrypt(JSON.stringify(licenseData));
        fs.writeFileSync(LICENSE_FILE, encrypted);
        this.licenseData = licenseData;
        
        return keys;
    }

    // Load and validate license
    loadLicense() {
        try {
            if (!fs.existsSync(LICENSE_FILE)) {
                return false;
            }
            
            const encrypted = fs.readFileSync(LICENSE_FILE, 'utf8');
            const decrypted = this.decrypt(encrypted);
            this.licenseData = JSON.parse(decrypted);
            
            // Validate domain
            const currentDomain = process.env.DOMAIN || 'localhost';
            if (this.licenseData.domain !== currentDomain) {
                this.deleteLicense();
                return false;
            }
            
            // Validate machine ID
            const currentMachineId = this.getMachineId();
            if (this.licenseData.machineId !== currentMachineId) {
                this.deleteLicense();
                return false;
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }

    // Delete license (on violation)
    deleteLicense() {
        if (fs.existsSync(LICENSE_FILE)) {
            fs.unlinkSync(LICENSE_FILE);
        }
        this.licenseData = null;
    }

    // Get machine ID
    getMachineId() {
        const os = require('os');
        const interfaces = os.networkInterfaces();
        let mac = '';
        
        for (const iface of Object.values(interfaces)) {
            for (const details of iface) {
                if (details.mac && details.mac !== '00:00:00:00:00:00') {
                    mac = details.mac;
                    break;
                }
            }
            if (mac) break;
        }
        
        return crypto.createHash('sha256')
            .update(`${mac}${os.hostname()}${os.platform()}`)
            .digest('hex');
    }

    // Encryption helpers
    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    decrypt(text) {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }

    // Check if license exists and valid
    isLicensed() {
        return this.licenseData !== null;
    }

    // Get license info
    getLicenseInfo() {
        return this.licenseData;
    }
}

module.exports = { LicenseManager, ALLOWED_DOMAINS };