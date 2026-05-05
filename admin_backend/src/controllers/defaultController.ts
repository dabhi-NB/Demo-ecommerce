import { Request, Response, NextFunction } from 'express';

export const home = async (req: Request, res: Response, next: NextFunction) => {
    res.send('API is running');
};