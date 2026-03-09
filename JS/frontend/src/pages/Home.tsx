import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/global.css";
import "../css/home.css";
import axios from "axios";

function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fonction appelée au clic sur "Démarrer"
  const Login = () => {
    // Vérification des champs
    if (!email || !password) {
      setError("Veuillez entrer un mail et un mot de passe.");
      return;
    }

    // Envoi de la requête de connexion
    axios
      .post("http://localhost:5000/api/login", { mail: email, pwd: password })
      .then((res) => {
        // Si la connexion est réussie, on stocke le token et on redirige
        localStorage.setItem("token", res.data.token);
        navigate("/tableau"); // Redirige vers la page tableau après la connexion
      })
      .catch((err) => {
        console.error("Erreur de connexion", err);
        setError("Mauvais identifiant ou mot de passe ou compte expiré ");
      });
  };

  return (
    <div className="home-container">
      <div className="login-card">
        <h1 className="home-title">Kobi</h1>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            className="form-input"
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Entrez votre mail"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Mot de passe</label>
          <input
            className="form-input"
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Entrez votre mot de passe"
            required
          />
        </div>

        {/* Affichage d'un message d'erreur */}
        {error && <p className="form-error">{error}</p>}

        {/* Bouton Démarrer pour envoyer la requête */}
        <button onClick={Login} className="start-button">
          Démarrer
        </button>
      </div>
    </div>
  );
}

export default Home;

