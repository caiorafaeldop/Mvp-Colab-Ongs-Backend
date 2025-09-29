// Simple environment config placeholder. Consider validating with zod/joi later.
const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_STRATEGY: process.env.DATABASE_STRATEGY || 'prisma',
  STORAGE_BRIDGE: process.env.STORAGE_BRIDGE || 'cloudinary',
  LOCAL_UPLOAD_PATH: process.env.LOCAL_UPLOAD_PATH || './uploads',

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,

  MERCADO_PAGO_ACCESS_TOKEN: process.env.MERCADO_PAGO_ACCESS_TOKEN,

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

module.exports = env;
