import express from "express";
import {
  getUsers,
  login,
  signup,
  updateUser,
  logout,
} from "../controllers/user.js";

import { authenticate } from "../middlewares/auth.js";
const router = express.Router();


router.get("/users", authenticate, getUsers);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.put("/users/:id/update", authenticate, updateUser);


export default router;