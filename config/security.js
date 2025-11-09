// MS3 SECURITY: Security configuration module for headers and CORS
import helmet from 'helmet';

// MS3 SECURITY: Helmet configuration with Content Security Policy
export const helmetConfig = helmet({
  // Content Security Policy configuration
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "cdn.jsdelivr.net" // MS3 SECURITY: Bootstrap CDN
      ],
      styleSrc: [
        "'self'",
        "cdn.jsdelivr.net" // MS3 SECURITY: Bootstrap CDN
      ],
      fontSrc: ["'self'", "data:", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:"], // MS3 SECURITY: Removed https: wildcard - only allow same-origin and data URIs
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"], // MS3 SECURITY: Restrict base tag URLs
      upgradeInsecureRequests: [], // MS3 SECURITY: Upgrade HTTP to HTTPS when in production
      // MS3 SECURITY: Anti-clickjacking protection - only allow framing from same origin
      frameAncestors: ["'self'"],
      // MS3 SECURITY: Restrict form submissions to same origin
      formAction: ["'self'"]
    }
  },
  // MS3 SECURITY: X-Frame-Options for anti-clickjacking (redundant with CSP frame-ancestors, for older browsers)
  frameguard: {
    action: 'sameorigin'
  },
  // MS3 SECURITY: Prevent MIME type sniffing
  contentTypeOptions: {
    nosniff: true
  },
  // MS3 SECURITY: Hide X-Powered-By header
  hidePoweredBy: true,
  // MS3 SECURITY: HSTS - force HTTPS (enable in production)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  // MS3 SECURITY: Referrer policy - don't leak referrer information
  referrerPolicy: {
    policy: 'no-referrer'
  }
});

// MS3 SECURITY: CORS configuration - restrict to known origins
export const getCorsConfig = () => {
  // MS3 SECURITY: Whitelist of allowed origins
  const allowedOrigins = [
    'http://localhost:3000', // Development frontend
    'http://localhost:6060', // Development backend
    process.env.FRONTEND_URL, // Production frontend (from env)
    process.env.BACKEND_URL    // Production backend (from env)
  ].filter(Boolean); // Remove undefined values

  return {
    origin: (origin, callback) => {
      // MS3 SECURITY: Allow requests with no origin (same-origin, Postman, curl, mobile apps)
      // This won't add Access-Control-Allow-Origin header, preventing wildcard
      if (!origin) return callback(null, true);

      // MS3 SECURITY: Check if origin is in whitelist
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // MS3 SECURITY: Log rejected origins for monitoring (silent deny, no error)
        console.warn(`CORS rejected origin: ${origin}`);
        // MS3 SECURITY: Return false to deny without throwing error (prevents 500 response)
        callback(null, false);
      }
    },
    // MS3 SECURITY: Explicitly define allowed methods (no wildcards)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // MS3 SECURITY: Explicitly define allowed headers (no wildcards)
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    // MS3 SECURITY: Allow cookies and authentication headers
    credentials: true,
    optionsSuccessStatus: 200
  };
};

// MS3 SECURITY: For testing environments, use permissive CORS (but still no wildcards)
export const getTestCorsConfig = () => ({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
});
