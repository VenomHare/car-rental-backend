import z from "zod";

export const AuthRequest = z.object({
    username: z.string().min(1),
    password: z.string().min(1)
}).strict();

export const CreateBookingRequest = z.object({
    carName: z.string().min(1),
    days: z.number().min(1).max(365),
    rentPerDay: z.number().min(1).max(2000)
}).strict();

export const EditBookingRequest = z.object({
    carName: z.string().min(1).optional(),
    days: z.number().min(1).max(365).optional(),
    rentPerDay: z.number().min(1).max(2000).optional()
}).refine((data) => Object.values(data).some(v => v !== undefined)).strict();

export const EditBookingStatusRequest = z.object({
    status: z.enum(["completed", "cancelled", "booked" ])
}).strict();
