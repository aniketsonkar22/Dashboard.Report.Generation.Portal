# 1) Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps
COPY . .
RUN npm run build

# 2) Runtime stage
FROM nginx:1.27-alpine AS runtime

# Copy NGINX config (listens on 8080)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Angular output
COPY --from=build /app/dist/pc-frontend/browser /usr/share/nginx/html

# Runtime env injection (executed by nginx entrypoint)
COPY entrypoint.sh /docker-entrypoint.d/99-inject-env.sh
RUN chmod +x /docker-entrypoint.d/99-inject-env.sh

# Important: expose 8080 and DON'T set NGINX to 80
EXPOSE 8080
# You don't need to set PORT yourself; Cloud Run will inject it.
CMD ["nginx", "-g", "daemon off;"]