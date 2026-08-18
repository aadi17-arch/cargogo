import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import prisma from "@/config/database";
import { AppError } from "@/utils/AppError";

export const getChatHistory = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const userId = req.user!.id;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, shipperId: true, driverId: true }
  });

  if (!booking) {
    throw new AppError("Shipment booking not found.", 404);
  }

  // Security: only allow the shipper or driver of this booking to view the chat history
  if (booking.shipperId !== userId && booking.driverId !== userId) {
    throw new AppError("Access denied to chat history.", 403);
  }

  const messages = await prisma.chatMessage.findMany({
    where: { bookingId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: { id: true, name: true, role: true }
      }
    }
  });

  res.json({ success: true, data: messages });
});
