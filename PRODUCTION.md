# Production Checklist

## Secrets and Config
- Keep all secrets in `.env` only; never commit them.
- Rotate credentials if any secret was ever committed or shared.
- Use `NODE_ENV=production` in production.

## Network and TLS
- Terminate TLS at a reverse proxy (Nginx/Caddy) or a load balancer.
- Ensure `X-Forwarded-Proto` and `X-Forwarded-For` are forwarded; Express already trusts one proxy hop.

## CORS and CSRF
- Set `CORS_ORIGINS` and `FRONTEND_URL` to your real domain.
- Avoid `"*"` in CORS when credentials are used.
- If you move to cookie auth, add CSRF protection.

## Security Headers
- Keep `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- Enable HSTS in production (already set).
- Consider a restrictive `Content-Security-Policy` for the frontend.

## Authentication and Cookies
- If switching to cookies, set `HttpOnly`, `Secure`, `SameSite=Lax/Strict`.
- Keep JWT secret strong; rotate if leaked.

## Rate Limiting and Abuse Protection
- Keep Redis online; if Redis is down, rate limiting is bypassed.
- Consider stricter limits on auth endpoints.

## Logging and Observability
- Keep request ids in logs (`X-Request-Id`).
- Track slow requests (`LOG_SLOW_MS`).
- Add log aggregation in production.

## Uploads and Media
- R2 public: set `R2_PUBLIC_URL` to your public domain.
- R2 private: set `R2_PRIVATE=true` and `R2_SIGNED_URL_TTL` for signed URLs.
- If R2 fails, uploads fall back to local disk.

## Database
- Use MongoDB Atlas production cluster or self-host with monitoring.
- Add indexes for hot queries once traffic grows.

## Scaling
- Single instance is OK for small traffic.
- For horizontal scaling: add Socket.io Redis adapter, move uploads to R2, and use a process manager.
