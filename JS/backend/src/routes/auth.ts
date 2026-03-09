// src/routes/auth.ts
import { Router } from "express";
import { login } from "../middleware/authLogin";

const router = Router();

// Route pour login
router.post("/", login);



export default router;
