import { Router } from "express";
import { fetchAllTab, fetchTab, fetchCloseTab, fetchOpenTab, 
    fetchUpdateTab, fetchTabMembers, fetchTabInfo, fetchAddTab, fetchDelTab,
    fetchAllTabSorted, fetchSearchTab, getCardByTab, fecthCheckDateLimite,
    fetchGetRole, fetchGetTabLog, fetchGetAllLog, fetchSearchLog, fetchGetCompte, fetchDelRole,
    fetchAddRole} from "../controller/Tableau";
import {
    fetchAddList, fetchUpdateList, fetchUpdateListOrder, fetchDeleteList,
    fetchArchiveList, fetchGetArchivedLists, fetchUpdateCarteOrder, fetchMoveList,
    fetchGetAllListe,
    fetchDesarchiveList} from "../controller/Liste";
import {fetchGetCarte, fetchGetMembre, fetchAddMembre, fetchAddCarte, fetchUpdateCarte, fetchMoveCarte,
        fetchDelCarte, fetchArchiveCarte, fetchTerminerCarte, fetchNbCarteListe, fetchDelMembre, fetchGetTag, 
        fetchAddTagCarte, fetchDelTagCarte, fetchGetTagCarte,
        fetchGetArchivedCarte,
        fetchAddTag,
        fetchDelTag,
        fetchUpdateTag,} from "../controller/Carte";
import { authorizeGlobalRoles} from "../middleware/authGlobal";
import { authorizeTableRole } from "../middleware/authTable";
import { auth } from "../middleware/authUser";

const router = Router();


/**-------------------------------------- TABLEAU ----------------------------------------------- */

// Route pour récupérer tous les tableaux
router.get("/tableau", auth, authorizeGlobalRoles("A", "G", "M", "P"), fetchAllTab);

// Route pour récupérer tous les log de tous les tableaux
router.get("/tableau/log", auth, authorizeGlobalRoles("A", "G"), fetchGetAllLog);

// Route pour ajouter un tableau
router.post("/tableau", auth, authorizeGlobalRoles("A", "G", "M", "P"), fetchAddTab);

// Route pour rechercher dans tous les tableaux le titre qui contient la recherche
router.post("/tableau/rec", auth, authorizeGlobalRoles("A", "G", "M", "P"), fetchSearchTab);

// Route pour rechercher dans tous les logs l'information qui contient la recherche
router.post("/tableau/log/rec", auth, authorizeGlobalRoles("A", "G"), fetchSearchLog);

// Route pour rechercher dans tous les logs d'un tableau en particulier l'information qui contient la recherche
router.post("/tableau/:id/log/rec", auth, authorizeTableRole("A", "M", "C"), fetchSearchLog);

// Route pour récupérer tous les tableaux et trier (alphabétique, récent)
router.get("/tableau/tri", auth, authorizeGlobalRoles("A", "G", "M", "P"), fetchAllTabSorted);

// Route pour récupérer les comptes des membres disponibles
router.get("/tableau/:id/comptes", auth, authorizeTableRole("A", "C"), fetchGetCompte);

// Route pour retirer le compte d'un membre d'un tableau particulier
router.delete("/tableau/:id/membre", auth, authorizeTableRole("A", "C"), fetchDelRole);

// Route pour ajouter le compte d'un membre d'un tableau particulier
router.post("/tableau/:id/membre", auth, authorizeTableRole("A", "C"), fetchAddRole);

// Route pour récupérer un tableau particulier
router.get("/tableau/:id", auth, authorizeTableRole("A", "M", "C"), fetchTab);

// Route pour récupérer les détailles des cartes d'un tableau particulier
router.get("/tableau/:id/cartes", auth, authorizeTableRole("A", "M", "C"), getCardByTab);

// Route pour vérifier la date limite d'une carte d'un tableau particulière
router.get("/tableau/:id/carte/:carId/check-limite", auth, authorizeTableRole("A", "M", "C"), fecthCheckDateLimite);

// Route pour récupérer le role
router.get("/tableau/:id/role", auth, authorizeTableRole("A", "C", "M"), fetchGetRole);

// Route pour récupérer les log d'un tableau en particulier
router.get("/tableau/:id/log", auth, authorizeTableRole("A", "C", "M"), fetchGetTabLog);

// Route pour fermer un tableau
router.put("/tableau/:id/fermer", auth, authorizeTableRole("A", "C"), fetchCloseTab);

// Route pour ouvrir un tableau
router.put("/tableau/:id/ouvrir", auth, authorizeTableRole("A", "C"), fetchOpenTab);

// Route pour modifier un tableau (nom, description et couverture)
router.put("/tableau/:id/modifier", auth, authorizeTableRole("A", "M", "C"), fetchUpdateTab);

// Route pour récupérer les informations des membres d'un tableau
router.get("/tableau/:id/membres", auth, authorizeTableRole("A", "M", "C"), fetchTabMembers);

// Route pour récupérer les description d'un tableau
router.get("/tableau/:id/description", auth, authorizeTableRole("A", "M", "C"), fetchTabInfo);

// Route pour supprimer un tableau
router.delete("/tableau/:id", auth, authorizeTableRole("A", "C"), fetchDelTab);

/**------------------------------------------------------------------------------------------------ */

