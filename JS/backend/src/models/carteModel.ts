import db from "../../connection";
import { ResultSetHeader, RowDataPacket } from "mysql2";


// Base de la carte
const getBaseCarte = (car_id: string) => {
  return new Promise((resolve, reject) => {
    db.query(`SELECT * FROM t_carte_car JOIN t_liste_lis USING (lis_id) JOIN t_tableau_tab USING (tab_id) WHERE car_id = ?`, [car_id], (err, results) => {
      if (err) return reject(err);
      const rows = results as RowDataPacket[];
      resolve(rows[0]);
    });
  });
};

// Tags de la carte
export const getTagsCarte = (car_id: string) => {
  return new Promise((resolve, reject) => {
    db.query(`
      SELECT tag_id, tag_nom, tag_couleur
      FROM t_tag_tag
      JOIN t_associer_as USING (tag_id)
      WHERE car_id = ?`,
    [car_id], (err, results) =>
      err ? reject(err) : resolve(results)
    );
  });
};

// Membres de la carte
const getMemCarte = (car_id: string) => {
  return new Promise((resolve, reject) => {
    db.query(`
      SELECT cpt_id, cpt_mail, pfl_nom, pfl_prenom, pfl_img
      FROM t_membre_mem JOIN t_compte_cpt USING (cpt_id) 
      JOIN t_profil_pfl USING (cpt_id) 
      WHERE car_id = ?
    `, [car_id], (err, results) =>
      err ? reject(err) : resolve(results)
    );
  });
};

// Ressources de la carte
const getResCarte = (car_id: string) => {
  return new Promise((resolve, reject) => {
    db.query(`
      SELECT res_id, res_nom, res_lien
      FROM t_ressource_res
      WHERE car_id = ?`, 
    [car_id], (err, results) =>
      err ? reject(err) : resolve(results)
    );
  });
};

const getLogCarte = (car_id: string) => {
  return new Promise((resolve, reject) => {
    db.query(`SELECT log_id, log_auteur, log_description, log_date
      FROM t_login_log WHERE car_id = ? ORDER BY log_date DESC`, [car_id], (err, results) =>
        err ? reject(err) : resolve(results)
    );
  });
};

// Fonction principale pour récupérer une carte complète
export const getCarte = async (car_id: string) => {
  try {
    const base = await getBaseCarte(car_id);
    if (!base) throw new Error("Carte introuvable");

    const tags = await getTagsCarte(car_id);
    const membres = await getMemCarte(car_id);
    const ressources = await getResCarte(car_id);
    const activites = await getLogCarte(car_id);

    return {
      base,
      tags,
      membres,
      ressources,
      activites
    };
  } catch (err) {
    throw err;
  }
};

