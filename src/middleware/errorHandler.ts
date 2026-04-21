import { Request, Response, NextFunction } from 'express'

const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ status: 'error', message: err.message })
}

export default errorHandler