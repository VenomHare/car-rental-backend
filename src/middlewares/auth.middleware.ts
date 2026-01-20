import { NextFunction, Response } from "express";
import { AuthRequest } from "../lib/types";
import { sendErrorResponse } from "../lib/response";
import jwt from "jsonwebtoken";

interface JwtPayload {
    userId: string,
    username: string
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            sendErrorResponse(res, "Authorization header missing", 401);
            return;
        }
        const jwtToken = token.split(" ")[1];
        if (!jwtToken) {
            sendErrorResponse(res, "Token missing after Bearer", 401);
            return;
        }
        try {
            const JWT_SECRET = process.env.JWT_SECRET!;
            const payload = jwt.verify(jwtToken, JWT_SECRET) as JwtPayload;
            const userId = parseInt(payload.userId);
            if (isNaN(userId)) {
                throw new Error("Invalid userId in Jwt");
            }
            req.userId = userId;
            req.username = payload.username;
            next();
        }
        catch {
            sendErrorResponse(res, "Token invalid", 401);
            return;
        }
    }
    catch(err) {
        console.log(err);
        sendErrorResponse(res, "Unauthorized", 401);
    }
}
