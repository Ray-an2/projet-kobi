import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/global.css';

interface Carte {
  id: string;
  title: string;
}

interface Liste {
  id: string;
  title: string;
}

interface CommonProps {
  onClose: () => void;
  tabId: string;
  refresh?: () => void;
}

interface CarteProps extends CommonProps {
  type: 'cartes';
  carteClick: (id: string) => void;
}

interface ListeProps extends CommonProps {
  type: 'listes';
}

type ArchiveProps = CarteProps | ListeProps;

const Archives: React.FC<ArchiveProps> = (props) => {
  const { onClose, tabId } = props;
  const [selListes, setSelListes] = useState<string[]>([]);
  const [selCartes, setSelCartes] = useState<string[]>([]);
  const [listesArchivees, setListesArchivees] = useState<Liste[]>([]);
  const [cartesArchivees, setCartesArchivees] = useState<Carte[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  if (props.type === 'cartes') {
    fetchArchivedCards();
  } else {
    fetchArchivedLists();
  }
}, [props.type, tabId]);

  // Lister les listes archiver
  const fetchArchivedLists = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tabId}/list/archiver`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListesArchivees(
        res.data.map((l: any) => ({
          id: l.lis_id,
          title: l.lis_titre
        }))
      );
    } catch (err) {
      console.error("Erreur récupération listes archivées", err);
    } finally {
      setLoading(false);
    }
  };
  // Lister les cartes archiver
  const fetchArchivedCards = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token JWT manquant. Veuillez vous reconnecter.");
      return;
    }
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tabId}/cartes/archiver`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setCartesArchivees(
        res.data.map((c: { car_id: string; car_nom: string }) => ({
          id: c.car_id,
          title: c.car_nom
        }))
      );
  } catch (err) {
    console.error("Erreur récupération cartes archivées", err);
  } finally {
    setLoading(false);
  }
};

  const selectionListe = (id: string) => {
    setSelListes((prev) =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectionCarte = (id: string) => {
  setSelCartes((prev) =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
};

  // Fonction pour restaurer les listes ou les cartes sélectionnées
  const restoreSelected = async () => {
    try {
      const token = localStorage.getItem("token");

      if (props.type === 'listes' && selListes.length > 0) {
        await Promise.all(
          selListes.map(lisId =>
            axios.put(
              `${import.meta.env.VITE_BACKEND_URL}/tableau/${tabId}/list/desarchiver/${lisId}`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            )
          )
        );
        setSelListes([]);
      }

      if (props.type === 'cartes' && selCartes.length > 0) {
        await Promise.all(
          selCartes.map(carId =>
            axios.put(
              `${import.meta.env.VITE_BACKEND_URL}/tableau/${tabId}/carte/${carId}/archiver`,
              { car_archiver: 'P' },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          )
        );
        setSelCartes([]);
      }

      props.refresh?.();
      onClose();
    } catch (err) {
      console.error("Erreur lors de la restauration", err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{props.type === 'cartes' ? 'Cartes archivées' : 'Listes archivées'}</h2>

        {props.type === 'cartes' && (
          <>
            {loading ? (
              <p>Chargement...</p>
            ) : (
              <>
                <div className="archive-list">
                  {cartesArchivees.map((carte: Carte) => (
                    <div className="archive"key={carte.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selCartes.includes(carte.id)}
                          onChange={() => selectionCarte(carte.id)}
                        />
                        {carte.title}
                      </label>
                    </div>
                  ))}
                </div>
                <button
                  onClick={restoreSelected}
                  className="btn btn-confirm"
                  disabled={selCartes.length === 0}
                >
                  Restaurer
                </button>
              </>
            )}
          </>
        )}

        {props.type === 'listes' && (
          <>
            {loading ? (
              <p>Chargement...</p>
            ) : (
              <div className="archive-list">
                {listesArchivees.map(liste => (
                  <div className='archive' key={liste.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selListes.includes(liste.id)}
                        onChange={() => selectionListe(liste.id)}
                      />
                      {liste.title}
                    </label>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={restoreSelected}
              className="btn btn-confirm"
              disabled={selListes.length === 0}
            >
              Restaurer
            </button>
          </>
        )}

        <button onClick={onClose} className="btn btn-cancel">Fermer</button>
      </div>
    </div>
  );
};
export default Archives;
