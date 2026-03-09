import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "../css/global.css";
import "../css/description.css";

interface DesProps {
  tableauId: string;
  onClose: (modif: boolean) => void;
}

const Des: React.FC<DesProps> = ({ tableauId, onClose }) => {
    const [tabInfo, settabInfo] = useState<any | null>(null);
    const [editDes, seteditDes] = useState(false);
    const [newDes, setnewDes] = useState<string>('');
    const [editTitre, setEditTitre] = useState(false);
    const [editImage, setImage] = useState(false);
    const [newTitre, setNewTitre] = useState('');
    const [imageType, setImageType] = useState<'url' | 'local'>('url');
    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [modif, setModif] = useState(false);

    const handleImageSave = async () => {
      try {
        let finalImageUrl = imageUrl;

        if (imageType === 'local' && imageFile) {
          const formData = new FormData();
          formData.append("image", imageFile);

          const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/upload`, formData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });

          finalImageUrl = res.data.url;
        }
        await axios.put(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/modifier`, {
          tab_titre: newTitre,
          tab_des: newDes,
          tab_couv: finalImageUrl,
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const updated = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/description`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const data = updated.data[0];
        settabInfo(data);
        setImageUrl(data.tab_couv || '');
        setImage(false);
        setImageType('url');
        setImageFile(null);
        setModif(true);
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l’image :', error);
      }
    };


  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/description`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
    .then((response) => {
      settabInfo(response.data[0]);
      setnewDes(response.data[0].tab_des || '');
      setNewTitre(response.data[0].tab_titre || '');
      setImageUrl(response.data[0].tab_couv || '');
    })
    .catch((error) => {
      console.error('Erreur lors de la récupération des informations du tableau:', error);
    });
  }, [tableauId]);

  const save = async () => {
  try {
    let finalImageUrl = imageUrl;

    if (imageType === 'local' && imageFile) {
      const formData = new FormData();
      formData.append("image", imageFile);

      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      finalImageUrl = res.data.url;
    }

    await axios.put(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/modifier`, {
      tab_titre: newTitre,
      tab_des: newDes,
      tab_couv: finalImageUrl
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      
    });

    const updated = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/description`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    const data = updated.data[0];
    settabInfo(data);
    setnewDes(data.tab_des || '');
    setNewTitre(data.tab_titre || '');
    setImageUrl(data.tab_couv || '');
    seteditDes(false);
    setEditTitre(false);
    setModif(true);
  } catch (error) {
    console.error('Erreur lors de la mise à jour :', error);
  }
};

  if (!tabInfo) return null;

return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>À propos de ce tableau</h2>
        <p><strong>Créateur :</strong> {tabInfo.pfl_nom} {tabInfo.pfl_prenom}</p>
        <div>
          <strong>Titre :</strong>
          {editTitre ? (
             <>
              <input
                type="text"
                value={newTitre}
                onChange={(e) => setNewTitre(e.target.value)}
              />
              <button onClick={save}>Sauvegarder</button>
              <button onClick={() => {
                setNewTitre(tabInfo.tab_titre || '');
                setEditTitre(false);
              }}>Annuler</button>
            </>
          ) : (
            <p onClick={() => setEditTitre(true)}>{newTitre}</p>
          )}
        </div>

        
        <div>
          <strong>Description :</strong>
          {editDes ? (
            <>
              <textarea
                value={newDes}
                onChange={(e) => setnewDes(e.target.value)}
              />
              <button onClick={save}>Sauvegarder</button>
              <button onClick={() => {
                setnewDes(tabInfo.tab_des || '');
                seteditDes(false);
              }}>Annuler</button>
            </>
          ) : (
            <p onClick={() => seteditDes(true)}>{newDes || 'Aucune description pour le moment'}</p>
          )}
        </div>
        <div>
            {tabInfo.tab_couv && (
              <div style={{ marginBottom: '10px' }}>
                <img
                  src={tabInfo.tab_couv}
                  alt="Image de couverture"
                  style={{ width: '150px', height: 'auto', borderRadius: '8px' }}
                />
              </div>
            )}

            {/* Bouton pour activer/désactiver le mode édition */}
            {!editImage ? (
              <button onClick={() => setImage(true)}>Modifier l’image</button>
            ) : (
              <>
                <div>
                  <label>
                    <input
                      type="radio"
                      name="imageType"
                      value="url"
                      checked={imageType === 'url'}
                      onChange={() => setImageType('url')}
                    />
                    Lien d’image
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="imageType"
                      value="local"
                      checked={imageType === 'local'}
                      onChange={() => setImageType('local')}
                    />
                    Image locale
                  </label>
                </div>

                {/* Champ de saisie selon le type sélectionné */}
                {imageType === 'url' ? (
                  <input
                    key="url-input"
                    type="text"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                ) : (
                  <input
                    key="file-input"
                    type="file"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                )}

                {/* Boutons de sauvegarde et annulation */}
                <div style={{ marginTop: '10px' }}>
                  <button onClick={handleImageSave}>Sauvegarder</button>
                  <button onClick={() => {
                    setImage(false);
                    setImageType('url');
                    setImageUrl(tabInfo.tab_couv || '');
                    setImageFile(null);
                  }}>Annuler</button>
                </div>
              </>
            )}
          </div>
        <button onClick={() => onClose(modif)} className="close-btn">X</button>
      </div>
    </div>
  );
};

export default Des;