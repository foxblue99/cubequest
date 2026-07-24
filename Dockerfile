# ============================================================
# CubeQuest 根级 Dockerfile（Zeabur Monorepo 部署专用）
# 通过环境变量 SERVICE=api 或 SERVICE=web 选择启动哪个服务
# ============================================================

# ============ Stage 1: 构建 API ============
FROM node:22-slim AS api-builder
WORKDIR /app

# 安装系统依赖（Prisma 需要 OpenSSL）
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 占位数据库 URL（仅用于 build 阶段，prisma generate 需要 schema 能解析）
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder

# 先拷贝 prisma schema（npm ci 的 postinstall 会触发 prisma generate）
COPY cubequest-api/package.json cubequest-api/package-lock.json* ./
COPY cubequest-api/prisma ./prisma
RUN npm install --legacy-peer-deps

# 拷贝剩余源码并构建
COPY cubequest-api/ ./
RUN npm run build

# 编译 seed 脚本为 JS（生产环境不装 ts-node）
RUN npx tsc prisma/seed.ts --outDir dist/seed --esModuleInterop --module nodenext --moduleResolution nodenext --skipLibCheck || true
RUN npx tsc prisma/seed-cats.ts --outDir dist/seed --esModuleInterop --module nodenext --moduleResolution nodenext --skipLibCheck || true
RUN npx tsc prisma/seed-records.ts --outDir dist/seed --esModuleInterop --module nodenext --moduleResolution nodenext --skipLibCheck || true

# ============ Stage 2: 构建 Web ============
FROM node:22-slim AS web-builder
WORKDIR /app
COPY cubequest-web/package.json cubequest-web/package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY cubequest-web/ ./
RUN npm run build

# ============ Stage 3: 生产镜像（包含两个服务） ============
FROM node:22-slim AS production

# 安装系统依赖（Prisma 需要 OpenSSL）
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# ---------- API 文件 ----------
WORKDIR /api

# 先拷贝 prisma schema（npm ci 的 postinstall 会触发 prisma generate）
COPY cubequest-api/package.json cubequest-api/package-lock.json* ./
COPY cubequest-api/prisma ./prisma
RUN npm install --omit=dev --legacy-peer-deps

# 拷贝编译产物
COPY --from=api-builder /app/dist ./dist

RUN mkdir -p /api/uploads

# ---------- Web 文件 ----------
WORKDIR /web
COPY --from=web-builder /app/package.json ./
COPY --from=web-builder /app/node_modules ./node_modules
COPY --from=web-builder /app/.next ./.next
COPY --from=web-builder /app/public ./public
COPY --from=web-builder /app/next.config.ts ./

# ---------- 统一入口脚本 ----------
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /
EXPOSE 3000 3333

CMD ["/entrypoint.sh"]
