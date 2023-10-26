declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGO_CONNECTION_URL: string | undefined;
      SESSION_SECRET: string | undefined;
      JWT_SECRET: string | undefined;
      BCRYPT_SALT: number | undefined;
      SENDGRID_APIKEY: string | undefined;
      CLOUDINARY_API_SECRET: string | undefined;
      CLOUDNAME: string | undefined;
      CLOUDINARY_API_KEY: string | undefined;
      REDIS_URL: string | undefined;
      FCM_SERVICE_ACCOUNT: string | undefined;
    }
  }
}

export {};
