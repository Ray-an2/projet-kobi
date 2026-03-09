import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { Log } from "../data/type";
import '../css/global.css'
import '../css/entete.css'
import { FaArrowLeft, FaSearch } from "react-icons/fa";

export default function Logs() {
  const { id } = useParams();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [title, setTitle] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      setLoading(true);
      const start = Date.now();
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        let res;
        if (searchQuery) {
          if (id) {
            res = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/tableau/${id}/log/rec`,
              { search: searchQuery },
              config
            );
          } else {
            res = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/tableau/log/rec`,
              { search: searchQuery },
              config
            );
          }
        } else {
          const url = id
            ? `${import.meta.env.VITE_BACKEND_URL}/tableau/${id}/log`
            : `${import.meta.env.VITE_BACKEND_URL}/tableau/log`;

          res = await axios.get(url, config);
        }

        setLogs(res.data);

        if (id && res.data.length > 0) {
          setTitle(res.data[0].tab_titre || null);
        }
        const delay = Math.max(0, 1000 - (Date.now() - start));
        setTimeout(() => {
          setLoading(false);
        }, delay);
      } catch (error) {
        console.error("Erreur de chargement des logs :", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [id, searchQuery]);

  function formatDate(dateStr?: string | null): string {
    if (!dateStr) return "Non défini";

    const iso = dateStr.split("T");
    if (iso.length < 2) return "Non défini";

    const [datePart, timePart] = iso;
    const [annee, mois, jour] = datePart.split("-");
    const [heure, minute] = timePart.split(":");

    return `${jour}/${mois}/${annee} à ${heure}:${minute}`;
  }

  return (
    <div>
      <header className="app-header">
        <div className="icon-btn">
          <FaArrowLeft
            className="icon"
            onClick={() => navigate(id ? `/tableau/${id}` : "/tableau")}
            title="Revenir à la page précédente"
            />
        </div>
        <h2>
          Logs {id ? `${title}` : "globaux"}
        </h2>

        {showSearch && (
          <div className='search'>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  setSearchQuery(searchInput);
                }
              }}
              autoFocus
            />
          </div>
        )}

        <div className="app-icons">
          <div className="icon-btn" onClick={() => setShowSearch(prev => !prev)}>
            <FaSearch className="icon" title="Rechercher" />
          </div>
        </div>
      </header>

      <div className="page">
        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : logs.length === 0 ? (
          <p>Aucun log disponible pour le moment.</p>
        ) : (
          <ul className="log-list">
            {logs.map((log) => (
              <li key={log.log_id}>
                <strong>[{log.log_type}]</strong> ({log.log_auteur}) {formatDate(log.log_date)} : <br />
                <i>{log.log_description}</i>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}