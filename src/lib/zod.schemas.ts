import z from "zod";

export const AuthRequest = z.object({
    username: z.string().min(1),
    password: z.string().min(6)
})

export const CreateBookingRequest = z.object({
    carName: z.string().min(1),
    days: z.number().min(1).max(365),
    rentPerDay: z.number().max(2000)
});

export const EditBookingStatusRequest = z.object({
    status: z.enum(["completed", "cancelled", "booked" ])
});
