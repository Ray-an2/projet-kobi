import { Request, Response } from "express";
import { getAllTab, getAllTabAdmin, getAllTabRecAdmin, getAllTabAlpAdmin, getAllTabRec, getAllTabAlp, 
  searchTabAdmin, searchTab, getTab, closeTab, openTab, updateTab,
  getTabMemRole, getTabInfo, addTab, deleteTab,getTagsByTab, getResByTab, getMemByTab, checkDateLimite, getRole,
  getAllTabLog, getTabLog, searchLogAdmin, searchLog, getCompte, DelRole, AddRole} from "../models/tableauModel";

// Récupérer tous les tableaux
export const fetchAllTab = async (req: Request, res: Response) => {
  try {
    const role = req.user?.pfl_role;

    if (!role) {
      return res.status(401).json({ error: "Rôle utilisateur manquant." });
    }

    let query;

    // Si l'utilisateur est Administrateur ou Gestionnaire
    if (role === "A" || role === "G") {
      query = await getAllTabAdmin();
    } else {
      const id = req.user?.cpt_id
      if(!id) return res.status(401).json({ error: "ID utilisateur manquant !"});
      query = await getAllTab(id);
    }

    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur SQL des tableaux", details: err });
  }
};

export const fetchAllTabSorted = async (req: Request, res: Response) => {
  try {
    const tri = req.query.tri;
    const role = req.user?.pfl_role;

    if (!role) {
      return res.status(401).json({ error: "Rôle manquant." });
    }

    let data;

    const Admin = role === "A" || role === "G";
    const id = req.user?.cpt_id;

    if (!id) return res.status(401).json({ error: "ID utilisateur manquant !" });

    if (tri === "alp") {
      data = Admin ? await getAllTabAlpAdmin() : await getAllTabAlp(id);
    } else if (tri === "rec") {
      data = Admin ? await getAllTabRecAdmin() : await getAllTabRec(id);
    } else {
      return res.status(400).json({ error: "Paramètre de tri invalide (utiliser 'rec' ou 'alp')." });
    }

    res.json(data);
  } catch (err) {
    console.error("Erreur de trie des tableaux :", err);
    res.status(500).json({ error: "Erreur SQL", details: err });
  }
};

// Récupère tous les tableaux contenant le mot
export const fetchSearchTab = async (req: Request, res: Response) => {
  try {
    const { search } = req.body;
    if (!search || typeof search !== "string") {
      return res.status(400).json({ error: "Le champ 'search' est requis et doit être une chaîne de caractères." });
    }

    const role = req.user?.pfl_role;
    const id = req.user?.cpt_id;
    if (!role || !id || (typeof id !== "number" || role !== 'A' && role !== 'G')) {
      return res.status(401).json({ error: "Utilisateur invalide !" });
    }
    const Admin = role === "A" || role === "G";
    const result = Admin ? await searchTabAdmin(search) : await searchTab(search, id);
    res.json(result);
  } catch (err) {
      res.status(500).json({ error: "Erreur lors de la recherche des tableaux", details: err });
  }
};

// Récupère tous les tableaux contenant le mot
export const fetchSearchLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { search } = req.body;
    if (!search || typeof search !== "string") {
      return res.status(400).json({ error: "Le champ 'search' est requis et doit être une chaîne de caractères." });
    }

    const role = req.user?.pfl_role;
    const userId = req.user?.cpt_id;
    if (!role || !userId) {
      return res.status(401).json({ error: "Utilisateur invalide !" });
    }
    if (id){
      const result = await searchLog(search, id);
      return res.json(result);
    }
    const Admin = role === "A" || role === "G";
    if (!Admin) {
      return res.status(403).json({ error: "Accès refusé aux logs globaux." });
    }
    const result = await searchLogAdmin(search);
    res.json(result);
  } catch (err) {
      res.status(500).json({ error: "Erreur lors de la recherche des logs", details: err });
  }
};

// Récupère un tableau particulier
export const fetchTab = async (req: Request, res: Response) => {
  try {
    const tabId = req.params.id;
    const cptId = req.user?.cpt_id;

    if (!cptId) {
      return res.status(400).json({ error: "Utilisateur non connecté" });
    }

    const query = await getTab(tabId, cptId);
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur SQL", details: err });
  }
};

