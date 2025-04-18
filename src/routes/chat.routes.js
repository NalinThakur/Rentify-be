import { Router } from "express";
import {verifyJWT} from "../middlewares/verifyJwt.middlewares.js";
import { getMessages, getUsers, sendMessage } from "../controllers/chat.controllers.js";

const messageRoutes = Router();

messageRoutes.route("/users").get(verifyJWT, getUsers);

messageRoutes.route("/:userId/send").post(verifyJWT, sendMessage);

messageRoutes.route("/:userId/messages").get(verifyJWT, getMessages);

export default messageRoutes;
