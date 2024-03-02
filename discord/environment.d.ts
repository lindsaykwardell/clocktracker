declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TOKEN: string;
      NODE_ENV: "development" | "production";
      DATABASE_URL: string;
      CLIENT_ID: string;
    }
  }
}
