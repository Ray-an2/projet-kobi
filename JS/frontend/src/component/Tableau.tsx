import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import List from './Liste';
import { Liste, Carte, Tableau } from '../data/type';

const SortableList: React.FC<{
  list: Liste;
  tabId: string;
  moveCarte: (card: Carte, fromListId: string, toListId: string, newIndex: number) => void;
  ajouterCarte: (listId: string, imageUrl?: string, titre?: string) => void;
  showArchive: boolean;
  dropIndicator?: number | null;
  setTableau: React.Dispatch<React.SetStateAction<Tableau | null>>;
  tableau: Tableau
  moveList: (activeId: string, overId: string) => void;
  role: string | null;
}> = ({ list, tabId, moveCarte, ajouterCarte, showArchive, dropIndicator, setTableau, tableau, moveList, role }) => {
  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({ id: `list:${list.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <List
        list={list}
        tabId={tabId}
        moveCarte={moveCarte}
        ajouterCarte={(listId: string, imageUrl?: string, titre?: string) => ajouterCarte(listId, imageUrl, titre)}
        afficherArchives={showArchive}
        dropIndicator={dropIndicator}
        setTableau={setTableau}
        tableau={tableau}
        moveList={moveList}
        role={role}
      />
    </div>
  );
};


export function useTableau() {
  const { id } = useParams();
  const navigate = useNavigate();
  const menu = useRef<HTMLDivElement>(null);

  const [tableau, setTableau] = useState<Tableau | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirigerAuto, setRedirigerAuto] = useState(false);
  const [ferme, setFerme] = useState(false);
  const [tableauInexistant, setTableauInexistant] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [popupListe, setPopupListe] = useState(false);
  const [titreListe, setTitreListe] = useState('');
  const [count, setCount] = useState(3);
  const [showArchive, setShowArchive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLDivElement>(null);
  const [activeDragItem, setActiveDragItem] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null)
  const [dropIndicator, setDropIndicator] = useState<{listId: string, index: number} | null>(null);

  const renderCountdown = () => `${count} seconde${count > 1 ? 's' : ''}`;
  
  const fetchTab = async (load: boolean = true): Promise<void> => {
    if (!id) return;

    if (load) setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    try {
      const start = Date.now();
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = res.data;
      const first = data[0];
      if (!first) {
        setTableauInexistant(true);
        setLoading(false);
        return;
      }

      setRole(first.rol_role);
      setFerme(first.tab_etat === 'D');

      if (first.tab_etat === 'D' && first.rol_role === 'M') {
        setRedirigerAuto(true);
        setLoading(false);
        return;
      }

      const listesMap = new Map<string, Liste>();
      for (const item of data) {
        if (!item.lis_id) continue;
        const listId = item.lis_id.toString();
        if (!listesMap.has(listId)) {
          listesMap.set(listId, {
            id: listId,
            title: item.lis_titre,
            archived: item.lis_etat === "A",
            cards: [],
            ordre: item.lis_ordre,
          });
        }

        if (item.car_id) {
          listesMap.get(listId)!.cards.push({
            id: item.car_id.toString(),
            title: item.car_nom,
            description: item.car_description,
            archived: item.car_archiver === "A",
            terminer: item.car_terminer === 'O',
            ordre: item.car_ordre,
            coverImage: item.car_couverture,
            tableauNom: '',
            listeNom: '',
            dateDebut: item.car_date_debut,
            dateLimite: item.car_date_fin,
            membres: [],
            tags: [],
            fichiers: [],
            activites: [],
          });
        }
      }

      const formatted: Tableau = {
        id: first.tab_id.toString(),
        title: first.tab_titre,
        description: first.tab_des,
        coverImage: first.tab_couv || null,
        fermer: false,
        lists: Array.from(listesMap.values()).sort((a, b) => a.ordre - b.ordre),
      };

      const detailsRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${id}/cartes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { tags, ressources, membres } = detailsRes.data;

      // Organisation des données par carte
      const tagsParCarte = new Map<string, any[]>();
      for (const tag of tags) {
        const carId = tag.car_id.toString();
        if (!tagsParCarte.has(carId)) tagsParCarte.set(carId, []);
        tagsParCarte.get(carId)!.push({ id: tag.tag_id, nom: tag.tag_nom, couleur: tag.tag_couleur });
      }
      

      const resParCarte = new Map<string, any[]>();
      for (const res of ressources) {
        const carId = res.car_id.toString();
        if (!resParCarte.has(carId)) resParCarte.set(carId, []);
        resParCarte.get(carId)!.push({ id: res.res_id, nom: res.res_nom, url: res.res_lien });
      }

      const membresParCarte = new Map<string, any[]>();
      for (const mem of membres) {
        const carId = mem.car_id.toString();
        if (!membresParCarte.has(carId)) membresParCarte.set(carId, []);
        membresParCarte.get(carId)!.push({ cpt_id: mem.cpt_id, pfl_nom: mem.pfl_nom, pfl_prenom: mem.pfl_prenom, pfl_img: mem.pfl_img });
      }

      // Injection des tag, fichier et membres dans les cartes existantes
      formatted.lists.forEach(list => {
        list.cards.forEach(card => {
          const cardId = card.id;
          card.tags = tagsParCarte.get(cardId) || [];
          card.fichiers = resParCarte.get(cardId) || [];
          card.membres = membresParCarte.get(cardId) || [];
        });
      });

      const delay = Math.max(0, 1000 - (Date.now() - start));
      setTimeout(() => {
        setTableau({ ...formatted});
        setLoading(false);
      }, delay);

    } catch (error: any) {
      setTimeout(() => {
        if (error.response?.status === 403) {
          setUnauthorized(true);
        } else {
          setTableauInexistant(true);
        }
        setLoading(false);
      }, 1000);
    }
  };

  useEffect(() => {
    fetchTab();
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        menu.current &&
        !menu.current.contains(target) &&
        menuButton.current &&
        !menuButton.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [id]);

  useEffect(() => {
    if ((redirigerAuto || tableauInexistant || unauthorized) && count > 0) {
      const timer = setTimeout(() => setCount(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (count === 0) {
      navigate('/tableau');
    }
  }, [redirigerAuto, tableauInexistant, unauthorized, count, navigate]);

  function refresh(cond: boolean) {
    fetchTab(cond);
  }

  const ajouterListe = () => {
    const titre = titreListe.trim();
    if (!titre || !tableau) {
      alert("Le titre de la liste est requis");
      return;
    }

    const token = localStorage.getItem("token");

    axios.post(`${import.meta.env.VITE_BACKEND_URL}/list`, {
      lis_titre: titre,
      tab_id: tableau.id,
      lis_ordre: tableau.lists.length + 1
    },{
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then(res => {
      const nouvelleListe: Liste = {
        id: res.data.id.toString(),
        title: titre,
        cards: [],
        archived: false,
        ordre: tableau.lists.length 
      };
      setTableau({ ...tableau, lists: [...tableau.lists, nouvelleListe] });
      setPopupListe(false);
      setTitreListe('');
    }).catch(() => {
      alert("Erreur lors de la création de la liste !")
    });
  };

  const ajouterCarte = (listId: string, imageUrl?: string, titre?: string) => {

    if (!titre || !titre.trim() || !tableau) return;
    axios.post(`${import.meta.env.VITE_BACKEND_URL}/tableau/${id}/carte`, {
      car_nom: titre,
      car_description: null,
      car_ordre: tableau.lists.find(l => l.id === listId)?.cards.length ?? 1,
      car_date_debut: null,
      car_date_fin: null,
      car_couverture: imageUrl ?? null,
      lis_id: listId
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }).then(res => {
      const newCard: Carte = {
        id: res.data.car_id.toString(),
        title: titre,
        description: null,
        archived: false,
        ordre: tableau.lists.find(l => l.id === listId)?.cards.length ?? 1,
        coverImage: res.data.car_couverture ?? imageUrl ?? null,
        tableauNom: '',
        listeNom: '',
        dateDebut: null,
        dateLimite: null,
        membres: [],
        tags: [],
        fichiers: [],
        activites: [],
      };

      const updatedLists = tableau.lists.map(list =>
        list.id === listId ? { ...list, cards: [...list.cards, newCard] } : list
      );
      setTableau({ ...tableau, lists: updatedLists });
    });
  };

  async function moveCarte(card: Carte, fromListId: string, toListId: string, newIndex: number): Promise<void> {
  if (!tableau) return Promise.reject();

  const previousState = JSON.parse(JSON.stringify(tableau));
  const fromList = tableau.lists.find(l => l.id === fromListId);
  const toList = tableau.lists.find(l => l.id === toListId);
  if (!fromList || !toList) return Promise.reject();

  // Mise à jour locale
  let newLists;
  if (fromListId === toListId) {
    const newCards = [...fromList.cards];
    const oldIndex = newCards.findIndex(c => c.id === card.id);
    if (oldIndex === -1) return Promise.reject();

    newCards.splice(oldIndex, 1);
    newCards.splice(newIndex, 0, card);
    newCards.forEach((c, i) => (c.ordre = i));

    newLists = tableau.lists.map(l =>
      l.id === fromListId ? { ...l, cards: newCards } : l
    );
  } else {
    const newFromCards = fromList.cards.filter(c => c.id !== card.id);
    const newToCards = [...toList.cards];
    const safeIndex = Math.min(newIndex, newToCards.length);
    newToCards.splice(safeIndex, 0, card);
    newFromCards.forEach((c, i) => (c.ordre = i));
    newToCards.forEach((c, i) => (c.ordre = i));

    newLists = tableau.lists.map(l => {
      if (l.id === fromListId) return { ...l, cards: newFromCards };
      if (l.id === toListId) return { ...l, cards: newToCards };
      return l;
    });
  }

  setTableau({ ...tableau, lists: newLists });

  // Mise à jour serveur
  const url = fromListId === toListId
    ? `${import.meta.env.VITE_BACKEND_URL}/tableau/${id}/list/${toListId}/ordre-cartes`
    : `${import.meta.env.VITE_BACKEND_URL}/tableau/${id}/carte/${card.id}/deplacer`;

  const data = fromListId === toListId
    ? { car_ordre: newLists.find(l => l.id === toListId)!.cards.map(c => c.id) }
    : { lis_id: toListId, car_ordre: newIndex };

  await axios.put(url, data, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  })
  .catch(err => {
    console.error("Erreur lors de la mise à jour de l'ordre des cartes :", err.response?.data || err.message);
    setTableau(previousState);
    return Promise.reject(err);
  });
}


  const parseDragId = (id: string) => {
    const [type, itemId, listId] = id.split(':');
    return { type, itemId, listId };
  };

  const moveList = (activeId: string, overId: string) => {
    if (!tableau) return;

    const oldIndex = tableau.lists.findIndex(l => l.id === activeId);
    const newIndex = tableau.lists.findIndex(l => l.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const newLists = arrayMove(tableau.lists, oldIndex, newIndex);
    setTableau({ ...tableau, lists: newLists });

    const lisOrdres = newLists.map((l, index) => ({
      lis_id: l.id,
      lis_ordre: index + 1,
    }));

    axios.put(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableau.id}/ordre-listes`, {
      lis_ordre: lisOrdres,
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).catch(console.error);
  };

  const moveCardToList = (activeId: string, fromListId: string, toListId: string, dropIndex: number) => {
    if (!tableau) return;

    const fromList = tableau.lists.find(l => l.id === fromListId);
    const toList = tableau.lists.find(l => l.id === toListId);
    if (!fromList || !toList) return;

    const card = fromList.cards.find(c => c.id === activeId);
    if (!card) return;
    const index = Math.max(0, Math.min(dropIndex, toList.cards.length));
    moveCarte(card, fromListId, toListId, index);
  };

  const moveCardToCard = async (
    activeId: string,
    activeListId: string,
    overId: string,
    overListId: string
  ) => {
    if (!tableau) return;

    const fromList = tableau.lists.find(l => l.id === activeListId);
    const toList = tableau.lists.find(l => l.id === overListId);
    if (!fromList || !toList) return;

    // Cas carte déplacée sur elle-même mais dans une autre liste : déplacement vers fin
    if (activeId === overId && activeListId !== overListId) {
      const card = fromList.cards.find(c => c.id === activeId);
      if (!card) return;

      const targetIndex = toList.cards.length;
      await moveCarte(card, activeListId, overListId, targetIndex);
      return;
    }

    if (activeListId === overListId) {
      // Réorganisation dans la même liste
      const list = toList;
      const fromIndex = list.cards.findIndex(c => c.id === activeId);
      const toIndex = list.cards.findIndex(c => c.id === overId);
      if (fromIndex === -1 || toIndex === -1) return;

      const newCards = [...list.cards];
      const [movedCard] = newCards.splice(fromIndex, 1);
      newCards.splice(toIndex, 0, movedCard);

      const newLists = tableau.lists.map(l =>
        l.id === activeListId ? { ...l, cards: newCards } : l
      );
      setTableau({ ...tableau, lists: newLists });

      axios.put(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableau.id}/list/${activeListId}/ordre-cartes`, {
        car_ordre: newCards.map(c => c.id),
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }).catch(console.error);
    } else {
      // Déplacement entre listes différentes (carte sur carte)
      const card = fromList.cards.find(c => c.id === activeId);
      if (!card) return;

      const targetIndex = toList.cards.findIndex(c => c.id === overId);
      if (targetIndex === -1) return;

      // On retire la carte de sa liste d’origine
      const newFromCards = fromList.cards.filter(c => c.id !== activeId);

      // On insère la carte dans la nouvelle liste à la bonne position
      const newToCards = [...toList.cards];
      newToCards.splice(targetIndex, 0, card);

      // On construit le nouveau tableau à afficher
      const newLists = tableau.lists.map(l => {
        if (l.id === fromList.id) return { ...l, cards: newFromCards };
        if (l.id === toList.id) return { ...l, cards: newToCards };
        return l;
      });
      setTableau({ ...tableau, lists: newLists });

      // On envoie l’ordre **entier** des cartes de la liste destination
      axios.put(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableau.id}/list/${toList.id}/ordre-cartes`, {
        car_ordre: newToCards.map(c => c.id),
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }).catch(console.error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!tableau) return;

    const { active, over } = event;
    if (!active || !over || active.id === over.id) {
      return;
    }

    const activeData = parseDragId(active.id.toString());
    const overData = parseDragId(over.id.toString());

    if (
      activeData.type === 'card' &&
      overData.type === 'card' &&
      activeData.itemId === overData.itemId &&
      activeData.listId === overData.listId
    ) {
      setActiveDragItem(null);
      return;
    }

    if (activeData.type === 'list' && overData.type === 'list') {
      moveList(activeData.itemId, overData.itemId);
      setActiveDragItem(null);
      return;
    }

    if (activeData.type === 'card' && overData.type === 'list') {
      const dropIndex = (dropIndicator?.listId === overData.itemId)
        ? dropIndicator.index
        : tableau.lists.find(l => l.id === overData.itemId)?.cards.length ?? 0;

      moveCardToList(activeData.itemId, activeData.listId, overData.itemId, dropIndex);
      setActiveDragItem(null);
      setDropIndicator(null);
      return;
    }


    if (activeData.type === 'card' && overData.type === 'card') {
      await moveCardToCard(activeData.itemId, activeData.listId, overData.itemId, overData.listId);
      setActiveDragItem(null);
      return;
    }

    setActiveDragItem(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!tableau) return;

    const { active, over } = event;
    if (!active || !over) {
      setDropIndicator(null);
      return;
    }
    
    const overData = parseDragId(over.id.toString());

    if (overData.type === 'card') {
      // trouver l'index de la carte sur laquelle on survole
      const list = tableau.lists.find(l => l.id === overData.listId);
      if (!list) {
        setDropIndicator(null);
        return;
      }

      const overIndex = list.cards.findIndex(c => c.id === overData.itemId);
      if (overIndex === -1) {
        setDropIndicator(null);
        return;
      }

      setDropIndicator({ listId: overData.listId, index: overIndex });
    } else if (overData.type === 'list') {
      // quand on survole une liste vide ou la liste elle-même, drop à la fin
      const list = tableau.lists.find(l => l.id === overData.itemId);
      if (!list) {
        setDropIndicator(null);
        return;
      }

      setDropIndicator({ listId: list.id, index: list.cards.length });
    } else {
      setDropIndicator(null);
    }
  };

const delTab = async () => {
  if (role === 'M') return;

  try {
    await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/tableau/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    navigate('/tableau');
  } catch (err) {
    console.error(err);
  }
};

const fermerTab = async () => {
  if (role === 'M') return;

  try {
    await axios.put(`${import.meta.env.VITE_BACKEND_URL}/tableau/${id}/fermer`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setFerme(true);
  } catch (err) {
    console.error(err);
  }
};

const openTab = async () => {
  if (role === 'M') return;

  try {
    await axios.put(`${import.meta.env.VITE_BACKEND_URL}/tableau/${id}/ouvrir`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setFerme(false);
  } catch (err) {
    console.error(err);
  }
};

  return {
    tableau,
    setTableau,
    loading,
    ferme,
    tableauInexistant,
    redirigerAuto,
    count,
    renderCountdown,
    showArchive,
    setShowArchive,
    popupListe,
    setPopupListe,
    titreListe,
    setTitreListe,
    ajouterListe,
    ajouterCarte,
    moveCarte,
    handleDragEnd,
    handleDragOver,
    moveList,
    menuOpen,
    setMenuOpen,
    menu,
    menuButton,
    delTab,
    fermerTab,
    openTab,
    refresh,
    role,
    activeDragItem,
    unauthorized,
    SortableList,
    dropIndicator
  };
}