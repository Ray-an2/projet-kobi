import db from "../../connection";
import { ResultSetHeader, RowDataPacket } from "mysql2";

// Récupére tous les tableaux actif
export const getAllTab = (id: string) => {
    return new Promise((resolve, reject) => {
      db.query("SELECT * FROM t_tableau_tab JOIN t_role_rol USING (tab_id) WHERE tab_etat = 'A' AND cpt_id = ?", [id], (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });
  };

// Récupère tous les tableaux
export const getAllTabAdmin = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM t_tableau_tab", (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Liste tous les tableaux et les ranges par ordre du plus récent au plus vieux
export const getAllTabRecAdmin = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM t_tableau_tab ORDER BY tab_id DESC", (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Liste tous les tableaux et les ranges par ordre alphabétique
export const getAllTabAlpAdmin = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM t_tableau_tab ORDER BY tab_titre", (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Liste tous les tableaux actif et les ranges par ordre du plus récent au plus vieux
export const getAllTabRec = (id: string) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM t_tableau_tab JOIN t_role_rol USING (tab_id) WHERE tab_etat = 'A' AND cpt_id = ? ORDER BY tab_id DESC", [id], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Liste tous les tableaux actif et les ranges par ordre alphabétique
export const getAllTabAlp = (id: string) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM t_tableau_tab JOIN t_role_rol USING (tab_id) WHERE tab_etat = 'A' AND cpt_id = ? ORDER BY tab_titre", [id], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Liste tous les tableaux actif contenant le mot "value"
export const searchTabAdmin = (search: string) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM t_tableau_tab WHERE tab_titre LIKE ?";
    const value = `%${search}%`;

    db.query(sql, [value], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Liste tous les tableaux actif contenant le mot "value"
export const searchTab = (search: string, id: number) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM t_tableau_tab JOIN t_role_rol USING (tab_id) WHERE tab_etat = 'A' AND cpt_id = ? AND tab_titre LIKE ?";
    const value = `%${search}%`;
    db.query(sql, [id, value], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Liste tous les logs actif contenant le mot "value"
export const searchLogAdmin = (search: string) => {
  return new Promise((resolve, reject) => {
    let date = `%${search}%`;

    // Si JJ/MM/AAAA
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(search)) {
      const [dd, mm, yyyy] = search.split("/");
      date = `%${yyyy}-${mm}-${dd}%`;

    // Si JJ/MM
    } else if (/^\d{2}\/\d{2}$/.test(search)) {
      const [dd, mm] = search.split("/");
      date = `%-${mm}-${dd}%`;

    // Si MM/AAAA
    } else if (/^\d{2}\/\d{4}$/.test(search)) {
      const [mm, yyyy] = search.split("/");
      date = `%${yyyy}-${mm}-%`;
    }

    const value = `%${search}%`;
    const sql = `SELECT * FROM t_login_log 
    WHERE log_type LIKE ? OR log_description LIKE ? OR log_date LIKE ? ORDER BY log_date DESC`;
    
    db.query(sql, [value, value, date], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Liste tous les logs actif d'un tableau particulier contenant le mot "value"
export const searchLog = (search: string, id: string) => {
  return new Promise((resolve, reject) => {
    let date = `%${search}%`;

    // Si JJ/MM/AAAA
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(search)) {
      const [dd, mm, yyyy] = search.split("/");
      date = `%${yyyy}-${mm}-${dd}%`;

    // Si JJ/MM
    } else if (/^\d{2}\/\d{2}$/.test(search)) {
      const [dd, mm] = search.split("/");
      date = `%-${mm}-${dd}%`;

    // Si MM/AAAA
    } else if (/^\d{2}\/\d{4}$/.test(search)) {
      const [mm, yyyy] = search.split("/");
      date = `%${yyyy}-${mm}-%`;
    }

    const value = `%${search}%`;
    const sql = `SELECT * FROM t_login_log JOIN t_tableau_tab USING (tab_id) 
    WHERE log_etat = 'A' AND tab_id = ? OR log_type LIKE ? OR log_description LIKE ? OR log_date LIKE ?
    ORDER BY log_date DESC`;
    
    db.query(sql, [id, value, value, date], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

export const getCompte = (tab_id: string) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT DISTINCT cpt_id, pfl_prenom, pfl_nom, pfl_img FROM t_compte_cpt
      JOIN t_profil_pfl pfl USING (cpt_id) LEFT JOIN t_role_rol USING (cpt_id) WHERE pfl_etat = 'A'`;
    db.query(query, [tab_id], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

export const AddRole = (tab_id: string, cpt_id: string, role: 'M' | 'A', user: string) => {
  return new Promise((resolve, reject) => {
    const insertRole = `INSERT INTO t_role_rol (tab_id, cpt_id, rol_role) VALUES (?, ?, ?)`;

    db.query(insertRole, [tab_id, cpt_id, role], (err1) => {
      if (err1) return reject(err1);

      const getInfo = `SELECT tab_titre, cpt_mail FROM t_tableau_tab JOIN t_role_rol USING (tab_id)
        JOIN t_compte_cpt USING (cpt_id) WHERE cpt_id = ? AND tab_id = ?`;

      db.query(getInfo, [cpt_id, tab_id], (err2, res2) => {
        if (err2) return reject(err2);
        const rows = res2 as RowDataPacket[];
        if (!rows || rows.length === 0) return reject(new Error("Membre introuvable"));
        const { tab_titre, cpt_mail } = rows[0];
        const description = `${user} a ajouté ${cpt_mail} (${role}) au tableau "${tab_titre}"`;
        const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id)
          VALUES ('Ajouter membre tableau', NOW(), ?, ?, 'P', ?)`;
        db.query(logQuery, [user, description, tab_id], (err3) => {
          if (err3) return reject(err3);
          resolve({ message: "Membre ajouté avec succès." });
        });
      });
    });
  });
};


export const DelRole = (tab_id: string, cpt_id: string, user: string, userId: string) => {
  return new Promise((resolve, reject) => {
    console.log("Check retrait de soi-même :", { userId, cpt_id });
    if (userId.trim() === cpt_id.trim()) return reject("Vous ne pouvez pas vous retirer vous-même.");
    // Obtenir le rôle de l'utilisateur appelant
    const getUserRole = `SELECT rol_role FROM t_role_rol JOIN t_compte_cpt USING (cpt_id) WHERE tab_id = ? AND cpt_mail = ?`;

    db.query(getUserRole, [tab_id, user], (err1, res1) => {
      const rows1 = res1 as RowDataPacket[];
      if (err1 || rows1.length === 0) return reject('Utilisateur non membre du tableau.');

      const currentUserRole = rows1[0].rol_role as 'M' | 'A' | 'C';
      const hierarchy = { 'M': 1, 'A': 2, 'C': 3 };

      const getTargetRole = `SELECT rol_role FROM t_role_rol WHERE tab_id = ? AND cpt_id = ?`;

      db.query(getTargetRole, [tab_id, cpt_id], (err2, res2) => {
        const rows2 = res2 as RowDataPacket[];
        if (err2 || rows2.length === 0) return reject('Compte cible non membre.');

        const targetRole = rows2[0].rol_role  as 'M' | 'A';

        if (hierarchy[currentUserRole] < hierarchy[targetRole]) {
          return reject('Permission refusée : vous ne pouvez pas retirer un membre de rôle supérieur.');
        }

        // Suppression + log
        const getInfos = `SELECT tab_titre, cpt_mail FROM t_tableau_tab 
        JOIN t_role_rol USING (tab_id) JOIN t_compte_cpt USING (cpt_id) 
        WHERE cpt_id = ?  AND tab_id = ? `;

        db.query(getInfos, [cpt_id, tab_id], (err3, res3) => {
          if (err3) return reject(err3);
          const rows3 = res3 as RowDataPacket[];
          if (!rows3 || rows3.length === 0) return reject(new Error("Informations introuvable"));
          const { tab_titre, cpt_mail } = rows3[0];
          const description = `${user} a retiré ${cpt_mail} (${targetRole}) du tableau "${tab_titre}"`;
          const deleteQuery = `DELETE FROM t_role_rol WHERE tab_id = ? AND cpt_id = ?`;

          db.query(deleteQuery, [tab_id, cpt_id], (err4) => {
            if (err4) return reject(err4);

            const logQuery = `
              INSERT INTO t_login_log
              (log_type, log_date, log_auteur, log_description, log_etat, tab_id)
              VALUES ('Retrait membre tableau', NOW(), ?, ?, 'P', ?)
            `;

            db.query(logQuery, [user, description, tab_id], (err5) => {
              if (err5) return reject(err5);
              resolve({ message: "Membre retiré avec succès." });
            });
          });
        });
      });
    });
  });
};


// Récupére un tableau en particulier
export const getTab = (tabId: string, cpt_id: string) => {
    return new Promise((resolve, reject) => {
      db.query(`SELECT * FROM t_tableau_tab
        LEFT JOIN t_role_rol USING (tab_id) 
        LEFT JOIN t_liste_lis USING (tab_id)
        LEFT JOIN t_carte_car USING (lis_id)
        WHERE tab_id = ? AND cpt_id = ?`,[tabId, cpt_id], 
        (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });
  };

// Liste tous les tag associés au carte d'un tableau particulier
export const getTagsByTab = (tab_id: string) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT tag_id, tag_nom, tag_couleur, car_id
      FROM t_tag_tag
      JOIN t_associer_as USING (tag_id)
      JOIN t_carte_car USING (car_id)
      JOIN t_liste_lis USING (lis_id)
      WHERE tab_id = ?`;
    db.query(query, [tab_id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Liste tous les ressources associés au carte d'un tableau particulier
export const getResByTab = (tab_id: string) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT res_id, res_nom, res_lien, car_id
      FROM t_ressource_res
      JOIN t_carte_car USING (car_id)
      JOIN t_liste_lis USING (lis_id)
      WHERE tab_id = ?`;
    db.query(query, [tab_id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Liste tous les membres associés au carte d'un tableau particulier
export const getMemByTab = (tab_id: string) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT cpt_id, pfl_nom, pfl_prenom, pfl_img, car_id
      FROM t_membre_mem
      LEFT JOIN t_carte_car USING (car_id)
      LEFT JOIN t_liste_lis USING (lis_id)
      JOIN t_compte_cpt USING (cpt_id)
      JOIN t_profil_pfl USING (cpt_id)
      WHERE tab_id = ?`;
    db.query(query, [tab_id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Vérifie la date limite
export const checkDateLimite = (id: string, carId: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT CASE WHEN car_date_fin < NOW() THEN 1 ELSE 0 END AS late
      FROM t_carte_car
      JOIN t_liste_lis USING (lis_id)
      WHERE tab_id = ? AND car_id = ?`;
    
    db.query(query, [id, carId], (err, results) => {
      if (err) return reject(err);
      const row = results as RowDataPacket[];
      if (row.length === 0) return resolve(0);
      resolve(row[0].late);
    });
  });
};

// Récupérer le role
export const getRole = (id: string, cpt_id: string) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT rol_role FROM t_role_rol 
      WHERE cpt_id = ? AND tab_id = ?`;

    db.query(query, [cpt_id, id], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Ferme un tableau (avec confirmation)
export const closeTab = (id: string, user: string) => {
  return new Promise((resolve, reject) => {
    // Fermer le tableau
    const TableauQuery = "UPDATE t_tableau_tab SET tab_etat = 'D' WHERE tab_id = ?";
    db.query(TableauQuery, [id], (err, result: ResultSetHeader) => {
      if (err) reject(err);
      if (result.affectedRows === 0) {
        reject(new Error("Tableau non trouvé"));
      }
      
      // Archive toutes les listes associées à ce tableau
      const ListesQuery = "UPDATE t_liste_lis SET lis_etat = 'A' WHERE tab_id = ?";
      db.query(ListesQuery, [id], (err2, result2) => {
        if (err2) reject(err2);
        
        // Archive toutes les cartes associées aux listes
        const CartesQuery = "UPDATE t_carte_car SET car_archiver = 'A' WHERE lis_id IN (SELECT lis_id FROM t_liste_lis WHERE tab_id = ?)";
        db.query(CartesQuery, [id], (err3, result3) => {
          if (err3) reject(err3);
          // Récupérer le nom du tableau
          const getTabNameQuery = "SELECT tab_titre FROM t_tableau_tab WHERE tab_id = ?";
          db.query(getTabNameQuery, [id], (err4, result4) => {
            if (err4) return reject(err4);
            const row = result4 as { tab_titre: string }[];
            const tabNom = row[0]?.tab_titre ?? 'Inconnu';
            // Logger l'action
            const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id) 
            VALUES (?, NOW(), ?, ?, 'P', ?);`
            db.query(logQuery, ['Tableau fermé', user, `${user} a fermé le tableau ${tabNom}`, id], (err5, result5) => {
              if (err5) return reject(err5);
              resolve({ message: "Tableau fermé avec succès" });
            });
          });
        });
      });
    });
  });
};

