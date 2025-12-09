import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const searchUser = async (req: Request, res: Response) => {
    const { plate } = req.query;

    if (!plate || typeof plate !== 'string') {
        return res.status(400).json({ error: 'Plate query parameter is required' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { plate },
            select: { id: true, plate: true, createdAt: true } // Don't return everything if sensitive
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, plate: true, createdAt: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { plate, email, password } = req.body;

    try {
        const data: any = {};
        if (plate) data.plate = plate;
        if (email) data.email = email;
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data,
        });

        res.json({ message: 'User updated successfully', user: { id: user.id, plate: user.plate, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updatePushToken = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { pushToken } = req.body;

    try {
        await prisma.user.update({
            where: { id },
            data: { pushToken },
        });

        res.json({ message: 'Push token updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // Delete messages first
        await prisma.message.deleteMany({
            where: {
                OR: [
                    { senderId: id },
                    { receiverId: id }
                ]
            }
        });

        // Delete blocks
        await prisma.block.deleteMany({
            where: {
                OR: [
                    { blockerId: id },
                    { blockedId: id }
                ]
            }
        });

        await prisma.user.delete({
            where: { id },
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const blockUser = async (req: Request, res: Response) => {
    const { blockerId, blockedId } = req.body;
    try {
        // Check if already blocked to avoid unique constraint error
        const existing = await prisma.block.findUnique({
            where: {
                blockerId_blockedId: { blockerId, blockedId }
            }
        });

        if (existing) return res.json({ message: 'User already blocked' });

        await prisma.block.create({
            data: { blockerId, blockedId }
        });
        res.json({ message: 'User blocked' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error blocking user' });
    }
};

export const unblockUser = async (req: Request, res: Response) => {
    const { blockerId, blockedId } = req.body;
    try {
        await prisma.block.deleteMany({
            where: { blockerId, blockedId }
        });
        res.json({ message: 'User unblocked' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error unblocking user' });
    }
};

export const getBlockedUsers = async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        const blocks = await prisma.block.findMany({
            where: { blockerId: userId },
            include: { blocked: { select: { id: true, plate: true } } }
        });
        res.json(blocks.map(b => b.blocked));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching blocked users' });
    }
};
// Check relationship status (bidirectional block check)
export const getBlockStatus = async (req: Request, res: Response) => {
    const { userId, otherId } = req.params;

    try {
        const blocks = await prisma.block.findMany({
            where: {
                OR: [
                    { blockerId: userId, blockedId: otherId }, // I blocked them
                    { blockerId: otherId, blockedId: userId }  // They blocked me
                ]
            }
        });

        const blockedByMe = blocks.some(b => b.blockerId === userId);
        const blockedByOther = blocks.some(b => b.blockerId === otherId);

        res.json({ blockedByMe, blockedByOther });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching block status' });
    }
};
