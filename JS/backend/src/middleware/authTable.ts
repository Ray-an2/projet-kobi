import { Request, Response, NextFunction } from "express";
import db from "../../connection";

export const authorizeTableRole = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const id = req.user?.cpt_id;
    const tabId = req.params.id || req.body.tab_id;
    if (!id || !tabId) {
        res.status(400).json({ error: "Informations manquantes du tableau" });
        return;
    }

    try {
      const [result]: any = await db
        .promise().query("SELECT rol_role FROM t_role_rol WHERE cpt_id = ? AND tab_id = ?",[id, tabId]);

      if (!result || !result[0]) {
        res.status(403).json({ error: "Aucun rôle pour ce tableau" });
        return;}

      const role = result[0].rol_role;
      if (!roles.includes(role)) {
        res.status(403).json({ error: "Accès interdit à ce tableau" });
        return;
      }

      next();
    } catch (err) {
        res.status(500).json({ error: "Erreur lors de la vérification du rôle tableau", details: err });
        return;
    }
  };
};
