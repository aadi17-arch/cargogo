import { Request, Response } from "express";
import { fileDispute } from "@/services/review.service";
import { catchAsync } from "@/utils/catchAsync";

export const createDipute = catchAsync(async (req: Request, res: Response) => {
  const { bookingId, reason } = req.body;
  const dispute = await fileDispute(bookingId, reason, req.user.id);
  res.status(201).json({success:true,data:dispute});
});