// Ouvre un tableau (avec confirmation)
export const openTab = (id: string, user: string) => {
  return new Promise((resolve, reject) => {
    // Ouvrir le tableau
    const TableauQuery = "UPDATE t_tableau_tab SET tab_etat = 'A' WHERE tab_id = ?";
    db.query(TableauQuery, [id], (err, result: ResultSetHeader) => {
      if (err) reject(err);
      if (result.affectedRows === 0) {
        reject(new Error("Tableau non trouvé"));
      }

      // Restaure toutes les listes associées à ce tableau
      const ListesQuery = "UPDATE t_liste_lis SET lis_etat = 'P' WHERE tab_id = ?";
      db.query(ListesQuery, [id], (err2, result2) => {
        if (err2) reject(err2);

        // Restaure toutes les cartes associées aux listes
        const CartesQuery = "UPDATE t_carte_car SET car_archiver = 'P' WHERE lis_id IN (SELECT lis_id FROM t_liste_lis WHERE tab_id = ?)";
        db.query(CartesQuery, [id], (err3, result3) => {
          if (err3) reject(err3);
          // Récupérer le nom du tableau
          const getTabNameQuery = "SELECT tab_titre FROM t_tableau_tab WHERE tab_id = ?";
          db.query(getTabNameQuery, [id], (err4, result4) => {
            if (err4) return reject(err4);
            const row = result4 as { tab_titre: string }[];
            const tabNom = row[0]?.tab_titre ?? 'Inconnu';
            // Logger l'action
            const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id) 
            VALUES (?, NOW(), ?, ?, 'P', ?);`
            db.query(logQuery, ['Tableau ouvert', user, `${user} a ouvert le tableau ${tabNom}`, id], (err5, result5) => {
              if (err5) return reject(err5);
              resolve({ message: "Tableau ouvert avec succès" });
            });
          });
        });
      });
    });
  });
};

// Mettre à jour un tableau existant
export const updateTab = (id: string, tab_titre: string, tab_des: string, tab_couv: string, user: string) => {
  return new Promise((resolve, reject) => {
    const CurrentQuery = "SELECT tab_titre, tab_des, tab_couv FROM t_tableau_tab WHERE tab_id = ?";
    db.query(CurrentQuery, [id], (err1, result1) => {
      if (err1) return reject(err1);
      const row = result1 as { tab_titre: string; tab_des: string; tab_couv: string }[];
      const current = row[0];

      // Construire le log des changements
      const changes: string[] = [];
      if (current.tab_titre !== tab_titre) changes.push(`Titre: '${current.tab_titre}' → '${tab_titre}'`);
      if (current.tab_des !== tab_des) changes.push(`Description: '${current.tab_des}' → '${tab_des}'`);
      if (current.tab_couv !== tab_couv) changes.push(`Couverture: '${current.tab_couv}' → '${tab_couv}'`);

      // Si aucune modification
      if (changes.length === 0) {
        return resolve({ message: "Aucune modification détectée." });
      }

      // Mettre à jour le tableau
      const updateQuery = "UPDATE t_tableau_tab SET tab_titre = ?, tab_des = ?, tab_couv = ? WHERE tab_id = ?";
      db.query(updateQuery, [tab_titre, tab_des, tab_couv, id], (err2, result2) => {
        if (err2) return reject(err2);

        // Logger les modifications
        const descriptionLog = `${user} a modifié le tableau :\n- ${changes.join("\n- ")}`;
        const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id) 
                          VALUES (?, NOW(), ?, ?, 'P', ?);`;
        db.query(logQuery, ['Modifier tableau', user, descriptionLog, id], (err3, result3) => {
          if (err3) return reject(err3);
          resolve({ message: "Tableau modifié avec succès." });
        });
      });
    });
  });
};

// Récupérer les membres d'un tableau avec leur rôle
export const getTabMemRole = (id: string) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT cpt_id, cpt_mail, pfl_nom, pfl_prenom, pfl_img, rol_role 
      FROM t_role_rol 
      JOIN t_compte_cpt USING (cpt_id)
      JOIN t_profil_pfl USING (cpt_id)
      WHERE pfl_etat = 'A' AND tab_id = ?`;

    db.query(query, [id], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Récupére les informations d'un tableau en particulier (Créateur + Description)
export const getTabInfo = (tabId: string) => {
    return new Promise((resolve, reject) => {
      db.query(`SELECT * FROM t_tableau_tab
        JOIN t_role_rol USING (tab_id)
        JOIN t_compte_cpt USING (cpt_id)
        JOIN t_profil_pfl USING (cpt_id) 
        WHERE tab_id = ? AND rol_role = 'C'`,[tabId],
        (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });
  };

// Récupére tout les log de tout les tableau
export const getAllTabLog = () => {
    return new Promise((resolve, reject) => {
      db.query(`SELECT * FROM t_login_log WHERE log_etat='P' ORDER BY log_date DESC`,
        (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });
  };

// Récupére les logs d'un tableau en particulier
export const getTabLog = (tabId: string) => {
    return new Promise((resolve, reject) => {
      db.query(`SELECT * FROM t_tableau_tab
        JOIN t_login_log USING(tab_id)
        WHERE tab_id = ? AND log_etat = 'P' ORDER BY log_date DESC`,[tabId],
        (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });
  };

  // Ajout d'un nouveau tableau
export const addTab = (tab_titre: string, tab_des: string | null, tab_couv: string | null, userId: string, user: string) => {
  return new Promise((resolve, reject) => {
    db.query<ResultSetHeader>(
      "INSERT INTO t_tableau_tab (tab_titre, tab_des, tab_etat, tab_couv) VALUES (?, ?, 'A', ?)",
      [tab_titre, tab_des || null, tab_couv || null],
      (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        const tabId = results.insertId;

        db.query<RowDataPacket[]>(
          "SELECT cpt_id FROM t_profil_pfl WHERE pfl_role IN ('A', 'G')",
          (err, comptes) => {
            if (err) {
              reject(err);
              return;
            }
            const membresValues = comptes.filter((c) => c.cpt_id !== userId).map((c) => [c.cpt_id, tabId, "A"]);

            if (!membresValues.some(([cptId]) => cptId === userId)) {
              membresValues.push([userId, tabId, "C"]);
            }
            db.query(
              "INSERT INTO t_role_rol (cpt_id, tab_id, rol_role) VALUES ?",
              [membresValues],
              (err) => {
                if (err) {
                  reject(err);
                  return;
                }
                // Logger
                const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id) 
                VALUES (?, NOW(), ?, ?, 'P', ?);`
                db.query(logQuery, ['Ajouter tableau', user, `${user} a ajouté le tableau ${tab_titre}`, tabId], (err2, result2) => {
                if (err2) return reject(err2);
                resolve({
                  tab_id: tabId,
                  tableau_nom: tab_titre,
                  tab_description: tab_des,
                  tab_couverture: tab_couv,
                  admin_user_id: userId,
                });
              });
            });
          }
        );
      }
    );
  });
};

  
// Suppression tous les tags associés à des cartes associer à un tableau en particulier
const delTagTab = (tab_id: number, user: string) => {
  return new Promise((resolve, reject) => {
    db.query(`
      DELETE FROM t_associer_as 
      WHERE car_id IN (
        SELECT car_id FROM t_carte_car
        WHERE lis_id IN (
          SELECT lis_id FROM t_liste_lis WHERE tab_id = ?))
    `, [tab_id], (err, results) => {
      if (err) return reject(err);
      // Récupérer le nom du tableau
      const getTabNameQuery = "SELECT tab_titre FROM t_tableau_tab WHERE tab_id = ?";
      db.query(getTabNameQuery, [tab_id], (err2, result2) => {
        if (err2) return reject(err2);
        const row = result2 as { tab_titre: string }[];
        const tabNom = row[0]?.tab_titre ?? 'Inconnu';
        // Logger l'action
        const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id) 
            VALUES (?, NOW(), ?, ?, 'P', ?);`
            db.query(logQuery, ["Supprimer tag d'un tableau", user, `${user} a supprimer les tags associés aux cartes du tableau ${tabNom}`, tab_id], (err3, result3) => {
              if (err3) return reject(err3);
              resolve({ message: "Tags supprimés avec succès", results });
        });
      });
    });
  });
};

// Suppression des ressources d'un tableau particulier
const delResTab = (tab_id: number, user: string) => {
  return new Promise((resolve, reject) => {
    db.query(`
      DELETE FROM t_ressource_res 
      WHERE car_id IN (
        SELECT car_id FROM t_carte_car
        WHERE lis_id IN (
          SELECT lis_id FROM t_liste_lis WHERE tab_id = ?
        )
      )
    `, [tab_id], (err, results) => {
      if (err) return reject(err);
      // Récupérer le nom du tableau
      const getTabNameQuery = "SELECT tab_titre FROM t_tableau_tab WHERE tab_id = ?";
      db.query(getTabNameQuery, [tab_id], (err2, result2) => {
        if (err2) return reject(err2);
        const row = result2 as { tab_titre: string }[];
        const tabNom = row[0]?.tab_titre ?? 'Inconnu';
        // Logger l'action
        const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id) 
            VALUES (?, NOW(), ?, ?, 'P', ?);`
            db.query(logQuery, ["Supprimer ressource d'un tableau", user, `${user} a supprimer les ressources associés aux cartes du tableau ${tabNom}`, tab_id], (err3, result3) => {
              if (err3) return reject(err3);
              resolve({ message: "Ressources supprimés avec succès", results });
        });
      });
    });
  });
};

