# ================================
# Stage 1: Build
# ================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Pass the GitHub Secrets API URL into the React Build Process
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the production bundle (skip tsc type-checking, use vite directly)
RUN npx vite build

# ================================
# Stage 2: Serve with Nginx
# ================================
FROM nginx:stable-alpine AS production

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config for React Router (SPA support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 5174 (nginx listens on 5174)
EXPOSE 5174

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
