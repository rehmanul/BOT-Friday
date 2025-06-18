
import { logger } from './logger';

interface EnvironmentConfig {
  // Required environment variables
  required: string[];
  // Optional environment variables with defaults
  optional: { [key: string]: string };
  // Sensitive variables that should not be logged
  sensitive: string[];
}

const envConfig: EnvironmentConfig = {
  required: [
    'GEMINI_API_KEY',
    'PERPLEXITY_API_KEY',
    'TIKTOK_APP_ID',
    'TIKTOK_APP_SECRET'
  ],
  optional: {
    'NODE_ENV': 'development',
    'LOG_LEVEL': '2',
    'TIKTOK_HOURLY_LIMIT': '15',
    'TIKTOK_DAILY_LIMIT': '200',
    'TIKTOK_WEEKLY_LIMIT': '1000',
    'MIN_REQUEST_DELAY_MS': '120000',
    'API_KEY': ''
  },
  sensitive: [
    'GEMINI_API_KEY',
    'PERPLEXITY_API_KEY',
    'TIKTOK_APP_SECRET',
    'API_KEY'
  ]
};

export function validateEnvironment(): boolean {
  let isValid = true;
  const missingRequired: string[] = [];
  const loadedOptional: string[] = [];

  // Check required variables
  for (const varName of envConfig.required) {
    if (!process.env[varName]) {
      missingRequired.push(varName);
      isValid = false;
    }
  }

  // Set optional variables with defaults
  for (const [varName, defaultValue] of Object.entries(envConfig.optional)) {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      loadedOptional.push(`${varName}=${defaultValue}`);
    }
  }

  // Log results
  if (missingRequired.length > 0) {
    logger.error(
      'Missing required environment variables',
      'env-validator',
      undefined,
      undefined,
      { missingVariables: missingRequired }
    );
  }

  if (loadedOptional.length > 0) {
    logger.info(
      'Loaded default values for optional environment variables',
      'env-validator',
      undefined,
      { defaults: loadedOptional }
    );
  }

  // Log loaded variables (excluding sensitive ones)
  const loadedVars = Object.keys(process.env)
    .filter(key => !envConfig.sensitive.includes(key))
    .filter(key => [...envConfig.required, ...Object.keys(envConfig.optional)].includes(key))
    .map(key => `${key}=${process.env[key]}`);

  const sensitiveCount = envConfig.sensitive.filter(key => process.env[key]).length;

  logger.info(
    'Environment validation completed',
    'env-validator',
    undefined,
    {
      loaded: loadedVars,
      sensitiveVariablesCount: sensitiveCount,
      isValid
    }
  );

  return isValid;
}

export function getEnvironmentInfo(): any {
  return {
    nodeEnv: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    platform: process.platform,
    nodeVersion: process.version,
    configuredVariables: {
      required: envConfig.required.filter(key => !!process.env[key]),
      optional: Object.keys(envConfig.optional).filter(key => !!process.env[key]),
      sensitive: envConfig.sensitive.filter(key => !!process.env[key]).length
    }
  };
}
