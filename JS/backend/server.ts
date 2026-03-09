import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import tabRoute from "./src/routes/route";
import upload from './src/routes/upload';
import login from "./src/routes/auth";
import path, { join } from "path";


// Charger les variables d'environnement depuis .env
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", tabRoute);
app.use("/api/login", login);
app.use('/api', upload);
app.use('/image', express.static(path.join(__dirname, 'public/image')));

// Configuration du port
const port = process.env.PORT || 5000;

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Backend démarré sur http://localhost:${port}`);
});
