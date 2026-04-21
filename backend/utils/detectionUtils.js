// utils/detectionUtils.js - COMPLETE WORKING VERSION

const PATTERNS = {
  // ========== EMAIL PATTERNS - SIMPLE AND DIRECT ==========
  EMAIL_SIMPLE: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  
  // ========== PHONE PATTERNS - SIMPLE AND DIRECT ==========
  PHONE_10_DIGIT: /\b\d{10}\b/g,
  PHONE_11_DIGIT: /\b\d{11}\b/g,
  PHONE_12_DIGIT: /\b\d{12}\b/g,
  PHONE_WITH_DASHES: /\b\d{3}[-]\d{3}[-]\d{4}\b/g,
  PHONE_WITH_SPACES: /\b\d{3}\s\d{3}\s\d{4}\b/g,
  PHONE_WITH_DOTS: /\b\d{3}\.\d{3}\.\d{4}\b/g,
  
  // ========== LINK PATTERNS - SIMPLE AND DIRECT ==========
  URL_HTTP: /https?:\/\/[^\s]+/gi,
  URL_WWW: /www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*/gi,
  URL_DOMAIN: /\b[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?\b/gi,
  URL_COMMON_TLDS: /\b[a-zA-Z0-9-]+\.(?:com|org|net|edu|gov|io|co|uk|de|jp|fr|au|ru|ch|it|nl|se|no|dk|fi|pl|cz|hu|pt|gr|eu|info|biz|tv|me|asia|xxx)\b/gi,
};

const WARNING_TYPES = {
  EMAIL: 'email',
  PHONE: 'phone', 
  LINK: 'link',
  OTHER: 'other'
};

// Simple direct email detection
const containsEmail = (content) => {
  if (!content) return false;
  
  // Reset regex
  PATTERNS.EMAIL_SIMPLE.lastIndex = 0;
  
  // Check for email pattern
  if (PATTERNS.EMAIL_SIMPLE.test(content)) {
    console.log('📧 Email detected:', content.match(PATTERNS.EMAIL_SIMPLE));
    return true;
  }
  
  return false;
};

// Simple direct phone detection
const containsPhone = (content) => {
  if (!content) return false;
  
  // Reset all regex
  PATTERNS.PHONE_10_DIGIT.lastIndex = 0;
  PATTERNS.PHONE_11_DIGIT.lastIndex = 0;
  PATTERNS.PHONE_12_DIGIT.lastIndex = 0;
  PATTERNS.PHONE_WITH_DASHES.lastIndex = 0;
  PATTERNS.PHONE_WITH_SPACES.lastIndex = 0;
  PATTERNS.PHONE_WITH_DOTS.lastIndex = 0;
  
  // Remove all non-digit characters for checking
  const digitsOnly = content.replace(/\D/g, '');
  
  // Check for 10-12 digit numbers (phone numbers)
  if (digitsOnly.length >= 10 && digitsOnly.length <= 12) {
    console.log('📱 Phone detected (digits only):', digitsOnly);
    return true;
  }
  
  // Check for formatted phone numbers
  if (PATTERNS.PHONE_10_DIGIT.test(content)) {
    console.log('📱 Phone detected (10 digit)');
    return true;
  }
  if (PATTERNS.PHONE_11_DIGIT.test(content)) {
    console.log('📱 Phone detected (11 digit)');
    return true;
  }
  if (PATTERNS.PHONE_WITH_DASHES.test(content)) {
    console.log('📱 Phone detected (with dashes)');
    return true;
  }
  if (PATTERNS.PHONE_WITH_SPACES.test(content)) {
    console.log('📱 Phone detected (with spaces)');
    return true;
  }
  if (PATTERNS.PHONE_WITH_DOTS.test(content)) {
    console.log('📱 Phone detected (with dots)');
    return true;
  }
  
  return false;
};

// Simple direct link detection
const containsLink = (content) => {
  if (!content) return false;
  
  // Reset all regex
  PATTERNS.URL_HTTP.lastIndex = 0;
  PATTERNS.URL_WWW.lastIndex = 0;
  PATTERNS.URL_DOMAIN.lastIndex = 0;
  PATTERNS.URL_COMMON_TLDS.lastIndex = 0;
  
  // Check for http/https URLs
  if (PATTERNS.URL_HTTP.test(content)) {
    console.log('🔗 Link detected (http/https)');
    return true;
  }
  
  // Check for www URLs
  if (PATTERNS.URL_WWW.test(content)) {
    console.log('🔗 Link detected (www)');
    return true;
  }
  
  // Check for domain with common TLDs (like youtube.com, google.com)
  if (PATTERNS.URL_COMMON_TLDS.test(content)) {
    console.log('🔗 Link detected (common TLD):', content.match(PATTERNS.URL_COMMON_TLDS));
    return true;
  }
  
  // Check for any domain pattern
  if (PATTERNS.URL_DOMAIN.test(content)) {
    console.log('🔗 Link detected (domain)');
    return true;
  }
  
  return false;
};

// Main detection function
const detectProhibitedContent = (content) => {
  if (!content || typeof content !== 'string') {
    return [];
  }

  console.log('🔍 ========== DETECTION START ==========');
  console.log('🔍 Content:', content);
  const detectedTypes = [];

  // Check for emails
  if (containsEmail(content)) {
    detectedTypes.push(WARNING_TYPES.EMAIL);
    console.log('✅ EMAIL added');
  }

  // Check for phone numbers
  if (containsPhone(content)) {
    detectedTypes.push(WARNING_TYPES.PHONE);
    console.log('✅ PHONE added');
  }

  // Check for URLs/links
  if (containsLink(content)) {
    detectedTypes.push(WARNING_TYPES.LINK);
    console.log('✅ LINK added');
  }

  const uniqueTypes = [...new Set(detectedTypes)];
  console.log('🎯 Final detectedTypes:', uniqueTypes);
  console.log('🔍 ========== DETECTION END ==========');
  
  return uniqueTypes;
};

const generateRedactedContent = (content, detectedTypes) => {
  if (!content) return content;
  let redacted = content;
  
  if (detectedTypes.includes(WARNING_TYPES.EMAIL)) {
    redacted = redacted.replace(PATTERNS.EMAIL_SIMPLE, '[EMAIL REDACTED]');
  }
  
  if (detectedTypes.includes(WARNING_TYPES.PHONE)) {
    redacted = redacted.replace(/\b\d{10}\b/g, '[PHONE REDACTED]');
    redacted = redacted.replace(/\b\d{11}\b/g, '[PHONE REDACTED]');
    redacted = redacted.replace(/\b\d{3}[-]\d{3}[-]\d{4}\b/g, '[PHONE REDACTED]');
    redacted = redacted.replace(/\b\d{3}\s\d{3}\s\d{4}\b/g, '[PHONE REDACTED]');
  }
  
  if (detectedTypes.includes(WARNING_TYPES.LINK)) {
    redacted = redacted.replace(/https?:\/\/[^\s]+/g, '[LINK REDACTED]');
    redacted = redacted.replace(/www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*/g, '[LINK REDACTED]');
    redacted = redacted.replace(/\b[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?\b/g, '[LINK REDACTED]');
  }
  
  return redacted;
};

const shouldBlockMessage = (detectedTypes) => {
  return detectedTypes.length > 0;
};

const getWarningMessage = (warningNumber) => {
  const messages = {
    1: '⚠️ First Warning: Do not share personal contact information (emails, phone numbers, links). This violates our terms of service.',
    2: '⚠️⚠️ Second Warning: Sharing personal contact information is strictly prohibited. Further violations will result in account deactivation.',
    3: '⚠️⚠️⚠️ Final Warning: Your account has been deactivated for repeatedly violating our terms of service.'
  };
  return messages[warningNumber] || messages[1];
};

module.exports = {
  detectProhibitedContent,
  generateRedactedContent,
  shouldBlockMessage,
  getWarningMessage,
  WARNING_TYPES,
  PATTERNS
};