/**-------------------------------------- LISTE --------------------------------------------------- */

// Route pour récupérer les listes d’un tableau
router.get("/tableau/:id/list/", auth, authorizeTableRole("A", "M", "C"), fetchGetAllListe);

// Route pour ajouter une liste
router.post("/list", auth, authorizeTableRole("A", "M", "C"), fetchAddList);

// Route pour récupérer les listes archivées d’un tableau
router.get("/tableau/:id/list/archiver", auth, authorizeTableRole("A", "M", "C"), fetchGetArchivedLists);

// Route pour mettre à jour une liste
router.put("/tableau/:id/list/:lis_id", auth, authorizeTableRole("A", "M", "C"), fetchUpdateList);

// Route pour réorganiser les listes d'un tableau
router.put("/tableau/:id/ordre-listes", auth, authorizeTableRole("A", "M", "C"), fetchUpdateListOrder);

// Route pour réorganiser les cartes dans une liste
router.put("/tableau/:id/list/:lis_id/ordre-cartes", auth, authorizeTableRole("A", "M", "C"), fetchUpdateCarteOrder);

// Route pour déplacer une liste
router.patch("/tableau/:id/list/:lis_id/déplacer", auth, authorizeTableRole("A", "M", "C"), fetchMoveList);

// Route pour archiver une liste
router.put("/tableau/:id/list/archiver/:lis_id", auth, authorizeTableRole("A", "M", "C"), fetchArchiveList);

// Route pour desarchiver une liste
router.put("/tableau/:id/list/desarchiver/:lis_id", auth, authorizeTableRole("A", "M", "C"), fetchDesarchiveList);

// Route pour supprimer une liste
router.delete("/tableau/:id/list/:lis_id/supprimer", auth, authorizeTableRole("A", "C"), fetchDeleteList);

/**------------------------------------------------------------------------------------------------ */

/**-------------------------------------- CARTE --------------------------------------------------- */

// Route pour récupérer la carte particulière
router.get("/tableau/:id/carte/:carId", auth, authorizeTableRole("A", "M", "C"), fetchGetCarte);

// Route pour récupérer les membres d'une carte particulière
router.get("/tableau/:id/carte/:carId/membre", auth, authorizeTableRole("A", "M", "C"), fetchGetMembre);

// Route pour ajouter un membre à une carte particulière
router.post("/tableau/:id/carte/:carId/membre", auth, authorizeTableRole("A", "M", "C"), fetchAddMembre);

// Route pour retirer un membre à une carte particulière
router.delete("/tableau/:id/carte/:carId/membre/:cptId", auth, authorizeTableRole("A", "M", "C"), fetchDelMembre);

// Route pour lister tous les tags
router.get("/tableau/:id/tag", auth, authorizeTableRole("A", "M", "C"), fetchGetTag);

// Route pour ajouter un tag
router.post("/tableau/:id/tag", auth, authorizeTableRole("A", "M", "C"), fetchAddTag);

// Route pour supprimer un tag
router.delete("/tableau/:id/tag/:tagId", auth, authorizeTableRole("A", "M", "C"), fetchDelTag);

// Route pour ajouter un tag
router.put("/tableau/:id/tag", auth, authorizeTableRole("A", "M", "C"), fetchUpdateTag);

// Route pour récupérer les tags d'une carte particulière
router.get("/tableau/:id/carte/:carId/tag", auth, authorizeTableRole("A", "M", "C"), fetchGetTagCarte);

// Route pour ajouter un tag à une carte particulière
router.post("/tableau/:id/carte/:carId/tag", auth, authorizeTableRole("A", "M", "C"), fetchAddTagCarte);

// Route pour retirer un tag à une carte particulière
router.delete("/tableau/:id/carte/:carId/tag/:cptId", auth, authorizeTableRole("A", "M", "C"), fetchDelTagCarte);

// Route pour ajouter une carte
router.post("/tableau/:id/carte", auth, authorizeTableRole("A", "M", "C"), fetchAddCarte);

// Route pour mettre à jour une carte particulière
router.put("/tableau/:id/carte/:carId/modifier", auth, authorizeTableRole("A", "M", "C"), fetchUpdateCarte);

// Déplacer une carte
router.put("/tableau/:id/carte/:car_id/deplacer", auth, authorizeTableRole("A", "M", "C"), fetchMoveCarte);

// Route pour archiver une carte particulière
router.put("/tableau/:id/carte/:carId/archiver", auth, authorizeTableRole("A", "M", "C"), fetchArchiveCarte);

// Route pour récupérer les cartes archivées d’un tableau
router.get("/tableau/:id/cartes/archiver", auth, authorizeTableRole("A", "M", "C"), fetchGetArchivedCarte);

// Route pour terminer une carte particulière
router.put("/tableau/:id/carte/:carId/terminer", auth, authorizeTableRole("A", "M", "C"), fetchTerminerCarte);

// Route pour supprimer une carte particulière
router.delete("/tableau/:id/carte/:carId/supprimer", auth, authorizeTableRole("A", "C"), fetchDelCarte);

// Route pour compter le nombre de carte dans une liste
router.get("/tableau/:id/list/:listId/cartes/count", auth, authorizeTableRole("A", "M", "C"), fetchNbCarteListe);

/**------------------------------------------------------------------------------------------------ */

export default router;
