import db from "../../connection";
import { ResultSetHeader } from "mysql2";
import { archiveCarte, deleteCarte } from "./carteModel";


// Lister tous les listes non archiver au sein d'un tableau
export const getAllList = (tabId: string) => {
    return new Promise((resolve, reject) => {
      db.query("SELECT * FROM t_liste_lis WHERE lis_etat = 'P' AND tab_id = ?", [tabId], (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });
  };


// Ajouter une liste à un tableau
export const addList = (tab_id: string, lis_titre: string, lis_ordre: number, user: string) => {
  return new Promise((resolve, reject) => {
    // Ajouter la liste
    const sql = "INSERT INTO t_liste_lis (lis_titre, lis_etat, lis_ordre, tab_id) VALUES (?, 'P', ?, ?)";
    db.query(sql, [lis_titre, lis_ordre, tab_id], (err, result: ResultSetHeader) => {
      if (err) {
        console.error('Erreur SQL :', err);
        return reject(err);
      }

      if (!result || typeof result.insertId === 'undefined') {
        console.error('Résultat insert invalide :', result);
        return reject(new Error("Échec d'insertion ou insertId manquant"));
      }

      // Récupérer le nom du tableau
      const getTabNameQuery = "SELECT tab_titre FROM t_tableau_tab WHERE tab_id = ?";
      db.query(getTabNameQuery, [tab_id], (err4, result4) => {
        if (err4) return reject(err4);

        const row = result4 as { tab_titre: string }[];
        const tabNom = row[0]?.tab_titre ?? 'Inconnu';

        // Logger
        const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id) 
                          VALUES (?, NOW(), ?, ?, 'P', ?);`;

        db.query(logQuery, ['Ajouter liste', user, `${user} a ajouté la liste "${lis_titre}" au tableau "${tabNom}"`, tab_id], (err2, result2) => {
          if (err2) return reject(err2);
          resolve({ id: result.insertId, lis_titre, lis_ordre });
        });
      });
    });
  });
};


// Mettre à jour le titre d’une liste
export const updateList = (id: string, lis_titre: string, user: string) => {
  return new Promise((resolve, reject) => {
    const getCurrentQuery = "SELECT lis_titre, tab_id FROM t_liste_lis WHERE lis_id = ?";
    db.query(getCurrentQuery, [id], (err1, result1) => {
      if (err1) return reject(err1);

      const row = result1 as { lis_titre: string; tab_id: string }[];
      const current = row[0];

      if (!current) {
        return reject(new Error("Liste introuvable"));
      }

      // Vérifie les changements
      const changes: string[] = [];
      if (current.lis_titre !== lis_titre) {
        changes.push(`Titre: '${current.lis_titre}' → '${lis_titre}'`);
      }

      // Si aucune modification
      if (changes.length === 0) {
        return resolve({ message: "Aucune modification détectée." });
      }

      // Mise à jour du titre
      const updateQuery = "UPDATE t_liste_lis SET lis_titre = ? WHERE lis_id = ?";
      db.query(updateQuery, [lis_titre, id], (err2, result2) => {
        if (err2) return reject(err2);

        // Logger
        const logDescription = `${user} a modifié la liste ${id} :\n- ${changes.join("\n- ")}`;
        const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id)
                          VALUES (?, NOW(), ?, ?, 'P', ?);`;
        db.query(logQuery, ['Modifier liste', user, logDescription, current.tab_id], (err3, result3) => {
          if (err3) return reject(err3);
          resolve({ message: "Liste mise à jour avec succès." });
        });
      });
    });
  });
};


// Réorganise les listes dans un tableau
export const updateListOrder = (lis_id: string, lis_ordre: number, tab_id: string): 
Promise<{ lis_id: string; lis_titre: string; old_order: number; new_order: number; tab_titre: string }> => {
  return new Promise((resolve, reject) => {
    const getQuery = `
      SELECT lis_ordre, lis_titre, tab_titre FROM t_liste_lis
      JOIN t_tableau_tab USING (tab_id)
      WHERE lis_id = ? AND tab_id = ?
    `;
    db.query(getQuery, [lis_id, tab_id], (err1, res1) => {
      if (err1) return reject(err1);

      const rows = res1 as { lis_ordre: number; lis_titre: string; tab_titre: string }[];
      if (!rows.length) return reject(new Error("Liste non trouvée"));

      const { lis_ordre: old_order, lis_titre, tab_titre } = rows[0];

      const updateQuery = `UPDATE t_liste_lis SET lis_ordre = ? WHERE lis_id = ? AND tab_id = ?`;
      db.query(updateQuery, [lis_ordre, lis_id, tab_id], (err2) => {
        if (err2) return reject(err2);
        resolve({ lis_id, lis_titre, old_order, new_order: lis_ordre, tab_titre });
      });
    });
  });
};


// Réorganise les cartes dans une liste
export const updateCarteOrder = (lis_id: string, car_ordre: string[]) => {
  return new Promise((resolve, reject) => {
    db.beginTransaction(err => {
      if (err) return reject(err);

      const queries = car_ordre.map((car_id, index) => {
        return new Promise<void>((res, rej) => {
          const sql = "UPDATE t_carte_car SET car_ordre = ?, lis_id = ? WHERE car_id = ?";
          db.query(sql, [index, lis_id, car_id], (err) => {
            if (err) return rej(err);
            res();
          });
        });
      });

      Promise.all(queries)
        .then(() => {
          db.commit(commitErr => {
            if (commitErr) return reject(commitErr);
            resolve({ message: "Ordre et liste mis à jour" });
          });
        })
        .catch(updateErr => {
          db.rollback(() => {
            reject(updateErr);
          });
        });
    });
  });
};

// Supprimer une liste
export const delList = (id: string, user: string) => {
  return new Promise((resolve, reject) => {
    // Récupérer le nom et son id du tableau avant suppression de la liste
    const getTabInfoQuery = `
      SELECT tab_id, tab_titre FROM t_tableau_tab
      JOIN t_liste_lis USING (tab_id)
      WHERE lis_id = ?`;
    db.query(getTabInfoQuery, [id], (err1, result1) => {
      if (err1) return reject(err1);

      const rows = result1 as { tab_id: number; tab_titre: string }[];

      if (!rows || rows.length === 0) {
        return reject(new Error("Liste ou tableau non trouvé"));
      }

      const row = rows[0];
      const tabId = row.tab_id;
      const tabNom = row.tab_titre ?? 'Inconnu';

      // Récupérer les cartes associées à la liste
      const getCardsQuery = `SELECT car_id FROM t_carte_car WHERE lis_id = ?`;
      db.query(getCardsQuery, [id], async (err2, cardsResult) => {
        if (err2) return reject(err2);

        const cards = cardsResult as { car_id: string }[];

        try {
          // Supprimer toutes les cartes associées
          for (const card of cards) {
            // On attend la suppression de chaque carte
            await deleteCarte(card.car_id, user);
          }

          // Supprimer la liste
          const delListQuery = "DELETE FROM t_liste_lis WHERE lis_id = ?";
          db.query(delListQuery, [id], (err3, result3) => {
            if (err3) return reject(err3);

            // Logger
            const logQuery = `
              INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id) 
              VALUES (?, NOW(), ?, ?, 'P', ?)`;
            
            const description = `${user} a supprimé la liste associée au tableau ${tabNom}`;

            db.query(logQuery, ['Supprimer liste', user, description, tabId], (err4, result4) => {
              if (err4) return reject(err4);
              resolve({ message: "Liste supprimées avec succès", result: result3 });
            });
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  });
};

// Archiver une liste
export const archiveList = (id: string, user: string) => {
  return new Promise((resolve, reject) => {
    const listeQuery = `SELECT lis_titre, tab_titre, tab_id FROM t_liste_lis
                        JOIN t_tableau_tab USING (tab_id) WHERE lis_id = ?`;
    db.query(listeQuery, [id], (err, results) => {
      if (err) return reject(err);
      const rows = results as { lis_titre: string; tab_titre: string; tab_id: number }[];
      if (!rows.length) return reject(new Error("Liste non trouvée"));

      const { lis_titre, tab_titre, tab_id } = rows[0];

      // Archivage de la liste
      db.query("UPDATE t_liste_lis SET lis_etat = 'A' WHERE lis_id = ?", [id], (err2, result) => {
        if (err2) return reject(err2);
        try {
          // Récupérer les cartes liées à la liste
          const cartesQuery = `SELECT car_id FROM t_carte_car WHERE lis_id = ? AND car_archiver != 'A'`;
          db.query(cartesQuery, [id], async (err4, result4) => {
            if (err4) return reject(err4);

            const cartes = result4 as { car_id: string }[];

            // Appele le modèle archiveCarte pour chaque carte
            for (const carte of cartes) {
              await archiveCarte(carte.car_id, 'A', user);
            }
        
            // Logger
            const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id)
                              VALUES (?, NOW(), ?, ?, 'P', ?)`;
            const description = `${user} a archivé la liste "${lis_titre}" du tableau "${tab_titre}"`;

            db.query(logQuery, ['Archivage liste', user, description, tab_id], (err3) => {
              if (err3) return reject(err3);
              resolve({ message: `Liste "${lis_titre}" et cartes associées archivées.` });
            });
          });
        } catch (e) {
          return reject(e);
        }
      });
    });
  });
};

// Récupérer les listes archivées d’un tableau
export const getArchivedLists = (tab_id: string) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM t_liste_lis WHERE tab_id = ? AND lis_etat = 'A'", [tab_id], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Desarchiver une liste
export const desarchiveList = (id: string, user: string) => {
  return new Promise((resolve, reject) => {
    const listeQuery = `SELECT lis_titre, tab_titre, tab_id FROM t_liste_lis
                        JOIN t_tableau_tab USING (tab_id) WHERE lis_id = ?`;
    db.query(listeQuery, [id], (err, results) => {
      if (err) return reject(err);
      const rows = results as { lis_titre: string; tab_titre: string; tab_id: number }[];
      if (!rows.length) return reject(new Error("Liste non trouvée"));

      const { lis_titre, tab_titre, tab_id } = rows[0];

      // Archivage de la liste
      db.query("UPDATE t_liste_lis SET lis_etat = 'P' WHERE lis_id = ?", [id], (err2, result) => {
        if (err2) return reject(err2);
        try {
          // Récupérer les cartes liées à la liste
          const cartesQuery = `SELECT car_id FROM t_carte_car WHERE lis_id = ? AND car_archiver != 'P'`;
          db.query(cartesQuery, [id], async (err4, result4) => {
            if (err4) return reject(err4);

            const cartes = result4 as { car_id: string }[];

            // Appele le modèle archiveCarte pour chaque carte
            for (const carte of cartes) {
              await archiveCarte(carte.car_id, 'P', user);
            }
        
            // Logger
            const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id)
                              VALUES (?, NOW(), ?, ?, 'P', ?)`;
            const description = `${user} a desarchivé la liste "${lis_titre}" du tableau "${tab_titre}"`;

            db.query(logQuery, ['Desarchivage liste', user, description, tab_id], (err3) => {
              if (err3) return reject(err3);
              resolve({ message: `Liste "${lis_titre}" et cartes associées desarchivées.` });
            });
          });
        } catch (e) {
          return reject(e);
        }
      });
    });
  });
};

// Déplacer une liste
export const moveList = (id: string, new_order: number) => {
  return new Promise((resolve, reject) => {
    db.query("UPDATE t_liste_lis SET lis_ordre = ? WHERE lis_id = ?", [new_order, id], (err, result) => {
      if (err) reject(err);
      resolve({ message: "Liste déplacée avec succès" });
    });
  });
};
