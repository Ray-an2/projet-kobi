import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Accueil from './pages/Accueil';
import Tableau from './pages/Tableau';
import Log from './component/Log';
import Carte from './pages/Carte';
import ProtectedRoute from './routes/protectedRoute';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        
        <Route
          path="/tableau"
          element={
            <ProtectedRoute>
              <Accueil />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tableau/log"
          element={
            <ProtectedRoute>
              <Log />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tableau/:id/log"
          element={
            <ProtectedRoute>
              <Log />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tableau/:id"
          element={
            <ProtectedRoute>
              <Tableau />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tableau/:tabId/carte/:carId"
          element={
            <ProtectedRoute>
              <Carte />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  </React.StrictMode>
);
