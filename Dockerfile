# ─────────────────────────────────────────────
# Stage 1 — Build
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 — Serve
# ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for SPA routing (React Router support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
