import { Router } from 'express';
import { getVehicleInfo, scanPlate } from '../controllers/sivController';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/:plate', getVehicleInfo);
router.post('/scan', upload.single('image'), scanPlate);

export default router;
