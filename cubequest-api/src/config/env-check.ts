export function assertProductionSecrets() {
  if (process.env.NODE_ENV === 'production') {
    const missing: string[] = [];

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'cubequest-jwt-secret-dev-only') {
      missing.push('JWT_SECRET (must not be default value)');
    }
    if (!process.env.AI_API_KEY) {
      missing.push('AI_API_KEY');
    }

    if (missing.length > 0) {
      throw new Error(
        `生产环境缺少必要配置: ${missing.join(', ')}。请检查 .env 文件。`
      );
    }
  }
}
