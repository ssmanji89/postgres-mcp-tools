declare module 'express' {
  import { Express, Request, Response, NextFunction } from 'express';
  export { Express, Request, Response, NextFunction };
  export default function createApplication(): Express;
}
