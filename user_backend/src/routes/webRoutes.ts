import { Router } from 'express';
import { home } from '../controllers/defaultController';

 
const router = Router();

router.get('/', home as any);  

export default router; 

