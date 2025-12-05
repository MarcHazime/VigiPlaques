import { Router } from 'express';
import { searchUser, updateUser, getUserById, deleteUser, updatePushToken } from '../controllers/userController';

const router = Router();

router.get('/search', searchUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.put('/:id/push-token', updatePushToken);
router.delete('/:id', deleteUser);

export default router;
