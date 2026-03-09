import { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Carte as Carted } from '../data/type';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaPaperclip, FaClock } from 'react-icons/fa';
import '../css/tableau.css';
import '../css/global.css';

type CardProps = {
  card: Carted;
  listId: string;
  tabId: string;
  moveCarte?: (card: Carted, fromListId: string, toListId: string, Index: number) => void;
};

export function Card({ card, listId, tabId }: CardProps) {
  card.tags = card.tags ?? [];
  card.fichiers = card.fichiers ?? [];
  card.membres = card.membres ?? [];
  const [late, setLate] = useState(false);

  useEffect(() =>{
    if (!tabId || !card.id) return;
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token non trouvé");
      return;
    }
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tabId}/carte/${card.id}/check-limite`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      setLate(res.data === 1);
    })
    .catch((err) => {
      console.error("Erreur vérification date limite", err);
      setLate(false);
    });
  }, [tabId, card.id]);

  function formatDate(dateStr?: string | null): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return (
      date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    );
  }
  const [isEnd, setEnd] = useState(card.terminer ?? false);
  const dateLimite = useMemo(() => formatDate(card.dateLimite), [card.dateLimite]);

  const Terminer = async () => {
    const Etat = isEnd ? 'N' : 'O';
    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tabId}/carte/${card.id}/terminer`, 
        { car_terminer: Etat }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setEnd(Etat === 'O');
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'état terminé :", error);
    }
  };

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `card:${card.id}:${listId}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 999 : 'auto',
  };

  return (
    <div className="card" ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link to={`/tableau/${tabId}/carte/${card.id}`} key={card.id}>
        {card.coverImage && (
          <div
            className="card-cover"
            style={{ backgroundImage: `url(${card.coverImage})` }}
          />
        )}

        {card.tags.length > 0 && (
          <div className="tags">
            {card.tags.map((tag) => (
              <span
                key={tag.id}
                className="tag"
                style={{ backgroundColor: tag.couleur }}
                title={tag.nom}
              />
            ))}
          </div>
        )}
      </Link>

      <div className="card-title-btn">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={Terminer}
          title={isEnd ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
          className={`terminer-bouton ${isEnd ? 'termine' : ''}`}
        >
          {isEnd ? '✓' : ''}
        </button>
        <Link to={`/tableau/${tabId}/carte/${card.id}`} key={card.id}>
          <div className="card-title">
            <h3>{card.title}</h3>
          </div>
        </Link>
      </div>

      <div className="card-infos">
        {card.dateLimite && (
          <p
            className="card-date-limite"
            style={{
              backgroundColor: late ? '#fa968b' : 'transparent',
              borderRadius: late ? '5px' : '0',
              color: late ? 'white' : '#777',
              display: 'flex',
              alignItems: 'center',
              padding: late ? '2px 6px' : 0,
              fontSize: '0.85rem',
              marginTop: '4px',
              userSelect: 'none',
            }}
          >
            <FaClock style={{ marginRight: '6px', color: late ? 'white' : '#777' }} />
            {dateLimite}
          </p>
        )}
        {card.fichiers.length > 0 && (
          <div className="card-fichiers-icon">
            <FaPaperclip style={{marginRight: '6px'}}/>
            {card.fichiers.length}
          </div>
        )}
      </div>

      {card.membres.length > 0 && (
        <div className="membres-list-tab">
          {card.membres.slice(0, 4).map((m, index) => (
            <div
              key={m.cpt_id}
              title={`${m.pfl_prenom} ${m.pfl_nom}`}
              className="membre-wrapper"
              style={{ marginLeft: index === 0 ? 0 : -12, zIndex: 10 - index }}
            >
              {m.pfl_img ? (
                <img
                  src={m.pfl_img}
                  alt={`${m.pfl_prenom} ${m.pfl_nom}`}
                  className="membre-avatar"
                />
              ) : (
                <div className="membre-initiales">
                  {m.pfl_prenom[0]}
                  {m.pfl_nom[0]}
                </div>
              )}
            </div>
          ))}
          {card.membres.length > 4 && (
            <div
              className="membre-wrapper membre-plus"
              title={`+${card.membres.length - 4} membres`}
              style={{ marginLeft: -12 }}
            >
              +{card.membres.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function useCarte(tableauId?: string, carteId?: string) {
  const navigate = useNavigate();
  const [carte, setCarte] = useState<Carted | null>(null);
  const [newDesc, setNewDesc] = useState("");
  const [newDateDebut, setNewDateDebut] = useState("");
  const [newDateLimite, setNewDateLimite] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEnd, setEnd] = useState(carte?.terminer ?? false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  const [listes, setListes] = useState<{ id: string, nom: string }[]>([]);
  const [listeIdCible, setListeIdCible] = useState("");
  const [showMove, setShowMove] = useState(false);
  const [showModalMembres, setShowModalMembres] = useState(false);
  const [membresTab, setMembresTab] = useState<any[]>([]);
  const [tagsTab, setTagsTab] = useState<any[]>([]);
  const [addTagModal, setAddTagModal] = useState(false);
  const [editTagModal, setEditTagModal] = useState(false);

  const [tagNom, setTagNom] = useState('');
  const [tagCouleur, setTagCouleur] = useState('');
  const [showModalTags, setShowModalTags] = useState(false);
  const [userRole, setRole] = useState<string | null>(null);

  function chargerCarte() {
    if (!tableauId || !carteId) return;
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token non trouvé");
      return;
    }

    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/carte/${carteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const rawData = res.data;
        if (!rawData || Object.keys(rawData).length === 0) {
          navigate("/tableau");
          return;
        }

        const base = rawData.base;
        const carteFormatee: Carted = {
          id: carteId,
          title: base.car_nom,
          description: base.car_description,
          coverImage: base.car_couverture,
          tableauNom: base.tab_titre,
          listeNom: base.lis_titre,
          dateDebut: base.car_date_debut,
          dateLimite: base.car_date_fin,
          membres: rawData.membres.map((m: any) => ({
            cpt_id: m.cpt_id,
            cpt_mail: m.cpt_mail,
            pfl_nom: m.pfl_nom,
            pfl_prenom: m.pfl_prenom,
            pfl_img: m.pfl_img,
          })),
          tags: rawData.tags.map((t: any) => ({
            id: t.tag_id,
            nom: t.tag_nom,
            couleur: t.tag_couleur,
          })),
          fichiers: rawData.ressources.map((f: any) => ({
            id: f.res_id,
            nom: f.res_nom,
            url: f.res_lien,
          })),
          activites: rawData.activites.map((a: any) => ({
            id: a.log_id,
            auteur: a.log_auteur,
            texte: a.log_description,
            date: a.log_date,
          })),
          ordre: 1,
        };
        setCarte(carteFormatee);
        setNewDesc(carteFormatee.description || "");
        setNewDateDebut(carteFormatee.dateDebut || "");
        setNewDateLimite(carteFormatee.dateLimite || "");
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur récupération carte", err);
        setCarte(null);
        setLoading(false);
        navigate("/tableau");
      });
  }

  useEffect(() => {
    chargerCarte();
  }, [tableauId, carteId]);

  // Role
  useEffect(() => {
    if (!tableauId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/role`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const result = res.data?.[0]?.rol_role;
        setRole(result || null);
      })
      .catch((err) => {
        console.error("Erreur chargement role", err);
        setRole(null);
      });
  }, [tableauId]);

  // Menu déroulant
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuOpen &&
        menu.current &&
        !menu.current.contains(event.target as Node) &&
        !menuButton.current?.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);


  useEffect(() => {
    if (!tableauId) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      const listesFormatees = res.data.map((l: any) => ({
        id: l.lis_id.toString(),
        nom: l.lis_titre,
      }));
      setListes(listesFormatees);
    })
    .catch((err) => console.error("Erreur chargement listes", err));
  }, [tableauId]);


  useEffect(() => {
    if (carte) setEnd(carte.terminer ?? false);
  }, [carte]);

  // Déplacement
  const handleMove = async () => {
    if (!carte || !listeIdCible) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token non trouvé");

      // Récupérer le nombre de cartes dans la liste cible pour déterminer le dernier ordre
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/list/${listeIdCible}/cartes/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const nombreCartes = res.data.count || 0;

      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/carte/${carte.id}/deplacer`, {
        lis_id: listeIdCible,
        car_ordre: nombreCartes,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate(`/tableau/${tableauId}`);
    } catch (err) {
      console.error("Erreur déplacement carte", err);
    }
  };

  // Terminer une carte
  const terminerCarte = async () => {
    if (!carte || !tableauId) return;
    const Etat = isEnd ? 'N' : 'O';

    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/carte/${carte.id}/terminer`, 
        { car_terminer: Etat }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setEnd(Etat === 'O');
      setCarte((prev) => prev ? { ...prev, terminer: Etat === 'O' } : prev);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'état terminé :", error);
    }
  };

  // Archivage d'une carte
  function archiverCarte(car_archiver: "A") {
    if (!carte || !tableauId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .put(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/carte/${carte.id}/archiver`, {
        car_archiver,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        // Redirection
        navigate(`/tableau/${tableauId}`);
      })
      .catch((err) => {
        console.error("Erreur lors de l'archivage :", err);
      });
  }

  // Mettre à jour la description
  function updateDescription() {
    if (!carte) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .put(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/carte/${carte.id}/modifier`, {
        field: "car_description",
        value: newDesc,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setCarte((prev) => (prev ? { ...prev, description: newDesc } : prev));
      });
  }
  function Datetime(dateStr: string): string {
    const [datePart, timePart] = dateStr.split("T");
    const [heur, minute] = timePart.split(":");
    return `${datePart} ${heur}:${minute}:00`;
  }

  
  // Mettre à jour les dates
  function updateDates() {
    if (!carte) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const axiosConfig = {
      headers: { Authorization: `Bearer ${token}` },
    };

    const requests = [];

    if (newDateDebut && newDateDebut.trim() !== "") {
      console.log("Mise à jour date début :", newDateDebut);
      requests.push(
        axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/carte/${carte.id}/modifier`,
          {
            field: "car_date_debut",
            value: Datetime(newDateDebut),
          },
          axiosConfig
        )
      );
    }

    if (newDateLimite && newDateLimite.trim() !== "") {
      console.log("Mise à jour date fin :", newDateLimite);
      requests.push(
        axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/carte/${carte.id}/modifier`,
          {
            field: "car_date_fin",
            value: Datetime(newDateLimite),
          },
          axiosConfig
        )
      );
    }

    Promise.all(requests)
      .then(() => {
        setCarte((prev) =>
          prev
            ? {
                ...prev,
                dateDebut: newDateDebut || null,
                dateLimite: newDateLimite || null,
              }
            : prev
        );
      })
      .catch((error) => {
        console.error("Erreur lors de la mise à jour des dates :", error);
      });
  }

  // Affichage des membres du tableau
  function chargerMembres() {
    if (!tableauId || !carteId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/membres`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      setMembresTab(res.data);
      setShowModalMembres(true);
    })
    .catch((err) => {
      console.error("Erreur lors du chargement des membres du tableau :", err);
    });
  }
  // Ajout ou retrait du membre de la carte
  async function membre(cptId: number) {
  if (!carte || !tableauId) return;
  const token = localStorage.getItem("token");
  if (!token) return;

  const membre = carte.membres.some((m) => m.cpt_id === cptId);

  try {
    if (membre) {
      // Retirer
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/carte/${carte.id}/membre/${cptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } else {
      // Ajouter
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/carte/${carte.id}/membre`, {
        cpt_id: cptId
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    // Recharger les données de la carte
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/carte/${carte.id}/membre`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const updated = res.data.map((m: any) => ({
      cpt_id: m.cpt_id,
      pfl_nom: m.pfl_nom,
      pfl_prenom: m.pfl_prenom,
      pfl_img: m.pfl_img,
    }));

    setCarte((prev) => prev ? { ...prev, membres: updated } : prev);
  } catch (err) {
    console.error("Erreur ajout/retrait membre :", err);
  }
}

// Affichages des tag existant
function chargerTags() {
  if (!tableauId || !carte) return;
  const token = localStorage.getItem("token");
  if (!token) return;

  axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/tag`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then((res) => {
    setTagsTab(res.data);
    setShowModalTags(true);
  })
  .catch((err) => {
    console.error("Erreur lors du chargement des tags :", err);
  });
}

// Ajout ou retrait de tag à la carte
async function tag(tagId: number) {
  if (!carte || !tableauId) return;
  const token = localStorage.getItem("token");
  if (!token) return;

  const present = carte.tags.some((t) => t.id === tagId);

  try {
    if (present) {
      // Retirer
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/carte/${carte.id}/tag/${tagId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } else {
      // Ajouter
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/carte/${carte.id}/tag`, {
        tag_id: tagId,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    // Rechargement des tags de la carte
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/carte/${carte.id}/tag`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const tags = res.data.map((t: any) => ({
      id: t.tag_id,
      nom: t.tag_nom,
      couleur: t.tag_couleur,
    }));

    setCarte((prev) => prev ? { ...prev, tags: tags } : prev);
  } catch (err) {
    console.error("Erreur ajout/retrait tag :", err);
  }
}

  async function delCarte() {
    if (!carte || !tableauId) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token non trouvé");

      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/carte/${carte.id}/supprimer`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Redirection après suppression
      navigate(`/tableau/${tableauId}`);
    } catch (err) {
      console.error("Erreur lors de la suppression de la carte :", err);
    }
  }

  async function creerTag() {
    if (!tableauId) return;
    if (!tagNom.trim() || !/^#[0-9A-Fa-f]{6}$/.test(tagCouleur)) {
      alert("Nom ou couleur invalide");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token || !tableauId) return;

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/tag`, {
        tag_nom: tagNom,
        tag_couleur: tagCouleur,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddTagModal(false);
      setTagNom('');
      setTagCouleur('');
      chargerTags();
    } catch (err) {
      console.error("Erreur lors de la création du tag :", err);
    }
  }

  async function updateTag (id: string, nom: string, couleur: string) {
    if (!tableauId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/tag`,
        { id, nom, couleur },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      chargerTags();
      setEditTagModal(false);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du tag :", err);
    }
  };

  async function delTag(tagId: string) {
  const token = localStorage.getItem("token");
  if (!token || !tableauId) return;
  try {
    await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/tag/${tagId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    chargerTags();
  } catch (err) {
    console.error("Erreur suppression tag :", err);
  }
}

  function getColor(Color: string): string {
    const hex = Color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance < 128 ? "#f4f5ef" : "black";
  }

  function formatDateTime(dateStr?: string | null): string {
    if (!dateStr) return "Non défini";

    const iso = dateStr.split("T");
    if (iso.length < 2) return "Non défini";

    const [datePart, timePart] = iso;
    const [annee, mois, jour] = datePart.split("-");
    const [heure, minute] = timePart.split(":");

    return `${jour}-${mois}-${annee} à ${heure}:${minute}`;
  }

  return {
    chargerCarte,
    carte,
    loading,
    menu,
    setMenuOpen,
    menuOpen,
    menuButton,
    newDesc,
    setNewDesc,
    userRole,
    newDateDebut,
    setNewDateDebut,
    newDateLimite,
    setNewDateLimite,
    updateDescription,
    updateDates,
    chargerMembres,
    showModalMembres,
    setShowModalMembres,
    membre,
    tag,
    chargerTags,
    tagsTab,
    showModalTags,
    setShowModalTags,
    addTagModal,
    setAddTagModal,
    tagNom,
    setTagNom,
    tagCouleur,
    setTagCouleur,
    editTagModal,
    setEditTagModal,
    creerTag,
    updateTag,
    delTag,
    getColor,
    delCarte,
    membresTab,
    listes,
    listeIdCible,
    setListeIdCible,
    handleMove,
    showMove,
    setShowMove,
    terminerCarte,
    archiverCarte,
    isEnd,
    formatDateTime,
  };
}