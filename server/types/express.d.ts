import { User as DatabaseUser } from "../../shared/schema";

declare global {
  namespace Express {
    interface User extends DatabaseUser {
      // Additional properties from authentication if needed
      claims?: {
        sub: string;
        email: string;
        name: string;
      };
      expires_at?: number;
    }
    
    interface Request {
      user?: User;
    }
  }
}

export {}; // Make this file a module