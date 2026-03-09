import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './../css/global.css';
import { FaChevronUp, FaStar, FaUserPlus, FaCheck } from 'react-icons/fa';

interface MembresProps {
  tableauId: string;
  onClose: () => void;
}

const Membres: React.FC<MembresProps> = ({ tableauId, onClose }) => {
  const [membres, setMembres] = useState<any[]>([]);
  const [showAddMembre, setShowAddMembre] = useState(false);
  const [compte, setCompte] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<'M' | 'A'>('M');
  
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/membres`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
    .then((response) => {
      setMembres(response.data);
    })
    .catch((error) => {
      console.error('Erreur lors de la récupération des membres:', error);
    });
  }, [tableauId]);

  async function MemTab(cptId: string, role: 'M' | 'A' = 'M') {
    const token = localStorage.getItem('token');
    if (!token) return;

    const estMembre = membres.some((m) => m.cpt_id === cptId);

    try {
      if (estMembre) {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/membre`, {
          data: {cpt_id: cptId},
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/membre`, {
          cpt_id: cptId,
          role,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // Recharger les membres
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/membres`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMembres(res.data);
    } catch (err) {
      console.error('Erreur modification membre :', err);
    }
  } 

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Membres du tableau</h2>
            {(membres.some(m => m.rol_role === 'A' || m.rol_role === 'C')) && (
              <FaUserPlus
                title="Ajouter un membre"
                style={{ cursor: 'pointer', fontSize: '1.2rem', color: '#007bff' }}
                onClick={async () => {
                  try {
                    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/${tableauId}/comptes`, {
                      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    });
                    setCompte(res.data);
                    setShowAddMembre(true);
                  } catch (err) {
                    console.error('Erreur chargement comptes :', err);
                  }
                }}
              />
            )}
          </div>
          {showAddMembre && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>Ajouter ou retirer un membre</h2>
                <div className="liste-membres">
                  {compte.map((cpt) => {
                    const estDejaMembre = membres.some((m) => m.cpt_id === cpt.cpt_id);
                    return (
                      <div
                        key={cpt.cpt_id}
                        className="ligne-membre"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <div
                          onClick={() => {
                            if (!estDejaMembre) MemTab(cpt.cpt_id, selectedRole);
                            else MemTab(cpt.cpt_id); // Suppression
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}
                        >
                          {cpt.pfl_img ? (
                            <img src={cpt.pfl_img} alt="" className="membre-avatar" />
                          ) : (
                            <div className="membre-initiales">
                              {cpt.pfl_prenom[0]}{cpt.pfl_nom[0]}
                            </div>
                          )}
                          <div className="membre-nom">
                            {cpt.pfl_prenom} {cpt.pfl_nom}
                          </div>
                          {estDejaMembre && <FaCheck style={{ marginLeft: 'auto', color: 'green' }} />}
                        </div>
                        {!estDejaMembre && (
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as 'M' | 'A')}
                            style={{ padding: '4px', borderRadius: '4px' }}
                          >
                            <option value="M">Membre</option>
                            <option value="A">Admin</option>
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button className="close-btn" onClick={() => setShowAddMembre(false)}>Fermer</button>
              </div>
            </div>
          )}
          <div className="membres-list">
          {membres.map((m) => (
            <div
              key={m.cpt_id}
              title={`${m.pfl_prenom} ${m.pfl_nom}`}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <div className="avatar-wrapper">
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
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 'bold' }}>
                  {m.pfl_prenom} {m.pfl_nom}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#555' }}>
                  {m.rol_role === 'A'
                    ? 'Administrateur'
                    : m.rol_role === 'C'
                    ? 'Créateur'
                    : 'Membre'}
                    {m.rol_role === 'A' && (
                  <FaChevronUp
                    className="role-icon"
                    title="Administrateur"
                    style={{ color: '#007bff' }}
                  />
                )}
                {m.rol_role === 'C' && (
                  <FaStar
                    className="role-icon"
                    title="Créateur"
                    style={{ color: '#f4c542' }}
                  />
                )}
                </span>
              </div>
            </div>
          ))}
          </div>
        <button onClick={onClose} className="close-btn">X</button>
      </div>
    </div>
  );
};
export default Membres;