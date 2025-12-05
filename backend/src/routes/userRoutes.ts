import { Router } from 'express';
import { searchUser, updateUser, getUserById } from '../controllers/userController';

const router = Router();

router.get('/search', searchUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);

export default router;
