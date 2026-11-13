import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: AccessTokenPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Brak tokenu uwierzytelniającego' });
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token nieprawidłowy lub wygasł' });
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Brak uwierzytelnienia' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Brak uprawnień do tego zasobu' });
    }
    next();
  };
}
