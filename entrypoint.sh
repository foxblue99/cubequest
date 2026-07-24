#!/bin/bash
set -e

echo "=== CubeQuest 启动 (SERVICE=${SERVICE:-api}) ==="

if [ "$SERVICE" = "web" ]; then
  # ---------- 启动前端 ----------
  echo ">> 启动 Web 服务 (Next.js)..."
  cd /web
  exec npm start
else
  # ---------- 启动后端 ----------
  cd /api

  # 推送数据库 schema（失败不阻塞启动）
  echo ">> 推送 Prisma schema 到数据库..."
  if npx prisma db push --skip-generate 2>&1; then
    echo "  schema 同步完成"
  else
    echo "  ! schema 推送失败（可能 schema 已存在或数据库不可达）"
  fi

  # 执行 seed（可选，失败不阻塞启动）
  echo ">> 执行数据库初始化种子..."
  if [ -f dist/seed/seed.js ]; then
    node dist/seed/seed.js 2>&1 || echo "  (seed 已存在或跳过)"
  fi
  if [ -f dist/seed/seed-cats.js ]; then
    node dist/seed/seed-cats.js 2>&1 || echo "  (seed-cats 已存在或跳过)"
  fi
  if [ -f dist/seed/seed-records.js ]; then
    node dist/seed/seed-records.js 2>&1 || echo "  (seed-records 已存在或跳过)"
  fi

  # 启动 NestJS
  echo ">> 启动 API 服务 (NestJS)..."
  exec node dist/main
fi
