# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy monorepo files
COPY package.json pnpm-lock.yaml ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy packages and apps
COPY packages ./packages
COPY apps/web ./apps/web

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm run build

# Production stage
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install serve to run the Next.js app
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./

# Install production dependencies only
RUN npm install -g pnpm
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

CMD ["serve", "-s", ".next", "-l", "3001"]
