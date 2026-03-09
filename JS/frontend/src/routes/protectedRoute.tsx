import { jwtDecode } from 'jwt-decode';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute: React.FC<{ children: React.ReactNode;}> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/'); // Redirige vers Home si pas de token
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      const role = decoded.pfl_role;

      // Vérifie si le token est expiré
      const time = Date.now() / 1000;
      if (decoded.exp < time) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }

      // Vérifie si le rôle de l'user est autorisé
      if (!["M", "G", "A"].includes(role)) {
        navigate('/'); // Redirige vers Home si le rôle n'est pas présent
      }
    } catch (err) { // token expiré ou invalide
      navigate('/'); 
    }
  }, [navigate]);

  return <>{children}</>;
};

export default ProtectedRoute;
