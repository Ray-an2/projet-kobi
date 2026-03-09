import { useParams, useNavigate } from "react-router-dom";
import { useCarte } from '../component/Carte';
import {FaArrowLeft, FaTag, FaUser, FaClock, FaPaperclip, FaEllipsisV, FaPen, FaPlus, FaCheck, FaBars, FaTrash} from "react-icons/fa";
import "../css/carte.css";
import { useState } from "react";

export default function Car() {
  const { tabId, carId } = useParams();
  const navigate = useNavigate();
  const {
    chargerCarte,
    carte,
    loading,
    menu,
    setMenuOpen,
    menuOpen,
    menuButton,
    userRole,
    newDesc,
    setNewDesc,
    newDateDebut,
    setNewDateDebut,
    newDateLimite,
    setNewDateLimite,
    updateDescription,
    updateDates,
    chargerMembres,
    showModalMembres,
    setShowModalMembres,
    membresTab,
    tag,
    tagsTab,
    showModalTags,
    chargerTags,
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
    membre,
    listes,
    listeIdCible,
    setListeIdCible,
    handleMove,
    getColor,
    delCarte,
    showMove,
    setShowMove,
    terminerCarte,
    archiverCarte,
    isEnd,
    formatDateTime,
  } = useCarte(tabId, carId);

  const [showDesModal, setDesModal] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activites, setActivites] = useState(false);
  const [tags, setTags] = useState(false);
  const [editTag, setEditTag] = useState<{ id: string; nom: string; couleur: string } | null>(null);
  const [delTags, setDelTag] = useState<string | null>(null);
  const [modalDelTag, setModalDelTag] = useState(false);
  const [mem, setMem] = useState(false);
  const [showDatesModal, setShowDatesModal] = useState(false);

  if (loading) return/* <div>Chargement...</div>;*/
  if (!carte) return /*<>Carte introuvable</>  */

  const openDesModal = () => {
    setNewDesc(carte.description || "");
    setDesModal(true);
  };

  const openDate = () => {
    setNewDateDebut(carte.dateDebut || "");
    setNewDateLimite(carte.dateLimite || "");
    setShowDatesModal(true);
  }

  return (
    <div className="carte-page">
      {carte.coverImage && (
        <div
          className="cover"
          style={{
            backgroundImage: `url(${carte.coverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      <div
          className="btn-back"
          onClick={() => navigate(`/tableau/${tabId}`)}
          title={`Revenir au tableau ${carte.tableauNom}`}>
          <FaArrowLeft className="icon"/>
        </div>
      <div className="carte-content">
        <div className="card-title-btn">
          <button
            onClick={terminerCarte}
            title={isEnd ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
            className={`terminer-bouton ${isEnd ? 'termine' : ''}`}>
            {isEnd ? '✓' : ''}
          </button>
          <div className="card-title">
            <h1>{carte.title}</h1>
            <div className="icon-btn" ref={menuButton} onClick={() => setMenuOpen(!menuOpen)}>
              <FaBars className="icon" title="Menu" />
            </div>
            {menuOpen && (
              <div className="dropdown-menu-carte" ref={menu}>
                <ul>
                  <li onClick={() => setShowMove(true)}>Déplacer la carte</li>
                  <li onClick={openDesModal}>Modifier la description</li>
                  <li onClick={() => setShowArchive(true)}>Archiver la carte</li>
                  {(userRole === 'C' || userRole === 'A') && (
                    <li onClick={() => setShowDelete(true)}>Supprimer la carte</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        {showArchive && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Vous êtes sûr d'archiver {carte.title} ?</h3>
              <p>Cette action peut être annulée plus tard.</p>
              <div className="modal-actions">
                <button className="confirm-btn" onClick={() => { archiverCarte("A"); setShowArchive(false); }}>Confirmer</button>
                <button className="cancel-btn" onClick={() => setShowArchive(false)}>Annuler</button>
              </div>
            </div>
          </div>
        )}
        {showDelete && (userRole === 'C' || userRole === 'A') && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Vous êtes sûr de supprimer {carte.title} ?</h3>
              <p>Cette action est <strong>définitive</strong> et ne peut pas être annulée.</p>
              <div className="modal-actions">
                <button
                  className="confirm-btn"
                  onClick={() => {
                    delCarte();
                    setShowDelete(false);
                  }}
                >
                  Confirmer
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setShowDelete(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="carte-sub">
          <h2>{carte.tableauNom}</h2>
            <div className="location">
            <p onClick={() => setShowMove(!showMove)}><i>{carte.listeNom}</i></p>
            </div>
          </div>
          {showMove && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>Déplacer la carte</h2>

                <div className="modal-section">
                  <label htmlFor="liste-select">Choisir une autre liste :</label>
                  <select
                    id="liste-select"
                    value={listeIdCible}
                    onChange={(e) => setListeIdCible(e.target.value)}
                  >
                    <option value="">-- Choisir une liste --</option>
                    {listes
                      .filter((l) => l.nom !== carte.listeNom)
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nom}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="modal-buttons">
                  <button
                    onClick={handleMove}
                    disabled={!listeIdCible}
                    className="btn btn-confirm"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => {
                      setShowMove(false);
                      setListeIdCible("");
                    }}
                    className="btn btn-cancel"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}
        <section className="section">
          <div
            className="section-title"
            onClick={openDesModal}
          >
            <FaPen /> Description
          </div>

          <p>{carte.description || <i>Ajouter une description à la carte</i>}</p>

          {showDesModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>Modifier la description</h2>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={4}
                  style={{ width: "100%" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    className="btn btn-confirm"
                    onClick={() => {
                      updateDescription();
                      setDesModal(false);
                      chargerCarte();
                    }}
                  >
                    Confirmer
                  </button>
                  <button onClick={() => setDesModal(false)} className="btn btn-cancel">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
        {showModalTags && (
          <div className="modal-overlay">
            <div className="modal">
              <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>Tags<FaPlus style={{ cursor: 'pointer' }} onClick={() => setAddTagModal(true)} title="Ajouter un tag" /></h2>
              <div className="liste-tags">
                {tagsTab.map((t) => {
                  const dansCarte = carte.tags.some((ct) => ct.id === t.tag_id);
                  const backgroundColor = t.tag_couleur;
                  const textColor = getColor(backgroundColor);

                  return (
                    <div key={t.tag_id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        onClick={() => {tag(t.tag_id); setTags(true)}}
                        className="liste-tag"
                        style={{ backgroundColor }}
                      >
                        <span style={{ color: textColor }}>{t.tag_nom}</span>
                        {dansCarte && <FaCheck color={textColor} />}
                      </div>
                      <FaPen
                        style={{ cursor: 'pointer', color: '#333' }}
                        title="Modifier ce tag"
                        onClick={() => {
                          setEditTag({ id: t.tag_id, nom: t.tag_nom, couleur: t.tag_couleur });
                          setEditTagModal(true);
                        }}/>
                      {(userRole === 'C' || userRole === 'A') && (
                      <FaTrash
                        style={{ cursor: 'pointer', color: '#333' }}
                        title="Supprimer tag"
                        onClick={() => {setDelTag(t.tag_id); setModalDelTag(true);}}
                      />
                      )}
                    </div>
                  );
                })}
              </div>
              <button className="btn btn-cancel" onClick={() => {setShowModalTags(false); if (tags) chargerCarte(); setTags(false)}}>Fermer</button>
            </div>
          </div>
        )}
        {addTagModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Créer un nouveau tag</h3>
              <div className="form-group">
                <label>Nom du tag</label>
                <input type="text" value={tagNom} onChange={(e) => setTagNom(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Couleur</label>
                <input type="color" value={tagCouleur} onChange={(e) => setTagCouleur(e.target.value)} />
                <input
                  type="text"
                  value={tagCouleur}
                  onChange={(e) => setTagCouleur(e.target.value)}
                  placeholder="#ad5555"
                  maxLength={7}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-start", gap: "1rem", marginTop: "1rem" }}>
                <button className="btn btn-confirm" onClick={creerTag}>Créer</button>
                <button className="btn btn-cancel" onClick={() => setAddTagModal(false)}>Annuler</button>
              </div>
            </div>
          </div>
        )}
        {editTagModal && editTag && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Modifier le tag</h3>
              <label>
                Nom :
                <input
                  type="text"
                  value={editTag.nom}
                  onChange={(e) => setEditTag({ ...editTag, nom: e.target.value })}
                />
              </label>
              <label>
                Couleur :
                <input
                  type="color"
                  value={editTag.couleur}
                  onChange={(e) => setEditTag({ ...editTag, couleur: e.target.value })}
                />
              </label>
              <div style={{ display: "flex", justifyContent: "flex-start", gap: "1rem", marginTop: "1rem" }}>
                <button
                  className="btn btn-confirm"
                  onClick={() =>
                    updateTag(editTag.id, editTag.nom.trim(), editTag.couleur)
                  }
                >
                  Enregistrer
                </button>
                <button className="btn btn-cancel" onClick={() => setEditTagModal(false)}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
        {modalDelTag && delTags !== null && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Voulez-vous vraiment supprimer ce tag ?</h3>
              <p>Cette action est irréversible.</p>
              <div style={{ display: "flex", justifyContent: "flex-start", gap: "1rem", marginTop: "1rem" }}>
                <button
                  className="btn btn-confirm"
                  onClick={() => {
                    delTag(delTags);
                    setModalDelTag(false);
                    setDelTag(null);
                  }}
                >
                  Confirmer
                </button>
                <button
                  className="btn btn-cancel"
                  onClick={() => {
                    setModalDelTag(false);
                    setDelTag(null);
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
        <section className="section">
          <div className="section-title" onClick={chargerTags}>
            <FaTag /> Tags
          </div>
          <div className="tags-d">
            {carte.tags.map((tag) => {
              const textColor = getColor(tag.couleur);
              return (
                <span
                  key={tag.id}
                  className="tag-d"
                  style={{
                    backgroundColor: tag.couleur,
                    color: textColor
                  }}
                >
                  {tag.nom}
                </span>
              );
            })}
          </div>
        </section>
          {showModalMembres && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>Membres du tableau</h2>
                <div className="liste-membres">
                  {membresTab.map((m) => {
                    const estDansCarte = carte.membres.some((cm) => cm.cpt_id === m.cpt_id);
                    return (
                      <div
                        key={m.cpt_id}
                        onClick={() => {membre(m.cpt_id); setMem(true);}}
                        className="ligne-membre"
                      >
                        {m.pfl_img ? (
                          <img
                            src={m.pfl_img}
                            alt={`${m.pfl_prenom} ${m.pfl_nom}`}
                            className="membre-avatar"
                          />
                        ) : (
                          <div className="membre-initiales">
                            {m.pfl_prenom[0]}{m.pfl_nom[0]}
                          </div>
                        )}

                        <div className="membre-nom">
                          {m.pfl_prenom} {m.pfl_nom}
                        </div>

                        {estDansCarte && <FaCheck className="icone-check" />}
                      </div>
                    );
                  })}
                </div>

                <button className="btn btn-cancel" onClick={() => {setShowModalMembres(false); if (mem) chargerCarte(); setMem(false)}}>Fermer</button>
              </div>
            </div>
          )}
        <section className="section">
          <div className="section-title" onClick={chargerMembres}>
            <FaUser /> Membres
          </div>
          <div className="membres-list-tab">
            {carte.membres.map((m) => (
              <div key={m.cpt_id} title={`${m.pfl_prenom} ${m.pfl_nom}`}>
                {m.pfl_img ? (
                  <img
                    src={m.pfl_img}
                    alt={`${m.pfl_prenom} ${m.pfl_nom}`}
                    className="membre-avatar"
                  />
                ) : (
                  <div className="membre-initiales">
                    {m.pfl_prenom[0]}{m.pfl_nom[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          {showDatesModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>Modifier les dates</h2>

                <label>Date de début :</label>
                <input
                  type="datetime-local"
                  value={newDateDebut}
                  onChange={(e) => setNewDateDebut(e.target.value)}
                  style={{ width: "100%", marginBottom: "1rem" }}
                />

                <label>Date limite :</label>
                <input
                  type="datetime-local"
                  value={newDateLimite}
                  onChange={(e) => setNewDateLimite(e.target.value)}
                  style={{ width: "100%" }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "1rem",
                    marginTop: "1rem",
                  }}
                >
                  <button
                    className="btn btn-confirm"
                    onClick={() => {
                      updateDates();
                      setShowDatesModal(false);
                      chargerCarte();
                    }}
                  >
                    Confirmer
                  </button>
                  <button
                    className="btn btn-cancel"
                    onClick={() => setShowDatesModal(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="section-title" onClick={openDate}>
            <FaClock /> Dates
          </div>
          <p>
            Début : {formatDateTime(carte.dateDebut) || "Non défini"} <br />
            Limite : {formatDateTime(carte.dateLimite) || "Non défini"}
          </p>
        </section>

        <section className="section">
          <div className="section-title">
            <FaPaperclip /> Pièces jointes
          </div>
          <ul>
            {carte.fichiers.map((fichier) => (
              <li key={fichier.id}>
                <a href={fichier.url} target="_blank" rel="noreferrer">
                  {fichier.nom}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="section">
          <div
            className="section-title"
            onClick={() => setActivites((prev) => !prev)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <FaEllipsisV /> Activités
          </div>

          {activites && carte?.activites && (
            <div className="activites-list">
              {carte.activites.length === 0 ? (
                <p>Aucune activité enregistrée pour le moment.</p>
              ) : (
                carte.activites.map((l) => {
                  const auteur = carte.membres.find((m) => m.cpt_mail === l.auteur);

                  return (
                    <div
                      key={l.id}
                      className="activite-item"
                      style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}
                    >
                      <div
                        title={`${auteur?.pfl_prenom ?? ''} ${auteur?.pfl_nom ?? ''}`}
                        style={{ marginRight: '10px' }}
                      >
                        {auteur?.pfl_img ? (
                          <img
                            src={auteur.pfl_img}
                            alt={`${auteur.pfl_prenom} ${auteur.pfl_nom}`}
                            className="membre-avatar"
                          />
                        ) : (
                          <div className="membre-initiales">
                            {(auteur?.pfl_prenom?.[0])}{(auteur?.pfl_nom?.[0])}
                          </div>
                        )}
                      </div>
                      <div>
                        <p>{l.texte}</p>
                        <i style={{ fontSize: '0.8em', color: '#f4f5ef' }}>
                          {formatDateTime(l.date)}
                        </i>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}