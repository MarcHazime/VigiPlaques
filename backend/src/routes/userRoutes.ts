import { Router } from 'express';
import { searchUser, updateUser, getUserById, deleteUser, updatePushToken, blockUser, unblockUser, getBlockedUsers, getBlockStatus } from '../controllers/userController';
import * as UserController from '../controllers/userController'; // Assuming UserController is now imported as a whole object for new routes

const router = Router();

router.get('/:userId/vehicles', UserController.getVehicles);
router.post('/:userId/vehicles', UserController.addVehicle);
router.delete('/:userId/vehicles/:id', UserController.deleteVehicle);

router.get('/search', UserController.searchUser); // ?plate=AA-123-BBr.get('/:id', getUserById);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.put('/:id/push-token', updatePushToken);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);
router.get('/blocked/:userId', getBlockedUsers);
router.get('/relationship/:userId/:otherId', getBlockStatus);
router.delete('/:id', deleteUser);

export default router;
