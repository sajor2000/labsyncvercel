import { Request, Response, NextFunction } from 'express';
import * as zlib from 'zlib';

/**
 * Simple compression middleware implementation
 */
export const compressionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  // Only compress JSON responses
  const originalJson = res.json;
  res.json = function(obj: any) {
    const jsonString = JSON.stringify(obj);
    
    // Only compress responses larger than 1KB
    if (jsonString.length < 1024) {
      return originalJson.call(this, obj);
    }
    
    // Support gzip compression
    if (acceptEncoding.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'application/json');
      
      const compressed = zlib.gzipSync(jsonString);
      return res.end(compressed);
    }
    
    // Support deflate compression  
    if (acceptEncoding.includes('deflate')) {
      res.setHeader('Content-Encoding', 'deflate');
      res.setHeader('Content-Type', 'application/json');
      
      const compressed = zlib.deflateSync(jsonString);
      return res.end(compressed);
    }
    
    // No compression supported, return original
    return originalJson.call(this, obj);
  };
  
  next();
};