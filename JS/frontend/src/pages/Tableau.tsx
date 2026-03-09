import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaBell, FaArrowLeft } from 'react-icons/fa';
import {DndContext, PointerSensor, useSensor, useSensors, DragOverlay, rectIntersection} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useTableau } from '../component/Tableau';
import { Card as CarteCom } from '../component/Carte';
import Membre from '../component/Membre';
import Description from '../component/Description';
import Archives from '../component/Archive';
import '../css/global.css';
import '../css/entete.css';
import '../css/tableau.css';

type Header = {
  onOpenMembres: () => void;
  onOpenDes: () => void;
  onOpenCartes: () => void;
  onOpenListes: () => void;
};

function Header({ onOpenMembres, onOpenDes, onOpenCartes, onOpenListes }: Header) {
  const { tableau, menuOpen, setMenuOpen, menu, menuButton, role, fermerTab, delTab, openTab, ferme } = useTableau();
  const [ConfirmClose, setConfirmClose] = useState(false);
  const [ConfirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();

  if (!tableau) return null;
  return (
    
    <header className="app-header">
      <a href="/tableau">
        <div className="icon-btn">
          <FaArrowLeft className="icon" title="Revenir à la page d'accueil" />
        </div>
      </a>
      <p className="title">{tableau.title}</p>
      <div className="app-icons">
        <div className="icon-btn" onClick={() => navigate(`/tableau/${tableau.id}/log`)}>
          <FaBell className="icon" title="Activité" />
        </div>
        <div className="icon-btn" ref={menuButton} onClick={() => setMenuOpen(!menuOpen)}>
          <FaBars className="icon" title='Menu' />
        </div>
        {menuOpen && (
          <div className="dropdown-menu" ref={menu}>
            <ul>
              <li onClick={onOpenMembres}>Membres</li>
              <li onClick={onOpenDes}>À propos de ce tableau</li>
              <li onClick={onOpenCartes}>Cartes archivées</li>
              <li onClick={onOpenListes}>Listes archivées</li>
              {(role === 'C' || role === 'A') && (
                <>
                  <li onClick={() => setConfirmClose(true)}>
                    {ferme ? "Ouvrir le tableau" : "Fermer le tableau"}
                  </li>
                    {ConfirmClose && (
                      <div className="modal-overlay">
                        <div className="modal-content">
                          <h3>
                            {ferme
                              ? "Es-tu sûr de vouloir ouvrir ce tableau ?"
                              : "Es-tu sûr de vouloir fermer ce tableau ?"}
                          </h3>
                          <div className="modal-actions">
                            <button
                              className="confirm-btn"
                              onClick={() => {
                                if (ferme) {
                                  openTab();
                                } else {
                                  fermerTab();
                                }
                                setConfirmClose(false);
                              }}
                            >
                              Confirmer
                            </button>
                            <button
                              className="cancel-btn"
                              onClick={() => setConfirmClose(false)}
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  <li onClick={() => setConfirmDelete(true)}>Supprimer le tableau</li>
                  {ConfirmDelete && (
                    <div className="modal-overlay">
                      <div className="modal-content">
                        <h3>Es-tu sûr de vouloir supprimer ce tableau ?</h3>
                        <p>Cette action est <strong>définitive</strong> et ne peut pas être annulée.</p>
                        <div className="modal-actions">
                          <button
                            className="confirm-btn"
                            onClick={() => {
                              delTab();
                              setConfirmDelete(false);
                            }}
                          >
                            Confirmer
                          </button>
                          <button
                            className="cancel-btn"
                            onClick={() => setConfirmDelete(false)}
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}

export default function Tab() {
  const {
    tableau,
    setTableau,
    loading,
    tableauInexistant,
    redirigerAuto,
    refresh,
    role,
    showArchive,
    popupListe,
    setPopupListe,
    titreListe,
    setTitreListe,
    ajouterListe,
    ajouterCarte,
    moveCarte,
    handleDragEnd,
    handleDragOver,
    activeDragItem,
    renderCountdown,
    moveList,
    unauthorized,
    SortableList,
    dropIndicator
  } = useTableau();
  
  const pointerSensor = useSensor(PointerSensor);
  const sensors = useSensors(pointerSensor);
  const navigate = useNavigate();

  const [showMembre, setShowMembre] = useState(false);
  const [showDes, setShowDes] = useState(false);
  const [showArchives, setShowArchives] = useState<null | 'cartes' | 'listes'>(null);

  const imagePath =
    tableau && tableau.coverImage && tableau.coverImage.startsWith('http')
      ? tableau.coverImage
      : tableau && tableau.coverImage
      ? `/image/${encodeURIComponent(tableau.coverImage.replace(/^.*[\\/]/, ''))}`
      : '';

  if (loading) {
    return (
      <div className="loading-screen"><div className="spinner"/></div>
    );
  }

  if (tableauInexistant || unauthorized || redirigerAuto) {
    const message = tableauInexistant
      ? "Ce tableau n'existe pas."
      : unauthorized
      ? "Vous n'êtes pas autorisé à accéder à ce tableau."
      : "Ce tableau est indisponible !";

    return (
      <div className="tableau-page">
        <div className="no-content">
          <div className="no-data">
            <p className='error-mes'>{message}</p>
            <p className='redirect-info'>Redirection vers l'accueil dans {renderCountdown()}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tableau) {
    return <div className="error">Tableau non trouvé.</div>;
  }
  if (!Array.isArray(tableau.lists)) {
    console.error("tableau.lists est mal formaté :", tableau);
    return <div className="error">Erreur de format : les listes sont invalides.</div>;
  }

  return (
    
    <div
      className={`tableau-page ${!tableau.coverImage ? 'no-cover' : ''}`}
      style={{
        backgroundImage: tableau.coverImage ? `url(${imagePath})` : 'none',
      }}
    >
      <Header
        onOpenMembres={() => setShowMembre(true)}
        onOpenDes={() => setShowDes(true)}
        onOpenCartes={() => setShowArchives('cartes')}
        onOpenListes={() => setShowArchives('listes')}
      />

      {showMembre && (
        <div className="modal-overlay">
          <Membre tableauId={tableau.id} onClose={() => setShowMembre(false)} />
        </div>
      )}
      {showDes && (
        <div className="modal-overlay">
          <Description tableauId={tableau.id} onClose={(modif) => {setShowDes(false); if (modif) refresh(true);}} />
        </div>
      )}
      {showArchives && (
        <div className="modal-overlay">
          {showArchives === 'cartes' ? (
            <Archives
              type="cartes"
              carteClick={(id) => navigate(`/tableau/${tableau.id}/carte/${id}`)}
              onClose={() => setShowArchives(null)}
              tabId={tableau.id}
              refresh={() => refresh(false)}
            />
          ) : (
            <Archives
              type="listes"
              onClose={() => setShowArchives(null)}
              tabId={tableau.id}
              refresh={() => refresh(false)}
            />
          )}
        </div>
      )}
      {popupListe && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Nouvelle liste</h3>
            <input
              type="text"
              value={titreListe}
              onChange={(e) => setTitreListe(e.target.value)}
              placeholder="Nom de la liste"
              autoFocus
            />
            <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem' }}>
              <button onClick={ajouterListe} className="btn">Ajouter</button>
              <button onClick={() => { setPopupListe(false); setTitreListe(''); }} className="btn btn-secondary">Annuler</button>
            </div>
          </div>
        </div>
      )}
      {Array.isArray(tableau.lists) && tableau.lists.length === 0 ? (
        <div className="no-content">
          <div className="no-list">
            <p>Aucune information pour le moment.</p>
          </div>
          <div className="tableau-actions-inline">
            <button onClick={() => setPopupListe(true)} className="btn">
              + Ajouter une liste
            </button>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <SortableContext
            items={tableau.lists.map((list) => `list:${list.id}`)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="board-container">
              {tableau.lists
                .filter((list) => showArchive || !list.archived)
                .map((list) => (
                  <SortableList
                    key={list.id}
                    list={list}
                    tabId={tableau.id}
                    moveCarte={moveCarte}
                    ajouterCarte={ajouterCarte}
                    showArchive={showArchive}
                    dropIndicator={
                      dropIndicator && dropIndicator.listId === list.id
                      ? dropIndicator.index
                      : null
                    }
                    setTableau={setTableau}
                    tableau={tableau}
                    moveList={moveList}
                    role={role}
                  />
                ))}
              <div className="tableau-actions-inline">
                <button onClick={() => setPopupListe(true)} className="btn">
                  + Ajouter une liste
                </button>
              </div>
            </div>
          </SortableContext>
          <DragOverlay className="dnd-overlay">
            {activeDragItem && activeDragItem.type === 'card' && (
              <CarteCom
                card={activeDragItem.data}
                listId={activeDragItem.listId}
                tabId={tableau.id}
                moveCarte={moveCarte}
              />
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
