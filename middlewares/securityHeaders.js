// MS3 SECURITY: Explicit security headers middleware
// Ensures all responses include critical security headers

export const setSecurityHeaders = (req, res, next) => {
  // MS3 SECURITY: Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // MS3 SECURITY: Anti-clickjacking protection
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // MS3 SECURITY: Control referrer information
  res.setHeader('Referrer-Policy', 'no-referrer');

  // MS3 SECURITY: Force HTTPS in production (HSTS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // MS3 SECURITY: Remove X-Powered-By if it somehow gets set
  res.removeHeader('X-Powered-By');

  next();
};
