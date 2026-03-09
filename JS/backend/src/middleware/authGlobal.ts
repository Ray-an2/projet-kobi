import { Request, Response, NextFunction } from "express";
import db from "../../connection";
import { JwtUserPayload } from "./authUser";


interface AuthReq extends Request {
  user?: JwtUserPayload;
}

export const authorizeGlobalRoles = (...roles: string[]) => {
  return async (req: AuthReq, res: Response, next: NextFunction) => {
    const mail = req.user?.cpt_mail;

    if (!mail) {
        res.status(401).json({ error: "Utilisateur non authentifié" });
        return; 
    }

    try {
      const [profil]: any = await db
        .promise().query("SELECT pfl_role FROM t_profil_pfl JOIN t_compte_cpt USING (cpt_id) WHERE cpt_mail = ?", [mail]);

      if (!profil || !profil[0]) {
        res.status(403).json({ error: "Profil introuvable" });    
        return;
    }

      const userRole = profil[0].pfl_role;
      if (!roles.includes(userRole)) {
        res.status(403).json({ error: "Accès interdit pour ce rôle" });
        return;
      }

      next();
    } catch (err) {
        res.status(500).json({ error: "Erreur lors de la vérification du rôle", details: err });
        return;
    }
  };
};
