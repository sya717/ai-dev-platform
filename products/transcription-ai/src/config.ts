export function validateEnv(): void {
  const required = [
    'ZOOM_API_KEY',
    'OPENAI_API_KEY',
    'CLAUDE_API_KEY',
    'DATABASE_URL',
    'REDIS_URL',
    'AWS_S3_BUCKET'
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[CONFIG ERROR] Missing required environment variables: ${missing.join(', ')}\n` +
      `Please set them in your .env file`
    );
  }

  console.log('[CONFIG] All required environment variables are set ✅');
}

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3002',
  zoom: {
    apiKey: process.env.ZOOM_API_KEY!,
    apiSecret: process.env.ZOOM_API_SECRET!,
    webhookSecret: process.env.ZOOM_WEBHOOK_SECRET,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY!,
  },
  database: {
    url: process.env.DATABASE_URL!,
  },
  redis: {
    url: process.env.REDIS_URL!,
  },
  aws: {
    region: process.env.AWS_REGION || 'ap-northeast-1',
    s3Bucket: process.env.AWS_S3_BUCKET!,
  },
};
