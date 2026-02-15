# ── Stage 1: Install dependencies & build ────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Copy workspace root files needed for npm install
COPY package.json package-lock.json ./

# Copy only the packages we need (dashboard + mcp-server) so that
# npm can resolve the workspace graph correctly.
COPY packages/dashboard/package.json packages/dashboard/package.json
COPY packages/mcp-server/package.json packages/mcp-server/package.json

# Stub out the lens package so npm workspaces doesn't fail on the missing
# workspace entry, but we never build it.
COPY packages/lens/package.json packages/lens/package.json

# Install all dependencies (including devDependencies for building).
# --ignore-scripts avoids running the root "prepare" hook (husky) which is not
# needed inside a container.
RUN npm ci --ignore-scripts

# Copy source code for the two packages we actually build
COPY packages/dashboard/ packages/dashboard/
COPY packages/mcp-server/ packages/mcp-server/

# Build dashboard first (Vite), then the MCP server (tsc)
RUN npm run build -w @clens/dashboard && npm run build -w @clens/mcp-server

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:24-alpine AS production

# Install tini — a minimal init that reaps zombies and forwards signals so
# Node.js doesn't run as PID 1.
RUN apk add --no-cache tini

WORKDIR /app

# Copy workspace root files for npm ci --omit=dev
COPY package.json package-lock.json ./
COPY packages/dashboard/package.json packages/dashboard/package.json
COPY packages/mcp-server/package.json packages/mcp-server/package.json
COPY packages/lens/package.json packages/lens/package.json

# Install production-only dependencies, skip husky prepare hook,
# then remove the npm cache to shrink the layer and avoid leaking
# internal registry metadata.
RUN npm ci --omit=dev --ignore-scripts && rm -rf /root/.npm

# Copy built artefacts from the builder stage
COPY --from=builder /app/packages/dashboard/dist/ packages/dashboard/dist/
COPY --from=builder /app/packages/mcp-server/dist/ packages/mcp-server/dist/

# ── Security: run as a non-root user ─────────────────────────────────────────
# Create a dedicated system user/group so the Node process never runs as root.
RUN addgroup -S clens && adduser -S -G clens clens \
    && chown -R clens:clens /app

USER clens

# The MCP server listens on this port for HTTP (dashboard UI, task queue, SSE)
EXPOSE 3100

# Default to SSE transport inside a container (stdio is unusable without a
# wrapping process that bridges stdin/stdout).
ENV MCP_TRANSPORT=sse
ENV MCP_HTTP_PORT=3100
ENV NODE_ENV=production

# Use tini as the entrypoint so signals are properly forwarded to Node.
ENTRYPOINT ["/sbin/tini", "--"]

# Run the compiled MCP server
CMD ["node", "packages/mcp-server/dist/index.js"]
