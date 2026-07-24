import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // 运行时读取，Zeabur 可通过环境变量 API_HOST 注入 API 地址
    const apiHost = process.env.API_HOST || 'http://localhost:3333';
    return [
      {
        source: '/api/:path*',
        destination: `${apiHost}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiHost}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
