import { useState, useRef, useEffect } from 'react';
import { FaImage } from 'react-icons/fa';
import { Liste, Carte, Tableau } from '../data/type';
import { Card } from './Carte';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import '../css/list.css';
import axios from 'axios';

type Props = {
  list: Liste;
  tabId: string;
  moveCarte: (card: Carte, fromListId: string, toListId: string, Index: number) => void;
  ajouterCarte: (listId: string, imageUrl?: string, titre?: string) => void;
  afficherArchives: boolean;
  dropIndicator?: number | null;
  setTableau: React.Dispatch<React.SetStateAction<Tableau | null>>;
  tableau: Tableau;
  moveList: (activeId: string, overId: string) => void;
  role: string | null;
};

export default function List({ list, tabId, moveCarte, ajouterCarte, afficherArchives, dropIndicator, setTableau, tableau, moveList, role }: Props) {
  const cartesAffichees = (afficherArchives
    ? list.cards.filter((card) => card.archived)
    : list.cards.filter((card) => !card.archived)
).sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

  const [menuOuvert, setMenuOuvert] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [popupOuvert, setPopupOuvert] = useState(false);
  const [popupTitreOuvert, setPopupTitreOuvert] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const [titre, setTitre] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [typeImage, setTypeImage] = useState<'url' | 'local'>('url');
  const [trans, setTrans] = useState(true);
  const [isEnd, setEnd]= useState(list.archived ?? false);
  const [edition, setEdition] = useState(false);
  const [newTitre, setNewTitre] = useState(list.title);
  const moveModalRef = useRef<HTMLDivElement>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showMoveListModal, setShowMoveListModal] = useState(false);
  const [listeIdCible, setListeIdCible] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (menuOuvert && menuRef.current && !menuRef.current.contains(target)) {
        setMenuOuvert(false);
      }

      // Reste inchangé
      if (popupRef.current && !popupRef.current.contains(target)) {
        fermerPopupImage();
        fermerPopupTitre();
      }
      if (moveModalRef.current && !moveModalRef.current.contains(target)) {
        setShowMoveModal(false);
        setListeIdCible('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOuvert, popupOuvert, popupTitreOuvert]);

  const editionTitre = async () => {
    const titreTrim = newTitre.trim();
    if (!titreTrim) {
      alert("Le titre ne peut pas être vide.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tabId}/list/${list.id}`, {
        lis_titre: titreTrim,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      list.title = titreTrim;
      setEdition(false);
    } catch (error) {
      console.error("Erreur mise à jour titre :", error);
      alert("Une erreur est survenue.");
    }
  };

const deplacerCarte = async (carte: Carte, listeIdCible: string, tabId: string) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token non trouvé");

    const res = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/tableau/${tabId}/list/${listeIdCible}/cartes/count`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const nombreCartes = res.data.count || 0;

    await axios.put(
      `${import.meta.env.VITE_BACKEND_URL}/tableau/${tabId}/carte/${carte.id}/deplacer`,
      {
        lis_id: listeIdCible,
        car_ordre: nombreCartes,
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
  } catch (err) {
    console.error(`Erreur lors du déplacement de la carte ${carte.id}`, err);
  }
};

const deplacerToutesLesCartes = async () => {
  if (!listeIdCible) return;

  for (const carte of cartesAffichees) {
    await deplacerCarte(carte, listeIdCible, tabId);
  }

  setShowMoveModal(false);
  setListeIdCible('');
};

  const archiverCartes = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token non trouvé");

    // Filtrer les cartes non archivé
    const cartesArchiver = list.cards.filter(card => !card.archived);
    await Promise.all(
      cartesArchiver.map((carte) =>
        axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/tableau/${tabId}/carte/${carte.id}/archiver`,
          { car_archiver: "A" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      )
    );
    setTableau((prev) => {
      if (!prev) return prev;
      return {...prev,lists: prev.lists.map((l) =>
          l.id === list.id? {
            ...l, cards: l.cards.map((c) => !c.archived ? { ...c, archived: true } : c),
            }
          : l
        ),
      };
    });

  } catch (error) {
    console.error("Erreur lors de l'archivage des cartes :", error);
  }
};

  const ouvrirTitre = () => {
    setTitre('');
    setPopupTitreOuvert(true);
  };

  const fermerPopupTitre = () => {
    setPopupTitreOuvert(false);
    setTitre('');
  };

  const ajouterCarteTitre = () => {
    if (!titre.trim()) {
      alert("Le titre est requis.");
      return;
    }

    ajouterCarte(list.id, undefined, titre);
    fermerPopupTitre();
  };

  const ouvrirPopupImage = () => setPopupOuvert(true);
    const fermerPopupImage = () => {
      setPopupOuvert(false);
      setImageUrl('');
      setImageFile(null);
    };

  const ajouterImage = async () => {
    const token = localStorage.getItem('token');
    let finalImageUrl = imageUrl;

    if (typeImage === 'local' && imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);

      try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/upload`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        finalImageUrl = response.data.url;
      } catch (error) {
        console.error('Erreur upload image :', error);
        return;
      }
    }

    if (!finalImageUrl || !finalImageUrl.trim()) {
      alert("Veuillez fournir une image valide.");
      return;
    }

    if (!titre.trim()) {
      alert("Le titre est requis.");
      return;
    }

    ajouterCarte(list.id, finalImageUrl, titre);
    fermerPopupImage();
  };

  const archiver = async () => {
    const Etat = isEnd ? 'P' : 'A';
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/tableau/${tabId}/list/archiver/${list.id}`,
        { lis_etat: Etat },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setEnd(Etat === 'A');

      if (Etat === 'A') {
        setTimeout(() => setTrans(false), 400);

        setTableau((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            lists: prev.lists.map((l) =>
              l.id === list.id ? { ...l, archived: true } : l
            ),
          };
        });
      } else {
        setTrans(true);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'état de la liste :", error);
    }
  };

  const supprimer = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token non trouvé");

      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/tableau/${tabId}/list/${list.id}/supprimer`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Mettre à jour le tableau localement pour enlever la liste supprimée
      setTableau((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lists: prev.lists.filter((l) => l.id !== list.id),
        };
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de la liste :", error);
      alert("Une erreur est survenue lors de la suppression.");
    }
  };

  return (
    <div>
      {popupTitreOuvert && (
        <div className="popup-overlay" onPointerDown={(e) => e.stopPropagation()}>
          <div className="popup-content" ref={popupRef}>
            <h3>Créer une carte</h3>
            <input
              type="text"
              placeholder="Titre*"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
            />
            <div className="popup-actions">
              <button className="icon-btn" onClick={ajouterCarteTitre}>Ajouter</button>
              <button className="icon-btn" onClick={fermerPopupTitre}>Annuler</button>
            </div>
            <p><i>* Champ obligatoire</i></p>
          </div>
        </div>
      )}
      {popupOuvert && (
        <div className="popup-overlay" onPointerDown={(e) => {
            e.stopPropagation();
          }}>
          <div className="popup-content" ref={popupRef}>
            <h3>Créer une carte à partir d'une image</h3>
            <input 
              type="text" 
              placeholder="Titre*" 
              value={titre} 
              onChange={e => 
              setTitre(e.target.value)} />
            <div className="image-selector">
              <label>
                <input
                  type="radio"
                  name="imageType"
                  value="url"
                  checked={typeImage === 'url'}
                  onChange={() => {
                    setTypeImage('url');
                    setImageFile(null);
                    setImageUrl('');
                  }}
                />
                Image en ligne
              </label>
              <label>
                <input
                  type="radio"
                  name="imageType"
                  value="local"
                  checked={typeImage === 'local'}
                  onChange={() => {
                    setTypeImage('local');
                    setImageUrl('');
                    setImageFile(null);
                  }}
                />
                Image locale
              </label>
            </div>
            {typeImage === 'url' ? (
              <input
                key="input-url"
                type="text"
                placeholder="Lien de l’image (https://...) *"
                value={imageUrl || ''}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            ) : (
              <input
                key="input-file"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            )}

            <div className="popup-actions">
              <button className="icon-btn" onClick={ajouterImage}>Ajouter</button>
              <button className="icon-btn" onClick={fermerPopupImage}>Annuler</button>
            </div>
            <p><i>* Champs de saisie obligatoire</i></p>
          </div>
        </div>
      )}
      {showMoveListModal && (
        <div className="popup-overlay" onPointerDown={(e) => e.stopPropagation()}>
          <div className="popup-content" ref={moveModalRef}>
            <h3>Déplacer cette liste</h3>

            <div className="modal-section-list">
              <label htmlFor="liste-select">Choisir la position de destination :</label>
              <select
                id="liste-select"
                value={listeIdCible}
                onChange={(e) => setListeIdCible(e.target.value)}
              >
                <option value="">-- Choisir une liste --</option>
                {tableau.lists
                  .filter((l) => l.id !== list.id && !l.archived)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
              </select>
            </div>

            <div className="popup-actions">
              <button
                className="icon-btn"
                onClick={() => {
                  moveList(list.id, listeIdCible);
                  setShowMoveListModal(false);
                  setListeIdCible('');
                }}
                disabled={!listeIdCible}
              >
                Confirmer
              </button>
              <button
                className="icon-btn"
                onClick={() => {
                  setShowMoveListModal(false);
                  setListeIdCible('');
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      {showMoveModal && (
        <div className="popup-overlay" onPointerDown={(e) => e.stopPropagation()}>
          <div
            className="popup-content"
            ref={moveModalRef}
          >
            <h3>Déplacer toutes les cartes</h3>

            <div className="modal-section-list">
              <label htmlFor="liste-select-list">Choisir la liste de destination :</label>
              <select
                id="liste-select-list"
                value={listeIdCible}
                onChange={(e) => setListeIdCible(e.target.value)}
              >
                <option value="">-- Choisir une liste --</option>
                {tableau.lists
                  .filter((l) => l.id !== list.id && !l.archived)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
              </select>
            </div>

            <div className="popup-actions">
              <button
                className="icon-btn"
                onClick={deplacerToutesLesCartes}
                disabled={!listeIdCible}
              >
                Confirmer
              </button>
              <button
                className="icon-btn"
                onClick={() => {
                  setShowMoveModal(false);
                  setListeIdCible('');
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDelete && (
        <div className="popup-overlay" onPointerDown={(e) => e.stopPropagation()}>
          <div
            className="popup-content"
            ref={moveModalRef}
          >
            <h3>Vous êtes sûr de supprimer cette liste ?</h3>
            <p>Cette action est <strong>définitive</strong> et ne peut pas être annulée.</p>
            <div className="popup-actions">
              <button
                className="icon-btn"
                onClick={() => {
                  supprimer();
                  setConfirmDelete(false);
                }}
              >
                Confirmer
              </button>
              <button
                className="icon-btn"
                onClick={() => setConfirmDelete(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={`liste-fade ${!trans ? 'hidden' : ''}`}>
        <div className="list">
          <div className="list-header">
            {edition ? (
              <div className="edition-titre">
                <input
                  type="text"
                  value={newTitre}
                  onChange={(e) => setNewTitre(e.target.value)}
                  onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                />
                <button onPointerDown={(e) => {
                  e.stopPropagation();
                }}onClick={editionTitre}>Valider</button>
                <button onClick={() => {setEdition(false);setNewTitre(list.title);}}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}>Annuler</button>
              </div>
            ) : (
              <h2
                className="list-title"
                onClick={() => setEdition(true)}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                style={{ cursor: "pointer" }}
              >
                {list.title}
              </h2>
            )}
            <div className="list-options">
              <button className="options-button" onClick={() => setMenuOuvert(!menuOuvert)}
              onPointerDown={(e) => {
                  e.stopPropagation();
                  setMenuOuvert((prev) => !prev)
                }}>⋮</button>
              {menuOuvert && (
                <div className="options-menu" ref={menuRef} onPointerDown={(e) => {e.stopPropagation();}}>
                  <button onClick={ouvrirTitre}>Ajouter une carte</button>
                  <button onClick={() => setShowMoveListModal(true)}>Déplacer la liste</button>
                  <button onClick={() => setShowMoveModal(true)}>Déplacer toutes les cartes</button>
                  <button onClick={archiverCartes}>Archiver toutes les cartes</button>
                  <button onClick={archiver}>Archiver la liste</button>
                  {(role === 'C' || role === 'A') && (
                  <button onClick={() => setConfirmDelete(true)}>Supprimer la liste</button>
                  )}
                </div>
              )}
            </div>
          </div>
          {trans && (
          <SortableContext
            items={cartesAffichees.map(card => `card:${card.id}:${list.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="card-s">
              {cartesAffichees.map(card => (
                <Card
                  key={card.id}
                  card={card}
                  listId={list.id}
                  tabId={tabId}
                  moveCarte={moveCarte}               
                />
              ))}
              {dropIndicator === cartesAffichees.length && (
                <div className="drop-indicator" />
              )}
            </div>
          </SortableContext>
          )}
          {!afficherArchives && (
            <div className="add-card-container">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={ouvrirTitre}
                className="add-card"
              >
                + Ajouter une carte
              </button>
              <FaImage
                className="add-card-icon"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={ouvrirPopupImage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}