// Suppression des membres associés aux cartes d’un tableau
const delMemTab = (tab_id: number, user: string) => {
  return new Promise((resolve, reject) => {
    db.query(`
      DELETE FROM t_membre_mem 
      WHERE car_id IN (
        SELECT car_id FROM t_carte_car
        WHERE lis_id IN (
          SELECT lis_id FROM t_liste_lis WHERE tab_id = ?
        )
      )
    `, [tab_id], (err, results) => {
      if (err) return reject(err);

      // Récupérer le nom du tableau pour le log
      const getTabNameQuery = "SELECT tab_titre FROM t_tableau_tab WHERE tab_id = ?";
      db.query(getTabNameQuery, [tab_id], (err2, result2) => {
        if (err2) return reject(err2);

        const row = result2 as { tab_titre: string }[];
        const tabNom = row[0]?.tab_titre ?? 'Inconnu';

        // Logger
        const logQuery = `
          INSERT INTO t_login_log (
            log_type, log_date, log_auteur, log_description,
            log_etat, tab_id
          ) VALUES (?, NOW(), ?, ?, 'P', ?);
        `;
        db.query(logQuery, ["Supprimer membre d'un tableau", user, `${user} a supprimé les membres associés aux cartes du tableau ${tabNom}`,
          tab_id
        ], (err3, result3) => {
          if (err3) return reject(err3);
          resolve({ message: "Membres supprimés avec succès", results });
        });
      });
    });
  });
};

