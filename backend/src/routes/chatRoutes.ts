import { Router } from 'express';
import { getChatHistory, getUserChats, uploadImage, deleteConversation } from '../controllers/chatController';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
const router = Router();

router.get('/history/:userId1/:userId2', getChatHistory);
router.get('/list/:userId', getUserChats);
router.post('/upload', upload.single('image'), uploadImage);
router.delete('/:userId/:partnerId', deleteConversation);

export default router;
