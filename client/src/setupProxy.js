// MS3 SECURITY: Configure security headers and CORS for Create React App dev server
// This file is automatically picked up by react-scripts

module.exports = function(app) {
  // MS3 SECURITY: Disable X-Powered-By on the Express app instance
  app.disable('x-powered-by');

  // MS3 SECURITY: Intercept response headers before they're sent
  // This overrides webpack-dev-server's default CORS wildcards
  app.use((req, res, next) => {
    const allowedOrigins = [
      'http://localhost:3000',  // Frontend dev server (self)
      'http://localhost:6060',  // Backend API
    ];

    const origin = req.get('Origin');

    // MS3 SECURITY: Override res.setHeader to prevent wildcard CORS and X-Powered-By
    const originalSetHeader = res.setHeader.bind(res);
    res.setHeader = function(name, value) {
      // MS3 SECURITY: Block X-Powered-By header from being set
      if (name.toLowerCase() === 'x-powered-by') {
        return; // Don't set this header at all
      }

      // MS3 SECURITY: Block wildcard CORS headers from being set
      if (name === 'Access-Control-Allow-Origin' && value === '*') {
        // Replace wildcard with specific origin if whitelisted
        if (origin && allowedOrigins.includes(origin)) {
          return originalSetHeader('Access-Control-Allow-Origin', origin);
        }
        // Otherwise, don't set the header at all
        return;
      }
      if (name === 'Access-Control-Allow-Methods' && value === '*') {
        return originalSetHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      }
      if (name === 'Access-Control-Allow-Headers' && value === '*') {
        return originalSetHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      }
      // Allow all other headers to be set normally
      return originalSetHeader(name, value);
    };

    // MS3 SECURITY: Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'no-referrer');

    // MS3 SECURITY: Log rejected CORS origins
    if (origin && !allowedOrigins.includes(origin)) {
      console.warn(`[Frontend] CORS rejected origin: ${origin}`);
    }

    next();
  });
};