// Suppression des cartes d'un tableau en particulier
const delCarteTab = (tab_id: number, user: string) => {
  return new Promise((resolve, reject) => {
    db.query(`
      DELETE FROM t_carte_car WHERE lis_id IN (
        SELECT lis_id FROM t_liste_lis WHERE tab_id = ?)
    `, [tab_id], (err, results) => {
      if (err) return reject(err);
      // Récupérer le nom du tableau
      const getTabNameQuery = "SELECT tab_titre FROM t_tableau_tab WHERE tab_id = ?";
      db.query(getTabNameQuery, [tab_id], (err2, result2) => {
        if (err2) return reject(err2);
        const row = result2 as { tab_titre: string }[];
        const tabNom = row[0]?.tab_titre ?? 'Inconnu';
        // Logger
        const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id) 
            VALUES (?, NOW(), ?, ?, 'P', ?);`
            db.query(logQuery, ["Supprimer carte d'un tableau", user, `${user} a supprimé les cartes associés au tableau ${tabNom}`, tab_id], (err3, result3) => {
              if (err3) return reject(err3);
              resolve({ message: "Cartes supprimés avec succès", results });
        });
      });
    });
  });
};

// Suppression des membres d'un tableau en particulier
const delRoleTab = (tab_id: number, user: string) => {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM t_role_rol WHERE tab_id = ?", 
      [tab_id], (err, results) => {
      if (err) return reject(err);
      // Récupérer le nom du tableau
      const getTabNameQuery = "SELECT tab_titre FROM t_tableau_tab WHERE tab_id = ?";
      db.query(getTabNameQuery, [tab_id], (err2, result2) => {
        if (err2) return reject(err2);
        const row = result2 as { tab_titre: string }[];
        const tabNom = row[0]?.tab_titre ?? 'Inconnu';
        // Logger l'action
        const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id) 
            VALUES (?, NOW(), ?, ?, 'P', ?);`
            db.query(logQuery, ['Supprimer rôle', user, `${user} a supprimé les roles associés au tableau ${tabNom}`, tab_id], (err3, result3) => {
              if (err3) return reject(err3);
              resolve({ message: "Roles supprimés avec succès", results });
        });
      });
    });
  });
};

