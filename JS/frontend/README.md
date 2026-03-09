# Documentation de l'environnement sur Docker pour un projet test sur Vite JS

## Introduction
Notre projet test est une simple page web. Elle doit afficher les logos de Vite et de React, qui sont cliquables et redirigent chacun vers leur site web respectif. Juste en dessous un bouton avec l'étiquette "count is 0" permet d'incrémenter le nombre affiché à chaque clic. Ensuite, un message personnalisé "Bonjour, Rayan !" est affiché dans un élément `<h2>` suivi de deux lignes de texte "Cet page web est un test du code App.tsx !" et "Click on the Vite and React logos to learn more".

## Structure du projet

![Ceci est la structure du projet test avec la commande tree -L 2](../../../../../../../../Images/Captures%20d’écran/structure.png)

## Etape 1 : Mise en place et construction de notre conteneur

Après avoir installé Docker et Docker Desktop, nous pouvons créer un fichier *Dockerfile* contenant toutes les instructions nécessaires à la construction de notre image Docker, ainsi qu’un fichier *docker-compose.yaml* qui permet de définir et de gérer les différents conteneurs de notre projet.

### Dockerfile
<pre>
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY vite-project/package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code
COPY vite-project/ ./

EXPOSE 5173

CMD ["npm", "run", "dev"]
</pre>

### docker-compose.yaml
<pre>
services:
  conteneur:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    volumes:
      - ./vite-project:/app
      - /app/node_modules
    environment:
      - HOST=0.0.0.0
    command: npm run dev
</pre>

Après, on configure le fichier *vite.config.js* afin de rendre l’application accessible depuis l’extérieur du conteneur. Cette configuration est nécessaire pour permettre l’affichage de la page web via le réseau, notamment lorsque le projet est exécuté dans un environnement Docker.

### vite.config.js
<pre>
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  }
})
</pre>

A présent, nous allons lire le fichier *docker-compose.yaml*, construire les images à partir des instruction du *Dockerfile*, créer le conteneur et le lancer grâce à la commande : `docker compose up --build`

La page web sera accessible depuis cette adresse : `http://localhost:5173`

## Etape 2 Connection avec VS Code 

Après avoir installé l’extension *Dev Containers* dans VS Code, créez un fichier *.devcontainer.json* à la racine de votre projet. Ce fichier permet de configurer l'accès au conteneur Docker récemment créé, et d’utiliser un environnement de développement cohérent et isolé.

Ajoutez notamment l’option "shutdownAction": "none" afin que le conteneur continue de s’exécuter même après la fermeture de VS Code. Cela évite d’avoir à le redémarrer manuellement à chaque réouverture de l’environnement.

### .devcontainer.json
<pre>
{
  "dockerComposeFile": "../docker-compose.yaml",
  "service": "conteneur",
  "workspaceFolder": "/app",
  "shutdownAction": "none"
}
</pre>

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
