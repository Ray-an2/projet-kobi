import { Request, Response } from "express";
import db from "../../connection";
import * as crypto from "crypto";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response) => {
  const { mail, pwd } = req.body;

  try {
    const [rows]: any = await db
      .promise()
      .query("SELECT cpt_id, cpt_mail, cpt_mdp, pfl_role FROM t_compte_cpt JOIN t_profil_pfl USING (cpt_id) WHERE cpt_mail = ? AND pfl_etat = 'A'", [mail]);

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: "Utilisateur non trouvé" });
    }
    const user = rows[0];
    const hash = crypto.createHash("sha256").update(pwd + process.env.SEL).digest("hex");

    if (hash !== user.cpt_mdp) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      {cpt_id: user.cpt_id, cpt_mail: user.cpt_mail, pfl_role: user.pfl_role},
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    return res.json({ token });
  } catch (err) {
    console.error("Erreur dans login:", err);
    return res.status(500).json({ error: "Erreur serveur lors de la connexion" });
  }
};