// Récupérer tous les membres d'une carte s'il y en a
export const getMembre = (car_id: string) => {
  return new Promise((resolve, reject) => {
    db.query(`SELECT * FROM t_carte_car LEFT JOIN t_membre_mem USING (car_id) 
      LEFT JOIN t_compte_cpt USING (cpt_id) LEFT JOIN t_profil_pfl USING (cpt_id) 
      WHERE car_id = ?`, [car_id], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Récupérer tous les tag
export const getTag = () => {
  return new Promise((resolve, reject) => {
    db.query(`SELECT * FROM t_tag_tag`, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Ajouter un tag
export const addTag = (tag_nom: string, tag_couleur: string, user: string) => {
  return new Promise((resolve, reject) => {
    const insertQuery = `INSERT INTO t_tag_tag (tag_nom, tag_couleur) VALUES (?, ?)`;
    db.query(insertQuery, [tag_nom, tag_couleur], (err1) => {
      if (err1) return reject(err1);

      // Logger
      const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat)
        VALUES (?, NOW(), ?, ?, 'P')`;
        const description = `${user} a ajouté le tag ${tag_nom} de la couleur "${tag_couleur}"`;

        db.query(logQuery, ['Ajouter tag', user, description], (err3) => {
          if (err3) return reject(err3);
          resolve({ message: "Tag ajouter" });
        });
      });
    });
  };

// Mettre à jour un tag
export const updateTag = (tag_id: string, new_nom: string, new_couleur: string, user: string) => {
  return new Promise((resolve, reject) => {
    // Liste les informations du tag avant modifcation
    const selectQuery = `SELECT tag_nom, tag_couleur FROM t_tag_tag WHERE tag_id = ?`;
    db.query(selectQuery, [tag_id], (err1, res1) => {
      if (err1) return reject(err1);

      const rows = res1 as RowDataPacket[];
      if (!rows || rows.length === 0) return reject("Tag introuvable");

      const { tag_nom: old_nom, tag_couleur: old_couleur } = rows[0];

      if (old_nom === new_nom && old_couleur === new_couleur) {
        return resolve("no_change");
      }
      // Mettre à jour le tag
      const updateQuery = `UPDATE t_tag_tag SET tag_nom = ?, tag_couleur = ? WHERE tag_id = ?`;
      db.query(updateQuery, [new_nom, new_couleur, tag_id], (err2) => {
        if (err2) return reject(err2);

        // Logger
        const description = `${user} a modifié le tag "${old_nom}" → nom: "${new_nom}", couleur: "${new_couleur}"`;
        const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat)
          VALUES (?, NOW(), ?, ?, 'P')`;

        db.query(logQuery, ['Modifier tag', user, description], (err3) => {
          if (err3) return reject(err3);
          resolve({ message: "Tag mis à jour avec succès." });
        });
      });
    });
  });
};

export const delTag = (tag_id: string, user: string) => {
  return new Promise((resolve, reject) => {
    const QueryInfo = `SELECT tag_nom, tag_couleur FROM t_tag_tag WHERE tag_id = ?`;

    db.query(QueryInfo, [tag_id], (err1, res1) => {
      if (err1) return reject(err1);

      const row = res1 as RowDataPacket[];
      if (!row || row.length === 0) return reject("Tag introuvable");

      const { tag_nom, tag_couleur } = row[0];

      // Supprimer les associations du tag avec les cartes
      const delAssoQuery = `DELETE FROM t_associer_as WHERE tag_id = ?`;

      db.query(delAssoQuery, [tag_id], (err2) => {
        if (err2) return reject(err2);

        // Supprimer le tag
        const delTagQuery = `DELETE FROM t_tag_tag WHERE tag_id = ?`;

        db.query(delTagQuery, [tag_id], (err3) => {
          if (err3) return reject(err3);

          // Logguer
          const logQuery = `
            INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat)
            VALUES (?, NOW(), ?, ?, 'P')
          `;
          const description = `${user} a supprimé le tag "${tag_nom}" de couleur "${tag_couleur}"`;

          db.query(logQuery, ['Supprimer tag', user, description], (err4) => {
            if (err4) return reject(err4);
            resolve({ message: "Tag supprimé avec succès." });
          });
        });
      });
    });
  });
};


// Ajouter un membre à une carte
export const addMembre = (cpt_id: string, car_id: string, user: string) => {
  return new Promise((resolve, reject) => {
    // Récupérer le mail
    const compteQuery = `SELECT cpt_mail FROM t_compte_cpt WHERE cpt_id = ?`;
    db.query(compteQuery, [cpt_id], (err1, res1) => {
      if (err1) return reject(err1);
      const compte = res1 as { cpt_mail: string }[];
      if (!compte || compte.length === 0) return reject(new Error("Compte introuvable"));
      const { cpt_mail } = compte[0];

      // Récupérer les informations
      const carteQuery = `
        SELECT car_nom, tab_id, tab_titre FROM t_carte_car
        JOIN t_liste_lis USING (lis_id) JOIN t_tableau_tab USING (tab_id)
        WHERE car_id = ?`;
      db.query(carteQuery, [car_id], (err2, res2) => {
        if (err2) return reject(err2);
        const cartes = res2 as { car_nom: string; tab_id: number; tab_titre: string }[];
        if (!cartes || cartes.length === 0) return reject(new Error("Carte introuvable"));
        const { car_nom, tab_id, tab_titre } = cartes[0];

        // Insertion dans t_membre_mem
        const membreQuery = `INSERT INTO t_membre_mem (cpt_id, car_id, mem_date) VALUES (?, ?, NOW())`;
        db.query(membreQuery, [cpt_id, car_id], (err3, res3) => {
          if (err3) return reject(err3);

          // Logger
          const logQuery = `INSERT INTO t_login_log 
            (log_type, log_date, log_auteur, log_description, log_etat, tab_id, car_id) 
            VALUES (?, NOW(), ?, ?, 'P', ?, ?)`;
          const description = `${user} a ajouté un membre (${cpt_mail}) à la carte "${car_nom}" du tableau "${tab_titre}"`;

          db.query(logQuery, ['Ajouter membre à la carte', user, description, tab_id, car_id], (err4) => {
            if (err4) return reject(err4);
            resolve({ message: "Membre ajouté à la carte" });
          });
        });
      });
    });
  });
};

// Retirer un membre d'une carte particulière
export const delMembre = (cpt_id: string, car_id: string, user: string) => {
  return new Promise((resolve, reject) => {
    // Récupérer le mail du membre
    const compteQuery = `SELECT cpt_mail FROM t_compte_cpt WHERE cpt_id = ?`;
    db.query(compteQuery, [cpt_id], (err1, res1) => {
      if (err1) return reject(err1);
      const compte = res1 as { cpt_mail: string }[];
      if (!compte || compte.length === 0) return reject(new Error("Compte introuvable"));
      const { cpt_mail } = compte[0];

      // Récupérer les informations de la carte
      const carteQuery = `
        SELECT car_nom, tab_id, tab_titre FROM t_carte_car
        JOIN t_liste_lis USING (lis_id) JOIN t_tableau_tab USING (tab_id)
        WHERE car_id = ?`;
      db.query(carteQuery, [car_id], (err2, res2) => {
        if (err2) return reject(err2);
        const cartes = res2 as { car_nom: string; tab_id: number; tab_titre: string }[];
        if (!cartes || cartes.length === 0) return reject(new Error("Carte introuvable"));
        const { car_nom, tab_id, tab_titre } = cartes[0];

        // Suppression dans t_membre_mem
        const deleteQuery = `DELETE FROM t_membre_mem WHERE cpt_id = ? AND car_id = ?`;
        db.query(deleteQuery, [cpt_id, car_id], (err3, res3) => {
          if (err3) return reject(err3);

          // Logger
          const logQuery = `INSERT INTO t_login_log 
            (log_type, log_date, log_auteur, log_description, log_etat, tab_id, car_id) 
            VALUES (?, NOW(), ?, ?, 'P', ?, ?)`;
          const description = `${user} a retiré le membre (${cpt_mail}) de la carte "${car_nom}" du tableau "${tab_titre}"`;

          db.query(logQuery, ['Retirer membre de la carte', user, description, tab_id, car_id], (err4) => {
            if (err4) return reject(err4);
            resolve({ message: "Membre retiré de la carte" });
          });
        });
      });
    });
  });
};

// Ajouter un tag à une carte
export const addTagCarte = (tag_id: string, car_id: string, user: string) => {
  return new Promise((resolve, reject) => {
    const insertQuery = `INSERT INTO t_associer_as (car_id, tag_id) VALUES (?, ?)`;
    db.query(insertQuery, [car_id, tag_id], (err1) => {
      if (err1) return reject(err1);

      // Pour le log
      const logQuery = `
        INSERT INTO t_login_log
        (log_type, log_date, log_auteur, log_description, log_etat, tab_id, car_id)
        VALUES (?, NOW(), ?, ?, 'P', ?, ?)
      `;
      const getCarteInfo = `
        SELECT car_nom, tab_id, tab_titre, tag_nom
        FROM t_carte_car
        JOIN t_associer_as USING (car_id)
        JOIN t_tag_tag USING (tag_id)
        JOIN t_liste_lis USING (lis_id)
        JOIN t_tableau_tab USING (tab_id)
        WHERE car_id = ? AND tag_id = ?
      `;
      db.query(getCarteInfo, [car_id, tag_id], (err2, res2) => {
        if (err2) return reject(err2);
        const rows = res2 as RowDataPacket[];
        if (!rows || rows.length === 0) return reject(new Error("Carte introuvable"));

        const { car_nom, tab_id, tab_titre, tag_nom } = rows[0];
        const description = `${user} a ajouté le tag (${tag_nom}) à la carte "${car_nom}" du tableau "${tab_titre}"`;

        db.query(logQuery, ['Ajouter tag à la carte', user, description, tab_id, car_id], (err3) => {
          if (err3) return reject(err3);
          resolve({ message: "Tag ajouté à la carte" });
        });
      });
    });
  });
};

// Retirer le tag d'une carte
export const delTagCarte = (tag_id: string, car_id: string, user: string) => {
  return new Promise((resolve, reject) => {
    // Récupérer les infos pour le log
    const getCarteInfo = `
      SELECT car_nom, tab_id, tab_titre, tag_nom
      FROM t_carte_car
      JOIN t_associer_as USING (car_id)
      JOIN t_tag_tag USING (tag_id)
      JOIN t_liste_lis USING (lis_id)
      JOIN t_tableau_tab USING (tab_id)
      WHERE car_id = ? AND tag_id = ?
    `;
    db.query(getCarteInfo, [car_id, tag_id], (err1, res1) => {
      if (err1) return reject(err1);

      const rows = res1 as RowDataPacket[];
      if (!rows || rows.length === 0) return reject(new Error("Carte ou tag introuvable"));

      const { car_nom, tab_id, tab_titre, tag_nom } = rows[0];
      const description = `${user} a retiré le tag (${tag_nom}) de la carte "${car_nom}" du tableau "${tab_titre}"`;

      // Suppression
      const deleteQuery = `DELETE FROM t_associer_as WHERE car_id = ? AND tag_id = ?`;
      db.query(deleteQuery, [car_id, tag_id], (err2) => {
        if (err2) return reject(err2);

        // Logger
        const logQuery = `
          INSERT INTO t_login_log
          (log_type, log_date, log_auteur, log_description, log_etat, tab_id, car_id)
          VALUES (?, NOW(), ?, ?, 'P', ?, ?)
        `;
        db.query(logQuery, ['Retirer tag de la carte', user, description, tab_id, car_id], (err3) => {
          if (err3) return reject(err3);
          resolve({ message: "Tag retiré de la carte" });
        });
      });
    });
  });
};



// Mettre à jour un champ spécifique d'une carte
export const updateCarte = (car_id: string, field: string, value: any, user: string) => {
  return new Promise((resolve, reject) => {
    const allowedFields = ["car_nom", "car_description", "car_date_debut", "car_date_fin", "car_couverture"];
    if (!allowedFields.includes(field)) {
      return reject(new Error("Champ non autorisé"));
    }

    // Récupérer les information de la carte
    const infoQuery = `SELECT car_nom, tab_id, tab_titre FROM t_carte_car 
                       JOIN t_liste_lis USING (lis_id) JOIN t_tableau_tab USING (tab_id)
                       WHERE car_id = ?`;

    db.query(infoQuery, [car_id], (err, results) => {
      if (err) return reject(err);
      const rows = results as { car_nom: string; tab_id: number; tab_titre: string }[];
      if (!rows.length) return reject(new Error("Carte non trouvée"));

      const { car_nom, tab_id, tab_titre } = rows[0];

      // Mise à jour de la carte
      const updateQuery = `UPDATE t_carte_car SET ${field} = ? WHERE car_id = ?`;
      db.query(updateQuery, [value, car_id], (err2, result2: ResultSetHeader) => {
        if (err2) return reject(err2);
        if (result2.affectedRows === 0) return reject(new Error("Aucune ligne modifiée"));

        // Description selon le champ
        let champLabel = "";
        switch (field) {
          case "car_nom":
            champLabel = "le nom";
            break;
          case "car_description":
            champLabel = "la description";
            break;
          case "car_date_debut":
            champLabel = "la date de début";
            break;
          case "car_date_fin":
            champLabel = "la date limite";
            break;
          case "car_couverture":
            champLabel = "l'image de couverture";
            break;
        }

        const description = `${user} a modifié ${champLabel} de la carte "${car_nom}" dans le tableau "${tab_titre}"`;

        // Logger
        const logQuery = `INSERT INTO t_login_log 
          (log_type, log_date, log_auteur, log_description, log_etat, tab_id, car_id)
          VALUES (?, NOW(), ?, ?, 'P', ?, ?)`;
        db.query(logQuery, ['Modifier carte', user, description, tab_id, car_id], (err3) => {
          if (err3) return reject(err3);
          resolve({ message: `${champLabel} mis à jour et log enregistré` });
        });
      });
    });
  });
};


// Déplace une carte
export const moveCarte = (lis_id: string, car_id: string, car_ordre: number, user: string) => {
  return new Promise((resolve, reject) => {
    // Récupérer les informations de la carte avant le déplacement
    const infoQuery = `
      SELECT c.car_nom, c.lis_id AS old_lis_id, l1.lis_titre AS old_lis_titre,
             l2.lis_titre AS new_lis_titre, t.tab_id, t.tab_titre
      FROM t_carte_car c
      JOIN t_liste_lis l1 ON l1.lis_id = c.lis_id
      JOIN t_liste_lis l2 ON l2.lis_id = ?
      JOIN t_tableau_tab t ON t.tab_id = l1.tab_id
      WHERE c.car_id = ?
    `;

    db.query(infoQuery, [lis_id, car_id], (err1, res1) => {
      if (err1) return reject(err1);

      const rows = res1 as {
        car_nom: string;
        old_lis_id: number;
        old_lis_titre: string;
        new_lis_titre: string;
        tab_id: number;
        tab_titre: string;
      }[];

      if (!rows || rows.length === 0) return reject(new Error("Carte ou listes non trouvées"));

      const {
        car_nom,
        old_lis_titre,
        new_lis_titre,
        tab_id,
        tab_titre,
      } = rows[0];

      // Mise à jour de la liste
      const updateQuery = `UPDATE t_carte_car SET lis_id = ?, car_ordre = ? WHERE car_id = ?`;
      db.query(updateQuery, [lis_id, car_ordre, car_id], (err2) => {
        if (err2) return reject(err2);

        // Logger
        const logQuery = `INSERT INTO t_login_log
          (log_type, log_date, log_auteur, log_description, log_etat, tab_id, car_id)
          VALUES (?, NOW(), ?, ?, 'P', ?, ?)`;

        const description = `${user} a déplacé la carte "${car_nom}" de la liste "${old_lis_titre}" vers "${new_lis_titre}" dans le tableau "${tab_titre}"`;

        db.query(logQuery, ['Déplacer carte', user, description, tab_id, car_id], (err3) => {
          if (err3) return reject(err3);
          resolve({ message: "Carte déplacée" });
        });
      });
    });
  });
};


// Supprimer une carte
export const deleteCarte = (car_id: string, user: string) => {
  return new Promise((resolve, reject) => {
    // Récupérer les informations de la carte
    const info = `SELECT car_nom, lis_titre, tab_id, tab_titre FROM t_carte_car
                  JOIN t_liste_lis USING (lis_id)
                  JOIN t_tableau_tab USING (tab_id)
                  WHERE car_id = ?`;

    db.query(info, [car_id], (err1, res1) => {
      if (err1) return reject(err1);

      const rows = res1 as {car_nom: string; lis_titre: string; tab_id: number; tab_titre: string;}[];

      if (!rows || rows.length === 0) return reject(new Error("Carte non trouvée"));

      const { car_nom, lis_titre, tab_id, tab_titre } = rows[0];

      // Supprimer les logs liés à cette carte
      const deleteLogs = `DELETE FROM t_login_log WHERE car_id = ?`;

      db.query(deleteLogs, [car_id], (err2) => {
        if (err2) return reject(err2);

        // Supprimer la carte
        db.query("DELETE FROM t_carte_car WHERE car_id = ?", [car_id], (err3) => {
          if (err3) return reject(err3);

          // logger
          const logQuery = `INSERT INTO t_login_log 
            (log_type, log_date, log_auteur, log_description, log_etat, tab_id)
            VALUES (?, NOW(), ?, ?, 'P', ?)`;

          const description = `${user} a supprimé la carte "${car_nom}" de la liste "${lis_titre}" dans le tableau "${tab_titre}"`;

          db.query(logQuery, ['Supprimer carte', user, description, tab_id], (err4) => {
            if (err4) return reject(err4);
            resolve({ message: "Carte supprimée avec succès" });
          });
        });
      });
    });
  });
};

// Archivage d'une carte
export const archiveCarte = (car_id: string, car_archiver: string, user: string) => {
  return new Promise((resolve, reject) => {
    // Récupérer les informations de la carte
    const info = `
      SELECT car_nom, lis_titre, tab_id, tab_titre
      FROM t_carte_car
      JOIN t_liste_lis USING (lis_id)
      JOIN t_tableau_tab USING (tab_id)
      WHERE car_id = ?`;

    db.query(info, [car_id], (err1, res1) => {
      if (err1) return reject(err1);

      const rows = res1 as { car_nom: string; lis_titre: string; tab_id: number; tab_titre: string }[];

      if (!rows || rows.length === 0) return reject(new Error("Carte non trouvée"));

      const { car_nom, lis_titre, tab_id, tab_titre } = rows[0];

      // Archivage (ou désarchivage de la carte)
      const updateQuery = "UPDATE t_carte_car SET car_archiver = ? WHERE car_id = ?";
      db.query(updateQuery, [car_archiver, car_id], (err2, result2) => {
        if (err2) return reject(err2);
        const result = result2 as ResultSetHeader;
        if (result.affectedRows === 0) return reject(new Error("Aucune carte modifiée"));

        // Logger
        const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id, car_id)
          VALUES (?, NOW(), ?, ?, 'P', ?, ?)`;

        const action = car_archiver === 'A' ? 'archivé' : 'désarchivé';
        const description = `${user} a ${action} la carte "${car_nom}" de la liste "${lis_titre}" dans le tableau "${tab_titre}"`;

        db.query(logQuery, ['Archivage carte', user, description, tab_id, car_id], (err3) => {
          if (err3) return reject(err3);
          resolve({ message: `Carte ${action}e avec succès` });
        });
      });
    });
  });
};

// Récupérer les cartes archivées dans un tableau
export const getArchiveCartes = (tab_id: string) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM t_carte_car JOIN t_liste_lis USING (lis_id)
      WHERE tab_id = ? AND car_archiver = 'A'`;
    db.query(query, [tab_id], (err, results) =>
      err ? reject(err) : resolve(results)
    );
  });
};

// Terminer une carte
export const terminerCarte = (car_id: string, car_terminer: string, user: string) => {
  return new Promise((resolve, reject) => {
    // Récupérer les informations de la carte
    const info = `
      SELECT car_nom, lis_titre, tab_id, tab_titre
      FROM t_carte_car
      JOIN t_liste_lis USING (lis_id)
      JOIN t_tableau_tab USING (tab_id)
      WHERE car_id = ?`;

    db.query(info, [car_id], (err1, res1) => {
      if (err1) return reject(err1);

      const rows = res1 as { car_nom: string; lis_titre: string; tab_id: number; tab_titre: string }[];

      if (!rows || rows.length === 0) return reject(new Error("Carte non trouvée"));

      const { car_nom, lis_titre, tab_id, tab_titre } = rows[0];

      // Mise à jour du statut de la carte
      const updateQuery = "UPDATE t_carte_car SET car_terminer = ? WHERE car_id = ?";
      db.query(updateQuery, [car_terminer, car_id], (err2, result2) => {
        if (err2) return reject(err2);

        const result = result2 as ResultSetHeader;
        if (result.affectedRows === 0) return reject(new Error("Aucune carte modifiée"));

        // Logger
        const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id, car_id)
          VALUES (?, NOW(), ?, ?, 'P', ?, ?)`;

        const action = car_terminer === 'O' ? "marqué comme terminé" : "marqué comme non terminé";
        const description = `${user} a ${action} la carte "${car_nom}" de la liste "${lis_titre}" dans le tableau "${tab_titre}"`;
        
        db.query(logQuery, ['Statut carte', user, description, tab_id, car_id], (err3) => {
          if (err3) return reject(err3);
          resolve({ message: `Carte ${action}` });
        });
      });
    });
  });
};

// Ajouter une carte
export const addCarte = (car_nom: string, car_description: string, car_date_debut: string | null,
  car_date_fin: string | null, car_couverture: string | null, lis_id: string, user: string) => {
  return new Promise((resolve, reject) => {
    // Récupérer l'ordre max
    const ordreQuery = "SELECT MAX(car_ordre) AS maxOrdre FROM t_carte_car WHERE lis_id = ?";
    db.query(ordreQuery, [lis_id], (err1, results1: RowDataPacket[]) => {
      if (err1) return reject(err1);

      const newOrdre = (results1[0]?.maxOrdre ?? 0) + 1;

      // Ajouter la carte
      const carteQuery = `INSERT INTO t_carte_car 
        (car_nom, car_description, car_archiver, car_terminer, car_ordre, car_date_creation, car_date_debut, car_date_fin, car_couverture, lis_id) 
        VALUES (?, ?, 'P', 'N', ?, NOW(), ?, ?, ?, ?)`;

      const values = [
        car_nom,
        car_description,
        newOrdre,
        car_date_debut || null,
        car_date_fin || null,
        car_couverture || null,
        lis_id
      ];

      db.query(carteQuery, values, (err2, result2: ResultSetHeader) => {
        if (err2) return reject(err2);
        const car_id = result2.insertId;

        // Récupérer les informations de la liste
        const infoQuery = `
          SELECT lis_titre, tab_id, tab_titre
          FROM t_liste_lis
          JOIN t_tableau_tab USING (tab_id)
          WHERE lis_id = ?`;

        db.query(infoQuery, [lis_id], (err3, res3: RowDataPacket[]) => {
          if (err3) return reject(err3);
          if (!res3 || res3.length === 0) return reject(new Error("Liste introuvable"));

          const { lis_titre, tab_id, tab_titre } = res3[0];

          const details: string[] = [];
          if (car_description) details.push(`comme description: "${car_description}"`);
          if (car_date_debut) details.push(`comme date début: ${car_date_debut}`);
          if (car_date_fin) details.push(`comme date fin: ${car_date_fin}`);
          if (car_couverture) details.push(`comme couverture: ${car_couverture}`);

          const desc = details.length ? ` avec ${details.join(', ')}` : '';
          const logDescription = `${user} a ajouté une carte "${car_nom}" dans la liste "${lis_titre}" du tableau "${tab_titre}"${desc}`;

          // Logger
          const logQuery = `
            INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id, car_id)
            VALUES (?, NOW(), ?, ?, 'P', ?, ?)`;

          db.query(logQuery, ['Ajouter carte', user, logDescription, tab_id, car_id], (err4) => {
            if (err4) return reject(err4);

            resolve({
              car_id,
              car_nom,
              car_description,
              car_date_debut,
              car_date_fin,
              car_couverture,
              message: "Carte ajoutée avec succès"
            });
          });
        });
      });
    });
  });
};

// Compter le nombre de carte dans une liste
export const nbCarteListe = (lis_id: string) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT COUNT(*) AS count FROM t_carte_car WHERE lis_id = ?", [lis_id], (err, result: any[]) => {
      if (err) return reject(err);
      if (!result || result.length === 0) return reject(new Error("Aucune donnée retournée"));
      resolve({ count: result[0].count });
    });
  });
};
