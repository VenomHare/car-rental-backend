import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import type { AuthRequest } from "../lib/types";
import { sendErrorResponse, sendSuccessResponse } from "../lib/response";
import { CreateBookingRequest, EditBookingStatusRequest } from "../lib/zod.schemas";
import { prisma } from "../lib/prisma";

const bookingRouter = Router();

bookingRouter.post("/", authMiddleware, async (req : AuthRequest, res) => {
    try {
        const { data, success } = CreateBookingRequest.safeParse(req.body);
        if (!success) {
            sendErrorResponse(res, "invalid inputs", 400);
            return
        }

        const bookingData = await prisma.bookings.create({
            data: {
                user_id: req.userId!,
                car_name: data.carName,
                days: data.days,
                rent_per_day: data.rentPerDay,
                status: "booked"
            }
        });

        if (!bookingData) {
            throw new Error("Failed to insert booking data in db");
        }

        const totalCost = data.rentPerDay * data.days;

        sendSuccessResponse(res, {
            "message":"Booking created successfully",
            "bookingId": bookingData.id,
            totalCost
        }, 201);
        return;
    }
    catch(err)
    {
        console.log(err);
        sendErrorResponse(res, "something went wrong");
    }
});

bookingRouter.get("/", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const summary = req.query.summary;
        const bookingId = req.query.bookingId;
        if (summary) {
            const userBookings = await prisma.bookings.findMany({
                where: {
                    user_id: req.userId!
                }
            });
            let totalSpent = 0;
            userBookings.forEach((booking: any) => {
                totalSpent += (booking.days * booking.rent_per_day);
            });

            sendSuccessResponse(res, {
                "userId": req.userId!,
                "username":req.username!,
                "totalBookings": userBookings.length,
                "totalAmountSpent": totalSpent
            }, 200);
            return;
        }
        if (bookingId) {
            const id = parseInt(bookingId as string);
            if (isNaN(id))
            {
                sendErrorResponse(res, "bookingId not found", 404);
                return;
            }

            const bookingData = await prisma.bookings.findUnique({
                where: {
                    id,
                    user_id: req.userId!
                }
            });
            if (!bookingData) {
                sendErrorResponse(res, "bookingId not found", 404);
                return;
            }

            sendSuccessResponse(res,  [
                {
                    "id": bookingData.id,
                    "car_name": bookingData.car_name,
                    "days": bookingData.days,
                    "rent_per_day": bookingData.rent_per_day,
                    "status": bookingData.status,
                    "totalCost": bookingData.days * bookingData.rent_per_day
                }
            ], 200);
            return;
        }
        else {
            const allBookingsData = await prisma.bookings.findMany({
                where : {
                    user_id: req.userId!
                }
            });
            const responseData = allBookingsData.map((b: any) => ({
                "id": b.id,
                "car_name": b.car_name,
                "days": b.days,
                "rent_per_day": b.rent_per_day,
                "status": b.status,
                totalCost: b.days * b.rent_per_day
            }));

            sendSuccessResponse(res, responseData, 200);
            return;
        }

    }
    catch(err)
    {
        console.log(err);
        sendErrorResponse(res, "something went wrong");
    }
});

bookingRouter.put("/:bookingId", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const bookingId = parseInt(req.params.bookingId as string);
        if (isNaN(bookingId)) {
            sendErrorResponse(res, "booking not found", 404);
            return;
        }

        const { success: StatusSuccess, data: statusData } = EditBookingStatusRequest.safeParse(req.body)
        if (StatusSuccess) {
            //status edit request
            const bookingData = await prisma.bookings.findUnique({
                where: {
                    id: bookingId
                }
            });

            if (!bookingData) {
                sendErrorResponse(res, "booking not found", 404);
                return;
            }
            if (bookingData.user_id !== req.userId) {
                sendErrorResponse(res, "booking does not belong to user", 403);
                return;
            }
            const bookingUpdate = await prisma.bookings.update({
                where: {
                    id: bookingId,
                    user_id: req.userId!
                },
                data: {
                    status: statusData.status
                }
            });

            if (!bookingUpdate) {
                throw new Error("Failed to update data in booking table");
            }
            sendSuccessResponse(res, {
                "message":"Booking updated successfully",
                "booking":{
                    "id": bookingUpdate.id,
                    "car_name":bookingUpdate.car_name,
                    "days": bookingUpdate.days,
                    "rent_per_day": bookingUpdate.rent_per_day,
                    "status": bookingUpdate.status,
                    "totalCost": bookingUpdate.days * bookingUpdate.rent_per_day
                }
            }, 200);
            return;

        }
        else {
            const { success, data } = CreateBookingRequest.safeParse(req.body);
            if (!success) {
                sendErrorResponse(res, "invalid inputs", 400);
                return;
            }
            const bookingData = await prisma.bookings.findUnique({
                where: {
                    id: bookingId
                }
            });

            if (!bookingData) {
                sendErrorResponse(res, "booking not found", 404);
                return;
            }
            if (bookingData.user_id !== req.userId) {
                sendErrorResponse(res, "booking does not belong to user", 403);
                return;
            }
            const bookingUpdate = await prisma.bookings.update({
                where: {
                    id: bookingId,
                    user_id: req.userId!
                },
                data: {
                    car_name: data.carName,
                    days: data.days,
                    rent_per_day: data.rentPerDay
                }
            });

            if (!bookingUpdate) {
                throw new Error("Failed to update data in booking table");
            }
            sendSuccessResponse(res, {
                "message":"Booking updated successfully",
                "booking":{
                    "id": bookingUpdate.id,
                    "car_name":bookingUpdate.car_name,
                    "days": bookingUpdate.days,
                    "rent_per_day": bookingUpdate.rent_per_day,
                    "status": bookingUpdate.status,
                    "totalCost": bookingUpdate.days * bookingUpdate.rent_per_day
                }
            }, 200);
            return;
        }

    }
    catch(err){
         console.log(err);
        sendErrorResponse(res, "something went wrong");
    }
});

bookingRouter.delete("/:bookingId", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const bookingId = parseInt(req.params.bookingId as string);
        if (isNaN(bookingId)){
            sendErrorResponse(res, "booking not found", 404);
            return;
        }

        const bookingData = await prisma.bookings.findUnique({
            where: {
                id: bookingId
            }
        });
        if (!bookingData) {
            sendErrorResponse(res, "booking not found", 404);
            return;
        }
        if (bookingData.user_id !== req.userId!) {
            sendErrorResponse(res, "booking does not belong to user", 403);
            return;
        }

        await prisma.bookings.delete({
            where: {
                user_id: req.userId,
                id: bookingId
            }
        });

        sendSuccessResponse(res, {
            "message":"Booking deleted successfully"
        }, 200);
        return;
    }
    catch(err){
         console.log(err);
        sendErrorResponse(res, "something went wrong");
    }
});

export default bookingRouter;