// Suppression des listes d'un tableau en particulier
const delListTab = (tab_id: number, user: string) => {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM t_liste_lis WHERE tab_id = ?", 
      [tab_id], (err, results) => {
      if (err) return reject(err);
      // Récupérer le nom du tableau
      const getTabNameQuery = "SELECT tab_titre FROM t_tableau_tab WHERE tab_id = ?";
      db.query(getTabNameQuery, [tab_id], (err2, result2) => {
        if (err2) return reject(err2);
        const row = result2 as { tab_titre: string }[];
        const tabNom = row[0]?.tab_titre ?? 'Inconnu';
        // Logger l'action
        const logQuery = `INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id) 
            VALUES (?, NOW(), ?, ?, 'P', ?);`
            db.query(logQuery, ['Supprimer liste', user, `${user} a supprimé les listes associés au tableau ${tabNom}`, tab_id], (err3, result3) => {
              if (err3) return reject(err3);
              resolve({ message: "Listes supprimés avec succès", results });
        });
      });
    });
  });
};

// Suppression des activités d'un tableau particulier et des cartes
const delLogTab = (tab_id: number) => {
  return new Promise((resolve, reject) => {
    db.query(`
      DELETE FROM t_login_log 
      WHERE tab_id = ? 
      OR car_id IN (
        SELECT car_id FROM t_carte_car
        WHERE lis_id IN (
          SELECT lis_id FROM t_liste_lis WHERE tab_id = ?
        )
      )
    `, [tab_id, tab_id], (err, results) => (err ? reject(err) : resolve(results)));
  });
};


