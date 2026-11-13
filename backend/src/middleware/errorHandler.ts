import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: 'Nie znaleziono zasobu' });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // eslint-disable-next-line no-console
  console.error(err);
  const message = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd serwera';
  res.status(500).json({ error: message });
}
