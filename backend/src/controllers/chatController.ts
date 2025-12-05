import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getChatHistory = async (req: Request, res: Response) => {
    const { userId1, userId2 } = req.params;

    try {
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId1, receiverId: userId2 },
                    { senderId: userId2, receiverId: userId1 },
                ],
            },
            orderBy: { createdAt: 'asc' },
        });

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserChats = async (req: Request, res: Response) => {
    const { userId } = req.params;
    // This is a bit complex with Prisma to get "latest message per conversation".
    // For simplicity, we might just fetch all messages involving user and group them in JS, 
    // or just return a list of users they have talked to.

    // Simplified: Find all unique users this user has exchanged messages with.
    try {
        const sent = await prisma.message.findMany({
            where: { senderId: userId },
            select: { receiver: true },
            distinct: ['receiverId']
        });
        const received = await prisma.message.findMany({
            where: { receiverId: userId },
            select: { sender: true },
            distinct: ['senderId']
        });

        // Combine and deduplicate
        const users = [...sent.map(m => m.receiver), ...received.map(m => m.sender)];
        const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());

        res.json(uniqueUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

export const uploadImage = async (req: Request, res: Response) => {
    const multerReq = req as MulterRequest;
    if (!multerReq.file) {
        return res.status(400).json({ error: 'Aucune image téléchargée' });
    }

    // Return the URL of the uploaded image
    // Assuming server is running on localhost:3000 for now, client should prepend BASE_URL
    // But wait, client BASE_URL includes /api. 
    // We should return a relative path or full path. 
    // Let's return the relative path from root, client can construct full URL.
    const imageUrl = `/uploads/${multerReq.file.filename}`;
    res.json({ imageUrl });
};
