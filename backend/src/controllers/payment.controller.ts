import { Request, Response,NextFunction } from "express";
import { processMockPayment } from "@/services/payment.service";
import { catchAsync } from "@/utils/catchAsync";

export const checkout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

  const { bookingId, paymentMethod, amount } = req.body;
  const receipt = await processMockPayment(bookingId, paymentMethod, amount);
  res.status(200).json({ success: true, data: receipt });
});
