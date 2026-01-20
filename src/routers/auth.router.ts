import { Router } from "express";
import { sendErrorResponse, sendSuccessResponse } from "../lib/response";
import { AuthRequest } from "../lib/zod.schemas";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const authRouter = Router()

authRouter.post("/signup", async (req, res) => {
    try {
        const { success, data, error } = AuthRequest.safeParse(req.body);
        if (!success) {
            console.log(error);
            sendErrorResponse(res, "invalid inputs", 400);
            return;
        }
        const existingUser = await prisma.users.findFirst({
            where: {
                username: data.username
            }
        });
        if (existingUser) {
            sendErrorResponse(res, "username already exists", 409);
            return
        }

        const hashedPassword = bcrypt.hashSync(data.password, 10);
        const createdUserData = await prisma.users.create({
            data: {
                username: data.username,
                password: hashedPassword
            }
        });

        if (!createdUserData) {
            throw new Error("Failed to Insert Data in users table");
        }

        sendSuccessResponse(res, {
            "message":"User created successfully",
            "userId": createdUserData.id
        }, 201);
        return;
    }
    catch(err){
        console.log(err);
        sendErrorResponse(res, "something went wrong");
        return
    }
});

authRouter.post("/login", async (req, res) => {
    try {
        const { success, data, error } = AuthRequest.safeParse(req.body);
        if (!success) {
            sendErrorResponse(res, "invalid inputs", 400);
            return;
        }

        const userData = await prisma.users.findUnique({
            where: {
                username: data.username
            }
        });

        if (!userData) {
            sendErrorResponse(res, "user does not exist", 401);
            return;
        }
        const isPasswordCorrect = bcrypt.compareSync(data.password, userData.password);
        if (!isPasswordCorrect) {
            sendErrorResponse(res, "incorrect password", 401);
            return
        }

        const JWT_SECRET = process.env.JWT_SECRET!;
        const token = jwt.sign({
            userId: userData.id,
            username: userData.username
        }, JWT_SECRET);

        sendSuccessResponse(res, {
            "message":"Login successful",
            token
        }, 200);
        return;
    }
    catch(err){
        console.log(err);
        sendErrorResponse(res, "something went wrong");
        return
    }
});

export default authRouter