// Suppression d'un tableau
const delTab = (tab_id: number, user: string) => {
  return new Promise((resolve, reject) => {
    // Récupérer le nom du tableau
    const getTabNameQuery = "SELECT tab_titre FROM t_tableau_tab WHERE tab_id = ?";
    db.query(getTabNameQuery, [tab_id], (err, result) => {
      if (err) return reject(err);

      const row = result as { tab_titre: string }[];
      const tabNom = row[0]?.tab_titre ?? 'Inconnu';

      // Supprimer le tableau
      db.query("DELETE FROM t_tableau_tab WHERE tab_id = ?", [tab_id], (err2, results) => {
        if (err2) return reject(err2);

        // Logger
        const logQuery = `
          INSERT INTO t_login_log (
            log_type, log_date, log_auteur, log_description, log_etat
          ) VALUES (?, NOW(), ?, ?, 'P');
        `;
        db.query(logQuery, ['Supprimer tableau', user, `${user} a supprimé le tableau ${tabNom}`
        ], (err3, result3) => {
          if (err3) return reject(err3);
          resolve({ message: "Tableau supprimé avec succès", results });
        });
      });
    });
  });
};


export const deleteTab = async (tab_id: number, user: string) => {
  try {
    await delTagTab(tab_id, user);
    await delResTab(tab_id, user);
    await delMemTab(tab_id, user);
    await delLogTab(tab_id);
    await delCarteTab(tab_id, user);
    await delListTab(tab_id, user);
    await delRoleTab(tab_id, user);
    await delLogTab(tab_id);
    await delTab(tab_id, user);
    return { success: true, message: "Suppression complète réussie" };
  } catch (err) {
    throw err;
  }
};