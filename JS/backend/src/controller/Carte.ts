import { Request, Response } from "express";
import { getCarte, getMembre, getTag, addCarte, updateCarte, moveCarte, getTagsCarte,
    deleteCarte, archiveCarte, terminerCarte, addMembre, nbCarteListe, delMembre, addTagCarte,
    delTagCarte, getArchiveCartes, addTag, delTag,
    updateTag} from "../models/carteModel";

// Récupérer une carte particulière
export const fetchGetCarte = async (req: Request, res: Response) => {
  try {
    const query = await getCarte(req.params.carId);
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération de tous informations de la carte", details: err });
  }
};

// Récupérer tous les membres d'une carte s'il y en a
export const fetchGetMembre = async (req: Request, res: Response) => {
  try {
    const query = await getMembre(req.params.carId);
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des informations des membres de la carte", details: err });
  }
};

// Ajouter un membre à une carte particulière
export const fetchAddMembre = async (req: Request, res: Response) => {
  const car_id = req.params.carId;
  const { cpt_id } = req.body;

  const user = req.user?.cpt_mail;
  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }

  try {
    const query = await addMembre(cpt_id, car_id, user);
    res.status(201).json(query);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'ajout du membre à la carte", details: err });
  }
};

// Retirer un membre d'une carte particulière
export const fetchDelMembre = async (req: Request, res: Response) => {
  const car_id = req.params.carId
  const cpt_id = req.params.cptId
  const user = req.user?.cpt_mail;

  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }

  try {
    const result = await delMembre(cpt_id, car_id, user);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression du membre", details: err });
  }
};

// Récupérer tous les tags
export const fetchGetTag = async (req: Request, res: Response) => {
  try {
    const query = await getTag();
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des tags de la carte", details: err });
  }
};

// Ajouter un tag
export const fetchAddTag = async (req: Request, res: Response) => {
  const { tag_nom, tag_couleur } = req.body;
  const user = req.user?.cpt_mail;

  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }
  
  if (!tag_nom || typeof tag_nom !== 'string' || tag_nom.trim().length === 0) {
    return res.status(400).json({ error: "Nom du tag invalide" });
  }

  if (!/^#[0-9A-Fa-f]{6}$/.test(tag_couleur)) {
    return res.status(400).json({ error: "Couleur hexadécimale invalide (format attendu : #RRGGBB)" });
  }

  try {
    const query = await addTag(tag_nom, tag_couleur, user);
    res.status(201).json(query);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'ajout du tag à la carte", details: err });
  }
};

// Mettre à jour un tag
export const fetchUpdateTag = async (req: Request, res: Response) => {
  const { id, nom, couleur } = req.body;
  const user = req.user?.cpt_mail;

  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }

  if (!id || !nom || typeof nom !== 'string' || nom.trim().length === 0) {
    return res.status(400).json({ error: "Nom du tag invalide ou ID manquant" });
  }

  if (!/^#[0-9A-Fa-f]{6}$/.test(couleur)) {
    return res.status(400).json({ error: "Couleur hexadécimale invalide (format attendu : #RRGGBB)" });
  }

  try {
    const result = await updateTag(id, nom, couleur, user);
    if (result === "no_change") {
      return res.status(200).json({ message: "Aucune modification détectée." });
    }
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour du tag", details: err });
  }
};

// Supprimer un tag
export const fetchDelTag = async (req: Request, res: Response) => {
  const tag_id = req.params.tagId;
  const user = req.user?.cpt_mail;

  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }
  
  if (!tag_id) {
    return res.status(400).json({ error: "Tag invalide" });
  }

  try {
    const query = await delTag(tag_id, user);
    res.status(201).json(query);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'ajout du tag à la carte", details: err });
  }
};

// Récupérer tous les tags d'une carte particulière
export const fetchGetTagCarte = async (req: Request, res: Response) => {
  const car_id = req.params.carId;
  try {
    const query = await getTagsCarte(car_id);
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des tags de la carte", details: err });
  }
};

// Ajouter un tag à une carte particulière
export const fetchAddTagCarte = async (req: Request, res: Response) => {
  const car_id = req.params.carId;
  const { tag_id } = req.body;
  const user = req.user?.cpt_mail;

  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }

  try {
    const query = await addTagCarte(tag_id, car_id, user);
    res.status(201).json(query);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'ajout du tag à la carte", details: err });
  }
};

