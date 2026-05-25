const crypto = require('crypto');

// In-memory storage for OTPs (in production, use Redis or database)
const otpStore = new Map();

// Generate a 6-digit random OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Store OTP with expiration (10 minutes)
const storeOTP = (email, otp) => {
  const expirationTime = Date.now() + (10 * 60 * 1000); // 10 minutes
  otpStore.set(email, {
    otp,
    expiresAt: expirationTime
  });
};

// Verify OTP
const verifyOTP = (email, otp) => {
  const storedData = otpStore.get(email);

  if (!storedData) {
    return { valid: false, reason: 'OTP not found' };
  }

  // Check if OTP has expired
  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(email); // Clean up expired OTP
    return { valid: false, reason: 'expired' };
  }

  // Check if OTP matches
  if (storedData.otp !== otp) {
    return { valid: false, reason: 'invalid' };
  }

  // OTP is valid, remove it from storage
  otpStore.delete(email);
  return { valid: true };
};

// Clean up expired OTPs (optional cleanup function)
const cleanupExpiredOTPs = () => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(email);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP
};
