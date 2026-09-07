import type { NextFunction, Request, Response } from 'express';

// Evita repetir try/catch em cada controller — encaminha rejeições de Promise
// para o errorHandlerMiddleware central.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
