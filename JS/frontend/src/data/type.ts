export type Log = {
  log_id: number;
  log_auteur: string
  log_description: string;
  log_type: string;
  log_date: string;
};

export type Carte = {
    id: string;
    title: string;
    description: string | null;
    archived?: boolean;
    terminer?: boolean;
    ordre: number;
    coverImage: string | null;
    tableauNom: string;
    listeNom: string;
    dateDebut: string | null;
    dateLimite: string | null;
    membres: { cpt_id: number; cpt_mail: string, pfl_nom: string, pfl_prenom: string, pfl_img: string }[];
    tags: { id: number; nom: string, couleur: string}[];
    fichiers: { id: number; nom: string; url: string }[];
    activites: { id: number; auteur: string, texte: string; date: string }[];
  };

  export type Liste = {
    id: string;
    title: string;
    cards: Carte[];
    archived?: boolean;
    ordre: number
  };
  
  export type Tableau = {
    id: string;
    title: string;
    description: string;
    coverImage: string | null;
    lists: Liste[];
    fermer?: boolean;
  };
  