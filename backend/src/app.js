const { URL } = require('node:url');
const routes = require('./routes');
const { success, error, fail } = require('./utils/http');
const { authenticate, authorize } = require('./middleware/auth');

const clientOrigin = () => process.env.CLIENT_ORIGIN || 'http://localhost:5173';

function matchRoute(method, pathname) {
  return routes.find((route) => {
    if (route.method !== method) return false;
    const routeParts = route.path.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);
    return (
      routeParts.length === pathParts.length &&
      routeParts.every(
        (part, index) =>
          part.startsWith(':') || part === pathParts[index],
      )
    );
  });
}

function paramsFor(route, pathname) {
  const values = pathname.split('/').filter(Boolean);
  return route.path
    .split('/')
    .filter(Boolean)
    .reduce((params, part, index) => {
      if (part.startsWith(':'))
        params[part.slice(1)] = decodeURIComponent(values[index]);
      return params;
    }, {});
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000)
        reject(
          Object.assign(new Error('Payload too large'), {
            status: 413,
            code: 'PAYLOAD_TOO_LARGE',
          }),
        );
    });
    request.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(
          Object.assign(
            new Error('Request body must be valid JSON.'),
            { status: 400, code: 'INVALID_JSON' },
          ),
        );
      }
    });
    request.on('error', reject);
  });
}

/** Extract caller IP for rate limiting. */
function clientIp(request) {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.socket?.remoteAddress || 'unknown';
}

function createApp() {
  return async (request, response) => {
    const origin = clientOrigin();

    // CORS — must allow credentials for cookie-based auth
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );
    response.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PATCH, DELETE, OPTIONS',
    );

    if (request.method === 'OPTIONS') {
      response.writeHead(204);
      response.end();
      return;
    }

    try {
      const url = new URL(request.url, 'http://localhost');

      if (request.method === 'GET' && url.pathname === '/health') {
        return success(response, { service: 'stocksense-api', status: 'healthy' });
      }

      const route = matchRoute(request.method, url.pathname);
      if (!route) fail(404, 'ROUTE_NOT_FOUND', 'That API endpoint does not exist.');

      const context = {
        body: ['POST', 'PATCH', 'PUT'].includes(request.method)
          ? await readBody(request)
          : {},
        query: Object.fromEntries(url.searchParams),
        params: paramsFor(route, url.pathname),
        headers: request.headers,
        response, // pass response so controllers can set cookies
        ip: clientIp(request),
      };

      if (route.auth) {
        authenticate(context);
        authorize(context, route.roles);
      }

      const result = await route.handler(context);
      success(response, result.data, result.message, result.status || 200, result.meta);
    } catch (err) {
      if (!err.status) console.error(err);
      error(response, err);
    }
  };
}

module.exports = { createApp };
