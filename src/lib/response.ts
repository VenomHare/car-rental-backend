import type { Response } from "express";

export const sendSuccessResponse = (res: Response, data: object, status?: number) => {
    res.status(status ?? 200).json({
        success: true,
        data
    });
}

export const sendErrorResponse = (res: Response, err: string, status?: number) => {
    res.status(status ?? 500).json({
        success: false,
        error: err
    })
}
