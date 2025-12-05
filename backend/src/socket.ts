import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

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

                // Emit to room (room id could be sorted user ids to be unique per pair)
                // For simplicity, let's assume client sends a unique room ID or we construct it.
                // Better: emit to receiver's personal room if they are online, or a shared chat room.
                // Let's use a shared room ID convention: sorted IDs joined by underscore.
                const room = [senderId, receiverId].sort().join('_');

                io.to(room).emit('receive_message', { ...message, tempId });
            } catch (error) {
                console.error('Error saving message:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
