import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from "zod";

export const validateRequest = (schema: AnyZodObject) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      return next();
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation Failed',
          errors: e.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          })),
        });

      }
      return next(e);
    }
  }
}
