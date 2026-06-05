import { Request, Response } from "express";
import { createDriverReview } from "@/services/review.service";
import { catchAsync } from "@/utils/catchAsync";

export const createdReview = catchAsync(async (req: Request, res: Response) => {
  const { bookingId, rating, comment } = req.body;
  const review = await createDriverReview(bookingId, rating, comment, req.user.id);
  res.status(201).json({ success: true, data: review });
});