// Récupère les détailles d'un tableau particulier
export const getCardByTab = async (req: Request, res: Response) => {
  const { id: tableauId } = req.params;

  try {
    const [tags, ressources, membres] = await Promise.all([
      getTagsByTab(tableauId),
      getResByTab(tableauId),
      getMemByTab(tableauId)
    ]);

    res.status(200).json({
      tags,
      ressources,
      membres
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du tableau :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des détails du tableau.' });
  }
};


// Vérifie la date limite
export const fecthCheckDateLimite = async (req: Request, res: Response) => {
  try {
    const { id, carId } = req.params;

    if (!id || !carId) {
      return res.status(400).json({ error: "Paramètres manquants." });
    }
    const query = await checkDateLimite(id, carId);
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur interne du serveur", details: err });
  }
};

// Récupère le role
export const fetchGetRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cpt_id = req.user?.cpt_id;

    if (!id || !cpt_id) {
      return res.status(400).json({ error: "Paramètres manquants." });
    }
    const query = await getRole(id, cpt_id);
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur interne du serveur", details: err });
  }
};


// Fermer un tableau
export const fetchCloseTab = async (req: Request, res: Response) => {
  const user = req.user?.cpt_mail;

  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }
  try {
    const query = await closeTab(req.params.id, user);
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la fermeture du tableau", details: err });
  }
};

// Ouvrir un tableau
export const fetchOpenTab = async (req: Request, res: Response) => {
  const user = req.user?.cpt_mail;

  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }
  try {
    const query = await openTab(req.params.id, user);
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'ouverture du tableau", details: err });
  }
};

// Modifier le nom et la description d'un tableau
export const fetchUpdateTab = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tab_titre, tab_des, tab_couv } = req.body;
  if (!tab_titre) {
    return res.status(400).json({ error: "Tous les champs (titre, description, couverture) doivent être fournis" });
  }
  const user = req.user?.cpt_mail;

  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }
  try {
    const query = await updateTab(id, tab_titre, tab_des ?? '', tab_couv ?? '', user);
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la mise à jour du tableau", details: err });
  }
};

// Affichage des membres du tableau avec leur rôle
export const fetchTabMembers = async (req: Request, res: Response) => {
  try {
    const query = await getTabMemRole(req.params.id);
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des membres", details: err });
  }
};

// Affichage des informations du tableau avec leur rôle
export const fetchTabInfo = async (req: Request, res: Response) => {
  try {
    const query = await getTabInfo(req.params.id);
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des information d'un tableau", details: err });
  }
};

export const fetchGetAllLog = async (req: Request, res: Response) => {
  try {
    const logs = await getAllTabLog();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des logs", details: err });
  }
};

export const fetchGetTabLog = async (req: Request, res: Response) => {
  try {
    const tabId = req.params.id;

    if (!tabId) {
      return res.status(400).json({ error: "ID de tableau manquant" });
    }

    const logs = await getTabLog(tabId);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des logs du tableau", details: err });
  }
}

export const fetchGetCompte = async (req: Request, res: Response) => {
  const tab_id = req.params.id
  try{
      const query = await getCompte(tab_id);
      res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des comptes", details: err });
  }
}

export const fetchDelRole = async (req: Request, res: Response) => {
  const tab_id = req.params.id;
  const cpt_id = req.body.cpt_id;
  const userId = req.user?.cpt_id; 
  const user = req.user?.cpt_mail;

  if (!user || !userId) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }
  try{
      const query = await DelRole(tab_id, cpt_id, user, userId);
      res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des comptes", details: err });
  }
}

export const fetchAddRole = async (req: Request, res: Response) => {
  const tab_id = req.params.id;
  const { cpt_id, role } = req.body;
  const user = req.user?.cpt_mail;

  if (!user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }
  try{
      const query = await AddRole(tab_id, cpt_id, role, user);
      res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des comptes", details: err });
  }
}


export const fetchAddTab = async (req: Request, res: Response) => {
  const { tab_titre, tab_des, tab_couv } = req.body;

  if (!tab_titre || tab_titre.trim() === "") {
    return res.status(400).json({ error: "Le titre est requis." });
  }
  const userId = req.user?.cpt_id;

  if (!userId) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }

  const user = req.user?.cpt_mail;

  if (!user) {
    return res.status(401).json({ error: "Mail de l'utilisateur non authentifié" });
  }

  try {
    const newTab = await addTab(tab_titre, tab_des || null, tab_couv || null, userId, user);
    return res.status(201).json(newTab);
  } catch (error) {
    console.error("Erreur dans fetchAddTab :", error);
    return res.status(500).json({ error: "Erreur lors de l'ajout du tableau." });
  }
};

export const fetchDelTab = async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = req.user?.cpt_mail;

  if (!user) {
    return res.status(401).json({ error: "Mail de l'utilisateur non authentifié" });
  }

  try {
    const query = await deleteTab(Number(id), user);
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression du tableau", details: err });
  }
};