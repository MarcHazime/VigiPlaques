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

        socket.on('send_message', async (data: { senderId: string; receiverId: string; content: string; tempId?: string; imageUrl?: string }) => {
            const { senderId, receiverId, content, tempId, imageUrl } = data;

            // Save to DB
            try {
                const message = await prisma.message.create({
                    data: {
                        senderId,
                        receiverId,
                        content,
                        imageUrl,
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
