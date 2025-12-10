import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { sendPushNotification } from './services/notificationService';

const prisma = new PrismaClient();

export const setupSocket = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log('User connected:', socket.id);

        socket.on('join_chat', (room: string) => {
            socket.join(room);
            console.log(`User ${socket.id} joined room ${room}`);
        });

        socket.on('send_message', async (data: { senderId: string; receiverId: string; content: string; tempId?: string; imageUrl?: string; relatedPlate?: string }) => {
            const { senderId, receiverId, content, tempId, imageUrl, relatedPlate } = data;

            // Check for Block
            try {
                const block = await prisma.block.findFirst({
                    where: {
                        OR: [
                            { blockerId: receiverId, blockedId: senderId }, // Receiver blocked Sender
                            { blockerId: senderId, blockedId: receiverId }  // Sender blocked Receiver
                        ]
                    }
                });

                if (block) {
                    console.log(`Message blocked between ${senderId} and ${receiverId}`);
                    // Optionally emit an error back to sender
                    socket.emit('message_error', { tempId, error: 'Utilisateur bloqué' });
                    return;
                }

                // Save to DB
                const message = await prisma.message.create({
                    data: {
                        senderId,
                        receiverId,
                        content,
                        imageUrl,
                        relatedPlate
                    },
                });

                // Emit to room
                const room = [senderId, receiverId].sort().join('_');
                io.to(room).emit('receive_message', { ...message, tempId });

                // Send Push Notification
                const receiver = await prisma.user.findUnique({ where: { id: receiverId } });

                // @ts-ignore
                if (receiver?.pushToken) {
                    // @ts-ignore
                    await sendPushNotification(receiver.pushToken, `Nouveau message: ${content}`, { senderId, messageId: message.id });
                }
            } catch (error) {
                console.error('Error saving message:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
