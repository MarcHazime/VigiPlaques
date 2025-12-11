import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getChatHistory = async (req: Request, res: Response) => {
    const { userId1, userId2 } = req.params;
    const { relatedPlate } = req.query;

    try {
        const whereClause: any = {
            OR: [
                { senderId: userId1, receiverId: userId2, deletedBySender: false },
                { senderId: userId2, receiverId: userId1, deletedByReceiver: false }
            ]
        };

        // if (relatedPlate) {
        //     whereClause.relatedPlate = relatedPlate;
        // }

        const finalMessages = await prisma.message.findMany({
            where: whereClause,
            orderBy: { createdAt: 'asc' }
        });

        res.json(finalMessages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteConversation = async (req: Request, res: Response) => {
    const { userId, partnerId } = req.params;

    try {
        // Mark messages sent by userId as deletedBySender
        await prisma.message.updateMany({
            where: { senderId: userId, receiverId: partnerId },
            data: { deletedBySender: true }
        });

        // Mark messages received by userId as deletedByReceiver
        await prisma.message.updateMany({
            where: { senderId: partnerId, receiverId: userId },
            data: { deletedByReceiver: true }
        });

        res.json({ message: 'Conversation deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserChats = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        // Fetch current user's vehicles to determine "My Scope"
        const myVehicles = await prisma.vehicle.findMany({
            where: { userId },
            select: { plate: true, isPrimary: true }
        });
        const myVehiclePlates = new Set(myVehicles.map(v => v.plate));
        const myPrimary = myVehicles.find(v => v.isPrimary)?.plate || myVehicles[0]?.plate || 'Unknown';

        // Fetch all messages involving the user
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, deletedBySender: false },
                    { receiverId: userId, deletedByReceiver: false }
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        vehicles: { where: { isPrimary: true }, select: { plate: true } }
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        email: true,
                        vehicles: { where: { isPrimary: true }, select: { plate: true } }
                    }
                },
            }
        });

        // Group by conversation
        const conversations = new Map();

        for (const msg of messages) {
            const isSender = msg.senderId === userId;
            const partner = isSender ? msg.receiver : msg.sender;
            const plate = msg.relatedPlate || 'Unknown';
            // Group by User only to avoid duplicates
            const key = partner.id;

            if (!conversations.has(key)) {
                // Determine My Scope (Which of my plates is this about?)
                // If the subject is one of my plates -> That's the scope.
                // If the subject is THEIR plate -> I am using my Primary.
                const myScope = myVehiclePlates.has(plate) ? plate : myPrimary;

                // Determine Other Display (What plate title to show for them?)
                // If the subject is THEIR plate -> Show that.
                // If the subject is MY plate -> Show their Primary.

                // Check if plate belongs to me
                const isMyPlate = myVehiclePlates.has(plate);
                const partnerPrimary = partner.vehicles[0]?.plate || 'Inconnu';

                // If subject is my plate -> Show partner's primary
                // If subject is NOT my plate (so it's theirs) -> Show subject
                const otherDisplay = isMyPlate ? partnerPrimary : plate;

                conversations.set(key, {
                    id: partner.id,
                    partnerId: partner.id,
                    email: partner.email,
                    relatedPlate: plate, // Keep atomic context
                    lastMessage: msg.content,
                    timestamp: msg.createdAt,
                    myScope, // Frontend will use this to group in tabs
                    otherDisplay, // Frontend will use this as Title
                    unreadCount: 0 // Initialize
                });
            }

            // Increment unread count if message is received, not read, and not deleted
            if (!isSender && !msg.isRead && !msg.deletedByReceiver) {
                const conv = conversations.get(key);
                conv.unreadCount += 1;
            }
        }

        // Increment unread count if message is received, not read, and not deleted
        if (!isSender && !msg.isRead && !msg.deletedByReceiver) {
            const conv = conversations.get(key);
            conv.unreadCount += 1;
        }
    }

        res.json(Array.from(conversations.values()));
} catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
}
}

export const markMessagesAsRead = async (req: Request, res: Response) => {
    const { userId, partnerId } = req.params;

    try {
        await prisma.message.updateMany({
            where: {
                receiverId: userId,
                senderId: partnerId,
                isRead: false
            },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const markMessagesAsRead = async (req: Request, res: Response) => {
    const { userId, partnerId } = req.params;

    try {
        await prisma.message.updateMany({
            where: {
                receiverId: userId,
                senderId: partnerId,
                isRead: false
            },
            data: { isRead: true }
        });

        res.json({ success: true });
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
