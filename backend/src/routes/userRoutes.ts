import { Router } from 'express';
import { searchUser, updateUser, getUserById, deleteUser, updatePushToken, blockUser, unblockUser, getBlockedUsers, getBlockStatus } from '../controllers/userController';

const router = Router();

router.get('/search', searchUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.put('/:id/push-token', updatePushToken);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);
router.get('/blocked/:userId', getBlockedUsers);
router.get('/relationship/:userId/:otherId', getBlockStatus);
router.delete('/:id', deleteUser);

export default router;
