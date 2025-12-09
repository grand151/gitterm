# Gitterm Proxy (Caddy)

This service acts as a reverse proxy for Gitterm workspaces, handling authentication and routing requests to the appropriate workspace containers.

## Architecture

```
Client (Browser)
  ↓ HTTPS (via Cloudflare)
Railway Edge
  ↓ HTTP
Caddy Proxy (this service)
  ↓ 
  ├─→ Auth Request → API Server (server.railway.internal:8080)
  │                   Returns: X-Container-Host, X-Container-Port
  ↓
Workspace Container (ws-*.railway.internal:7681)
  ↓
ttyd Terminal Service
```

## Key Features

- **Dynamic Routing**: Routes requests to workspace containers based on subdomain
- **Authentication**: Validates requests via the API server before proxying
- **WebSocket Support**: Full WebSocket upgrade support for ttyd terminal sessions
- **Health Checks**: `/health` endpoint for monitoring
- **Error Handling**: JSON error responses for 400/401/403/404/500 errors

## Configuration

### Environment Variables

- None required! Caddy handles everything automatically.

### Internal API Key

The proxy authenticates with the API server using the internal key defined in the Caddyfile:
```
X-Internal-Key: "EdBY7UDhP-bVJbAns_E9yiFbx_B!tg_"
```

**Important**: This must match `INTERNAL_API_KEY` environment variable on the API server.

## How It Works

1. **Request arrives** at `https://ws-abc123.gitterm.dev/`
2. **Caddy extracts subdomain** from the Host header
3. **Forward auth** to `server.railway.internal:8080/internal/proxy-resolve`
   - Sends original cookies, authorization, URI, etc.
   - API server validates session and looks up workspace
4. **API server responds** with headers:
   - `X-Container-Host`: e.g., `ws-abc123.railway.internal`
   - `X-Container-Port`: e.g., `7681`
5. **Caddy proxies** to `http://ws-abc123.railway.internal:7681/`
6. **Workspace container** (running ttyd) receives the request
7. **Response flows back** through the proxy to the client

## Advantages Over Nginx

- ✅ **Simpler configuration** - No complex variable parsing
- ✅ **Better DNS handling** - Handles Railway's internal DNS automatically
- ✅ **No resolver issues** - Works out of the box with `.railway.internal` domains
- ✅ **Built-in forward auth** - Native support for auth subrequests
- ✅ **Better WebSocket handling** - Automatic upgrade detection
- ✅ **Auto-HTTPS** - Disabled for Railway (Railway edge handles it)
- ✅ **JSON config alternative** - Can use JSON if preferred
- ✅ **Better error handling** - Clean error response templates

## Health Check

```bash
curl https://ws-abc123.gitterm.dev/health
# Response: {"status":"UP"}
```

## Deployment

Railway automatically builds and deploys this service when changes are pushed.

### Build Configuration

See `railway.config.json`:
- Uses Dockerfile build
- Watches `apps/new-proxy/**/*` for changes
- Exposes port 80

### Logs

Caddy automatically logs all requests in JSON format, making it easy to monitor and debug.

## Troubleshooting

### Workspace not found (404)

- Check if workspace exists in database
- Verify subdomain matches workspace.subdomain field
- Check API server logs for the auth request

### Connection timeout to workspace

- Verify workspace container is running in Railway
- Check workspace is listening on the correct port (usually 7681)
- Ensure workspace has `.railway.internal` hostname

### DNS resolution failures

- Caddy handles Railway's DNS automatically
- If issues persist, check Railway network status
- Verify both proxy and workspace are in the same Railway project/environment

### After redeploying API server

If the API server is redeployed, you may need to restart the proxy service for Railway's private network to update routing. This is a Railway platform behavior.

## API Server Integration

The proxy expects the API server to implement:

**Endpoint**: `GET /internal/proxy-resolve`

**Request Headers**:
- `Host`: Original request host (e.g., `ws-abc123.gitterm.dev`)
- `X-Internal-Key`: Internal API key for authentication
- `Cookie`: Original cookies for session validation
- `Authorization`: Original authorization header
- `X-Original-URI`: Original request URI
- `X-Original-Method`: Original HTTP method

**Response Headers** (on success - 200 OK):
- `X-Container-Host`: Hostname of workspace container (e.g., `ws-abc123.railway.internal`)
- `X-Container-Port`: Port of workspace container (e.g., `7681`)

**Error Responses**:
- `400`: Bad request (missing subdomain)
- `401`: Unauthorized (invalid session)
- `403`: Forbidden (user doesn't own workspace)
- `404`: Not found (workspace doesn't exist)
- `500`: Internal server error

## Files

- `Caddyfile` - Main Caddy configuration
- `Dockerfile` - Container build configuration
- `railway.config.json` - Railway deployment configuration
- `README.md` - This file

## Migration from Nginx

Previous nginx configuration has been replaced with this Caddy setup. Key differences:

- No need for explicit DNS resolvers
- Simpler variable handling
- Built-in forward auth support
- Better Railway compatibility

All functionality remains the same from the client perspective.
