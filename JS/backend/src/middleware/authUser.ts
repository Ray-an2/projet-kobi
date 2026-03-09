import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload} from 'jsonwebtoken';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtUserPayload;
  }
}

export interface JwtUserPayload extends jwt.JwtPayload {
  cpt_mail: string;
  cpt_id: string;
  pfl_role: string;
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const Auth = req.headers.authorization;

  if (!Auth || !Auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide' });
  }

  const token = Auth.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if(!secret){
    throw new Error('mot secret est manquant !')
  }

  try {
    
    const decoded = jwt.verify(token, secret) as JwtUserPayload;
    req.user = decoded;
    next();
  }catch (error) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};