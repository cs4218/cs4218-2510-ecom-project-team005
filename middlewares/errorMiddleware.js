// MS3 SECURITY: Centralized error handling middleware

// MS3 SECURITY: 404 Not Found handler
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// MS3 SECURITY: Global error handler
export const errorHandler = (err, req, res, next) => {
  // MS3 SECURITY: Ensure security headers are set on error responses
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.removeHeader('X-Powered-By');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // MS3 SECURITY: Handle CORS errors specifically (return 403, not 500)
  if (err.message && err.message.includes('Not allowed by CORS')) {
    console.warn('CORS error caught in error handler:', {
      origin: req.get('Origin'),
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    return res.status(403).json({
      success: false,
      message: 'CORS origin not allowed'
    });
  }

  // MS3 SECURITY: Determine status code (500 if not set)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // MS3 SECURITY: Log detailed error server-side for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // MS3 SECURITY: Send sanitized error response to client
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'An error occurred processing your request' // MS3 SECURITY: Generic message in production
      : err.message, // MS3 SECURITY: Detailed message in development
    // MS3 SECURITY: Never expose stack traces in production
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// MS3 SECURITY: Async error wrapper to catch promise rejections
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
