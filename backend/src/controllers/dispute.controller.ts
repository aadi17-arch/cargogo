import { Request, Response } from "express";
import { fileDispute } from "@/services/review.service";

export const createDipute = async (req: Request, res: Response) => {
  try {
    const { bookingId, reason } = req.body;
    const dispute = await fileDispute(bookingId, reason, req.user.id);
    res.status(201).json({success:true,data:dispute});
  } catch (e:any){
    res.status(400).json({success:false,message:e.message})
  }
}
