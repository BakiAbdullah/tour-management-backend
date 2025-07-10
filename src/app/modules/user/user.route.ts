import { Router } from "express";
import { userControllers } from "./user.controller";


const router = Router();

// Final routes for user registration
router.post("/register", userControllers.createUser);
router.get("/all-users", userControllers.getAllUsers);


export const UserRoutes = router; 