// Retirer un tag d'une carte particulière
export const fetchDelTagCarte = async (req: Request, res: Response) => {
  const car_id = req.params.carId;
  const tag_id = req.params.cptId; // attention, c’est `:cptId` dans la route mais ici c’est un `tag_id`
  const user = req.user?.cpt_mail;

  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }

  try {
    const query = await delTagCarte(tag_id, car_id, user);
    res.json(query);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression du tag de la carte", details: err });
  }
};

// Ajouter une carte
export const fetchAddCarte = async (req: Request, res: Response) => {
  const { car_nom, car_description, car_date_debut, car_date_fin, car_couverture, lis_id } = req.body;

  if (typeof car_nom !== 'string' || !car_nom.trim()) {
    return res.status(400).json({ error: "Nom de carte manquant ou invalide" });
  }

  const lisIdNumber = typeof lis_id === 'string' ? parseInt(lis_id) : lis_id;
  if (typeof lisIdNumber !== 'number' || isNaN(lisIdNumber)) {
    return res.status(400).json({ error: "Liste ID manquant ou invalide" });
  }

  const user = req.user?.cpt_mail;
  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }

  try {
    const query = await addCarte(car_nom, car_description, car_date_debut, car_date_fin, car_couverture, lisIdNumber.toString(), user);
    res.status(201).json(query);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'ajout de la carte", details: err });
  }
};

// Mettre à jour un champ spécifique d'une carte
export const fetchUpdateCarte = async (req: Request, res: Response) => {
  const car_id = req.params.carId
  const { field, value } = req.body;
  const user = req.user?.cpt_mail;
  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }
  console.log("Requête de mise à jour :", { car_id, field, value, user });
  try {
    const query = await updateCarte(car_id, field, value, user);
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la mise à jour de la carte", details: err });
  }
};

// Déplacer une carte
export const fetchMoveCarte = async (req: Request, res: Response) => {
  const { car_id } = req.params;
  const { lis_id, car_ordre } = req.body;

  if (!car_id || !lis_id || typeof car_ordre !== 'number') {
    return res.status(400).json({ error: "Champs de déplacement de la carte manquants ou mal formés" });
  }

  const user = req.user?.cpt_mail;
  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }

  try {
    const result = await moveCarte(lis_id, car_id, car_ordre, user);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du déplacement de la carte", details: err });
  }
};


// Supprimer une carte
export const fetchDelCarte = async (req: Request, res: Response) => {
  const { carId } = req.params;
  const user = req.user?.cpt_mail;
  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }

  try {
    const query = await deleteCarte(carId, user);
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression de la carte", details: err });
  }
};

// Archiver une carte
export const fetchArchiveCarte = async (req: Request, res: Response) => {
  const car_id = req.params.carId;
  const { car_archiver } = req.body;
  const user = req.user?.cpt_mail;
  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }

  try {
    const query = await archiveCarte(car_id, car_archiver, user);
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'archivage de la carte", details: err });
  }
};

// Récupère les cartes archiver
export const fetchGetArchivedCarte = async (req: Request, res: Response) => {
  const tab_id = req.params.id;
  try {
    const query = await getArchiveCartes(tab_id);
    res.json(query);
  } catch (err) {
    res.status(500).json({
      error: "Erreur lors de la récupération des cartes archivées", details: err});
  }
};

// Terminer une carte
export const fetchTerminerCarte = async (req: Request, res: Response) => {
  const { carId : car_id } = req.params;
  const { car_terminer} = req.body;
  const user = req.user?.cpt_mail;
  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }

  try {
    const query = await terminerCarte(car_id, car_terminer, user);
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de finir la carte", details: err });
  }
};

// Compter le nombre de cartes dans une liste
export const fetchNbCarteListe = async (req: Request, res: Response) => {
  const { listId : lis_id } = req.params;

  if (!lis_id) {
    return res.status(400).json({ error: "ID de liste manquant" });
  }

  try {
    const result = await nbCarteListe(lis_id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du comptage des cartes", details: err });
  }
};

