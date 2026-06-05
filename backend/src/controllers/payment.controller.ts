import { Request, Response,NextFunction } from "express";
import { processMockPayemnt } from "@/services/payment.service";
import { catchAsync } from "@/utils/catchAsync";

export const checkout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

  const { bookingId, paymentMethod, amount } = req.body;
  const receipt = await processMockPayemnt(bookingId, paymentMethod, amount);
  res.status(200).json({ sucess: true, data: receipt });
});
