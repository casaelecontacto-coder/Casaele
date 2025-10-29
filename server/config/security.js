const securityHeaders = {
    'Content-Security-Policy': "default-src 'self'; font-src 'self' https://js.stripe.com https: data:; img-src 'self' https: data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://js.stripe.com;",
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

module.exports = securityHeaders;
