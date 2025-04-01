// Type definitions for Express

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        fullName: string;
        position?: string;
        office?: string;
      };
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      fullName: string;
    };
  }
}