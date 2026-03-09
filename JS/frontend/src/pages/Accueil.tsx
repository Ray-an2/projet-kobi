import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Tableau } from '../data/type';
import { useNavigate, Link } from 'react-router-dom';
import { FaSearch, FaBell, FaBars} from 'react-icons/fa';
import '../css/accueil.css';
import '../css/entete.css';
import '../css/global.css';


function Acc() {
  const [tabs, setTabs] = useState<Tableau[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'rec' | 'alp' | ''>('rec');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const Menu = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageType, setImageType] = useState<'url' | 'local'>('url');

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleAddTableau = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
  
    if (!titre.trim()) {
      alert("Le titre du tableau est requis");
      return;
    }
  
    let finalImageUrl = imageUrl;
  
    if (image) {
      const formData = new FormData();
      formData.append("image", image);
      try {
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/upload`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        finalImageUrl = res.data.url;
      } catch (err) {
        console.error("Erreur upload image :", err);
        return;
      }
    }
  
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/tableau`,
        { tab_titre: titre, tab_des: description, tab_couv: finalImageUrl || null},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTabs(prev => [...prev, {
        id: response.data.tab_id.toString(),
        title: titre,
        description: description,
        coverImage: finalImageUrl || null,
        lists: [],
      }]);
      setShowForm(false);
      setTitre('');
      setDescription('');
      setImage(null);
      setImageUrl('');
    } catch (err) {
      console.error("Erreur ajout tableau :", err);
    }
  };
  

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

    if (
      Menu.current &&
      !Menu.current.contains(target) &&
      buttonRef.current &&
      !buttonRef.current.contains(target)
    ) {
      setShowSortOptions(false);
    }
  };

  if (showSortOptions) {
    document.addEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [showSortOptions]);

  useEffect(() => {
    if (imageType === 'url') {
      setImage(null);
    } else {
      setImageUrl('');
    }
  }, [imageType]);

  useEffect(() => {
    const fetchTabs = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
  
      try {
        let response;
  
        if (searchQuery) {
          response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/tableau/rec`, { search: searchQuery }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else if (sortMode) {
          response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau/tri?tri=${sortMode}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/tableau`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
  
        const formatted = response.data.map((tab: any): Tableau => ({
          id: tab.tab_id.toString(),
          title: tab.tab_titre,
          description: tab.tab_des,
          coverImage: tab.tab_couv || null,
          lists: [],
        }));
        setTabs(formatted);
      } catch (error) {
        console.error("Erreur chargement tableaux :", error);
      }
    };
  
    fetchTabs();
  }, [searchQuery, sortMode]);
  

  return (
    <div>
      <header className="app-header">
        <button onClick={logout} className='icon-btn'>Déconnexion</button>
        <p className="title">Kobi</p>
        {showSearch && (
          <div className='search'>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") setSortMode(''); }}
              autoFocus
            />
          </div>
        )}
        <div className="app-icons">
          <div className="icon-btn" onClick={() => navigate("/tableau/log")}><FaBell className="icon" title="Page des logs"/></div>
            <div className="icon-btn" onClick={() => setShowSearch(prev => !prev)}>
              <FaSearch className="icon" title="Rechercher"/>
            </div>
          <div className="icon-btn" ref={buttonRef} onClick={() => setShowSortOptions(!showSortOptions)}>
            <FaBars className="icon" title="Menu"/>
          </div>
        </div>
          {showSortOptions && (
            <div className="sort-option" ref={Menu}>
              <button onClick={() => setSortMode('rec')} className='icon-btn-op'>Trier par récent</button>
              <button onClick={() => setSortMode('alp')} className='icon-btn-op'>Trier A-Z</button>
              <button onClick={() => setSortMode('')} className='icon-btn-op'>Trier par ancien</button>
            </div>
          )}
      </header>
      <main className="board-grid">
        {tabs.map((tab) => (
          <Link to={`/tableau/${tab.id}`} key={tab.id} className="board-card">
            <img src={tab.coverImage || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='} alt={tab.title} className="board-card-image" />
            <div className="board-card-title">{tab.title}</div>
            <div className='overlay-tab'>
              <span className="overlay-texte">{tab.title}</span>
            </div>
          </Link>
        ))}
        {showForm && (
          <>
            <div className="modal-overlay" onClick={() => setShowForm(false)} />
            <div className="modal">
              <h2>Ajouter un tableau</h2>
              <input type="text" placeholder="Titre*" value={titre} onChange={e => setTitre(e.target.value)} />
              <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
              <div className="image-selector">
                <label>
                  <input
                    type="radio"
                    name="imageType"
                    value="url"
                    checked={imageType === 'url'}
                    onChange={() => setImageType('url')}
                  />
                  Image en ligne
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

                {imageType === 'url' ? (
                  <input
                    key="url-input"
                    type="text"
                    placeholder="Lien image (https://...)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                ) : (
                  <input
                    key="file-input"
                    type="file"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                  />
                )}
              </div>
              <button onClick={handleAddTableau} className='icon-btn-op'>Valider</button>
              <button onClick={() => setShowForm(false)} className='icon-btn-op'>Annuler</button>
              <p><i>* Champs de saisie obligatoire</i></p>
            </div>
          </>
          )}
        <button onClick={() => setShowForm(true)} className="btn-tab">
          + Ajouter un tableau
        </button>
      </main>
    </div>
  );
}
export default Acc;