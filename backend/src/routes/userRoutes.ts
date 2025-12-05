import { Router } from 'express';
import { searchUser, updateUser, getUserById, deleteUser } from '../controllers/userController';

const router = Router();

router.get('/search', searchUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
