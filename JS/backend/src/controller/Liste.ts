import { Request, Response } from "express";
import db from "../../connection";
import {getAllList,addList, updateList, updateListOrder, updateCarteOrder, delList, archiveList,
  getArchivedLists, moveList,
  desarchiveList} from "../models/listeModel";

// Lister tous les listes non archiver au sein d'un tableau
export const fetchGetAllListe = async (req: Request, res: Response) => {
  const tab_id = req.params.id;
  try {
    const query = await getAllList(tab_id);
    res.status(200).json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des listes", details: err });
  }
};

// Ajouter une liste
export const fetchAddList = async (req: Request, res: Response) => {
  const { tab_id, lis_titre, lis_ordre } = req.body;
  const user = req.user?.cpt_mail;
  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }
  try {
    const query = await addList(tab_id, lis_titre, lis_ordre, user);
    res.status(201).json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'ajout de la liste", details: err });
  }
};

// Mettre à jour le titre d’une liste
export const fetchUpdateList = async (req: Request, res: Response) => {
  const { lis_id } = req.params;
  const { lis_titre } = req.body;
  const user = req.user?.cpt_mail;
  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }
  try {
    const query = await updateList(lis_id, lis_titre, user);
    res.status(200).json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la mise à jour de la liste", details: err });
  }
};

// Reorganise les listes d'un tableau
export const fetchUpdateListOrder = async (req: Request, res: Response) => {
  console.log('Requête reçue pour mise à jour ordre listes:', req.body);

  const listOrder = req.body.lis_ordre;
  const tabId = req.params.id;

  if (!tabId || typeof tabId !== "string") {
    return res.status(400).json({ error: "tab_id est requis et doit être une chaîne." });
  }

  if (!Array.isArray(listOrder)) {
    return res.status(400).json({ error: "lis_ordre doit être un tableau." });
  }

  for (const item of listOrder) {
    if (!item.lis_id || typeof item.lis_ordre !== "number") {
      console.error('Erreur sur un élément:', item);
      return res.status(400).json({
        invalidItem: item
      });
    }
  }

  const user = req.user?.cpt_mail;
  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }

  try {
    const updates = await Promise.all(
      listOrder.map(async (item) => {
        console.log(`Mise à jour de la liste id=${item.lis_id} avec ordre=${item.lis_ordre} pour tab_id=${tabId}`);
        const result = await updateListOrder(item.lis_id, item.lis_ordre, tabId); // ← Assure-toi que cette fonction retourne old + new ordre
        console.log('Résultat mise à jour:', result);
        return result;
      })
    );

    // Logger la liste déplacer
    const movedList = updates.find(item => item.old_order !== item.new_order);

    if (movedList) {
      const { lis_titre, old_order, new_order, tab_titre } = movedList;
      const direction = new_order > old_order ? "vers la droit" : "vers la gauche";

      const logDescription = `${user} a déplacé la liste "${lis_titre}" de la position ${old_order + 1} à ${new_order + 1} (${direction}) dans le tableau "${tab_titre}"`;

      const logQuery = `
        INSERT INTO t_login_log (log_type, log_date, log_auteur, log_description, log_etat, tab_id, log_source_liste, log_destination_liste)
        VALUES ('Déplacer liste', NOW(), ?, ?, 'P', ?, ?, ?)
      `;
      await new Promise<void>((resolve, reject) => {
        db.query(
          logQuery,
          [user, logDescription, tabId, (old_order + 1).toString(), (new_order + 1).toString()],
          (err) => {
            if (err) return reject(err);
            resolve();
          }
        );
      });
    }

    console.log('Mise à jour de l’ordre des listes terminée:', updates);
    res.status(200).json({ message: "Ordre des listes mis à jour", updates });
  } catch (err) {
    console.error('Erreur lors de la mise à jour:', err);
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'ordre des listes", details: err });
  }
};

// Reorganiser les cartes d'une liste
export const fetchUpdateCarteOrder = async (req: Request, res: Response) => {
  const { lis_id } = req.params;
  const { car_ordre } = req.body;

  if (!lis_id || !car_ordre || !Array.isArray(car_ordre)) {
    return res.status(400).json({ error: "Informations manquantes ou mal formées" });
  }

  try {
    await updateCarteOrder(lis_id, car_ordre);
    res.status(200).json({ message: "Ordre des cartes mis à jour" });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'ordre des cartes", details: err });
  }
};


// Supprimer une liste
export const fetchDeleteList = async (req: Request, res: Response) => {
  const { lis_id } = req.params;
  const user = req.user?.cpt_mail;
  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }
  try {
    const query = await delList(lis_id, user);
    res.status(200).json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression de la liste", details: err });
  }
};

// Archiver une liste
export const fetchArchiveList = async (req: Request, res: Response) => {
  const { lis_id } = req.params;
  const user = req.user?.cpt_mail;
  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }
  try {
    const query = await archiveList(lis_id, user);
    res.status(200).json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'archivage de la liste", details: err });
  }
};

// Récupérer les listes archivées
export const fetchGetArchivedLists = async (req: Request, res: Response) => {
  const tab_id = req.params.id;
  try {
    const query = await getArchivedLists(tab_id);
    res.status(200).json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des listes archivées", details: err });
  }
};

// Desarchiver une liste
export const fetchDesarchiveList = async (req: Request, res: Response) => {
  const { lis_id }  = req.params;
  const user = req.user?.cpt_mail;
  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }
  try {
    const query = await desarchiveList(lis_id, user);
    res.status(200).json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la publication de la liste", details: err });
  }
};

// Déplacer une liste (changer son ordre)
export const fetchMoveList = async (req: Request, res: Response) => {
  const { lis_id } = req.params;
  const { lis_ordre } = req.body;
  try {
    const query = await moveList(lis_id, lis_ordre);
    res.status(200).json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du déplacement de la liste", details: err });
  }
};
