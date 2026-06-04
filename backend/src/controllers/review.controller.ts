import { Request, Response } from "express";
import { createDriverReview } from "@/services/review.service";

export const createdReview = async (req: Request, res: Response) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const review = await createDriverReview(bookingId, rating, comment, req.user.id);
    res.status(201).json({ success: true, data: review });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};
