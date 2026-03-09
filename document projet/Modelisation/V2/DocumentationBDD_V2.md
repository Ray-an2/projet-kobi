# Documentation de la base de données Kobi

Ce document présente toutes les informations nécessaires à la compréhension de chaque table.

---

## `t_compte_cpt`
La table `t_compte_cpt` énumère tous les comptes utilisateurs.

- `cpt_id` (int) : Identifiant du compte (clé primaire) (ex : `1`)
- `cpt_mail` (VARCHAR(150)) : Adresse e-mail du compte (ex : `toto.pix@gmail.com`)
- `cpt_mdp` (VARCHAR(64)) : Mot de passe du compte (haché avec un sel en SHA2) (ex : `ahz4id5au7Uq5dzdevbf...`)

---

## `t_actualite_act`
La table `t_actualite_act` contient les informations nécessaires à une actualité.

- `act_id` (int) : Identifiant unique de l’actualité (ex : `2`)
- `act_titre` (VARCHAR(100)) : Titre de l’actualité (ex : `Changement de nom de carte1 en carte 2`)
- `act_des` (VARCHAR(350)) : Description de l’actualité (ex : `Le nom de 'carte1' a été modifié par 'David'. Elle s'appelle maintenant 'carte 2'.`)
- `act_etat` (CHAR(1)) : État de l’actualité (`P` : publiée, `C` : cachée)
- `act_date` (DATETIME) : Date de publication (ex : `2025-03-23 23:21:45`)
- `act_img` (VARCHAR(200)) : Lien vers l’image associée (ex : `~/Image/imagesecret1.png`)
- `cpt_id` (int) : Référence au compte ayant publié l’actualité (clé étrangère vers `t_compte_cpt`)

---

## `t_profil_pfl`
La table `t_profil_pfl` contient les informations personnelles associées à chaque compte.

- `cpt_id` (int) : Identifiant du compte (clé primaire et étrangère vers `t_compte_cpt`)
- `pfl_nom` (VARCHAR(80)) : Nom de l’utilisateur
- `pfl_prenom` (VARCHAR(80)) : Prénom de l’utilisateur
- `pfl_etat` (CHAR(1)) : État du profil (`A` : actif, `D` : désactivé)
- `pfl_date_C` (DATETIME) : Date de création du profil
- `pfl_date_V` (DATE) : Date de validité (suppression 2 ans après la dernière connexion)
- `pfl_role` (CHAR(1)) : Rôle de l’utilisateur (`P` : participant/bénévole, `a` : adhérent, `M` : membre du bureau, `G` : gestionnaire, `A` : administrateur, `V` : ancien membre du bureau)
- `pfl_img` (VARCHAR(200)) : Lien vers l’image de profil

---

## `t_role_rol`
Table associative entre `t_compte_cpt` et `t_tableau_tab`, permettant d’attribuer un rôle à un compte dans un tableau.

- `tab_id` (int) : Identifiant du tableau
- `cpt_id` (int) : Identifiant du compte
- `rol_role` (CHAR(1)) : Rôle du compte (`M` : membre, `A` : administrateur)

---

## `t_tableau_tab`
La table `t_tableau_tab` contient les tableaux créés par les utilisateurs.

- `tab_id` (int) : Identifiant du tableau
- `tab_titre` (VARCHAR(100)) : Titre du tableau
- `tab_des` (VARCHAR(350)) : Description du tableau
- `tab_couv` (VARCHAR(200)) : Image de couverture
- `tab_etat` (CHAR(1)) : État du tableau (`P` : publié, `D` : désactivé)

---

## `t_liste_lis`
Liste les colonnes (ou "listes") contenues dans un tableau. Un tableau contient plusieurs listes ; une liste contient plusieurs cartes.

- `lis_id` (int) : Identifiant de la liste
- `lis_titre` (VARCHAR(100)) : Titre de la liste
- `lis_etat` (CHAR(1)) : État (`P` : publié, `A` : archivé)
- `lis_ordre` (int) : Ordre d’affichage
- `tab_id` (int) : Référence au tableau parent

---

## `t_carte_car`
Contient toutes les cartes (tâches, fiches, objectifs...) associées à une liste.

- `car_id` (int) : Identifiant de la carte
- `car_nom` (VARCHAR(100)) : Nom de la carte
- `car_description` (VARCHAR(350)) : Description de la carte
- `car_archiver` (CHAR(1)) : Statut d’archivage (`P` : publié, `A` : archivé)
- `car_terminer` (CHAR(1)) : Statut de réalisation (`O` : terminé, `N` : en cours)
- `car_ordre` (int) : Ordre d’affichage
- `car_date_C` (DATETIME) : Date de création
- `car_dateDeb` (DATETIME) : Date de début
- `car_dateFin` (DATETIME) : Date d’échéance (avec alerte 24h avant)
- `car_couverture` (VARCHAR(200)) : Lien vers l’image de couverture ou palette de couleurs si nul
- `lis_id` (int) : Référence à la liste contenant cette carte

---

## `t_membre_mem`
Table associative entre `t_compte_cpt` et `t_carte_car`, pour affecter des membres à une carte.

- `car_id` (int) : Référence à la carte
- `cpt_id` (int) : Référence au compte
- `mem_date` (DATETIME) : Date d’ajout à la carte

---

## `t_ressource_res`
Associe des ressources (fichiers, liens, etc.) à une carte.

- `res_id` (int) : Identifiant de la ressource
- `res_nom` (VARCHAR(100)) : Nom de la ressource
- `res_lien` (VARCHAR(200)) : Lien vers la ressource
- `car_id` (int) : Référence à la carte associée

---

## `t_login_log`
Historique des actions (créations, modifications, suppressions) dans l’application.

- `log_id` (int) : Identifiant de l’activité
- `log_type` (VARCHAR(50)) : Type d’action (ex : création, modification, suppression, déplacement...)
- `log_dateheure` (DATETIME) : Date et heure de l’action
- `log_auteur` (VARCHAR(150)) : Auteur de l’action
- `log_description` (VARCHAR(400)) : Description textuelle
- `log_source` (VARCHAR(100)) : Source de la liste (ex : ancienne liste)
- `log_dest` (VARCHAR(100)) : Destination de la liste (ex : nouvelle liste)
- `log_etat` (CHAR(1)) : État (`P` : publié, `C` : caché)
- `tab_id` (int) : Référence au tableau concerné
- `car_id` (int) : Référence à la carte concernée

---

## `t_tag_tag`
Contient les étiquettes pouvant être ajoutées aux cartes.

- `tag_id` (int) : Identifiant de l’étiquette
- `tag_nom` (VARCHAR(100)) : Nom de l’étiquette (ex : `Urgent`)
- `tag_couleur` (VARCHAR(20)) : Couleur de l’étiquette (ex : `#ad5555`, `#b5da32`)

---

*Fichier créer le 9 mai à 13h par Brossard Rayan*

