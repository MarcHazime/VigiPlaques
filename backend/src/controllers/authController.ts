import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../services/emailService';

const prisma = new PrismaClient();
const PLATE_REGEX = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/;

export const register = async (req: Request, res: Response) => {
    const { plate, password, email } = req.body;

    if (!plate || !PLATE_REGEX.test(plate)) {
        return res.status(400).json({ error: 'Format de plaque invalide (ex: AA-123-BB)' });
    }

    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { plate } });
        if (existingUser) {
            return res.status(400).json({ error: 'Plaque déjà enregistrée' });
        }

        if (email) {
            const existingEmail = await prisma.user.findUnique({ where: { email } });
            if (existingEmail) {
                return res.status(400).json({ error: 'Email déjà enregistré' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                plate,
                password: hashedPassword,
                email: email || null
            },
        });

        res.status(201).json({ message: 'Inscription réussie', userId: user.id, plate: user.plate, email: user.email });
    } catch (error: any) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { plate, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { plate } });
        if (!user) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        res.json({ message: 'Connexion réussie', userId: user.id, plate: user.plate, email: user.email });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email requis' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Security: Don't reveal if user exists
            return res.json({ message: 'Si cet email existe, un code a été envoyé.' });
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: code,
                resetTokenExpires: expires
            }
        });

        // Send Email (Real or Dev Mode handled by service)
        await sendEmail(
            email,
            "Réinitialisation mot de passe - VigiPlaque",
            `Bonjour,\n\nVoici votre code de réinitialisation : ${code}\n\nCe code est valable 1 heure.\n\nCordialement,\nL'équipe VigiPlaque`
        );

        res.json({ message: 'Si cet email existe, un code a été envoyé.' });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ error: 'Erreur interne' });
    }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || user.resetToken !== code || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
            return res.status(400).json({ error: 'Code invalide ou expiré' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpires: null
            }
        });

        res.json({ message: 'Mot de passe réinitialisé avec succès' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ error: 'Erreur interne' });
    }
};
