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

    if (!email) {
        return res.status(400).json({ error: 'Email requis pour la vérification' });
    }

    try {
        // Check if plate exists in Vehicle table
        const existingVehicle = await prisma.vehicle.findUnique({ where: { plate } });
        if (existingVehicle) {
            return res.status(400).json({ error: 'Plaque déjà enregistrée' });
        }

        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ error: 'Email déjà enregistré' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate Verification OTP
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpires = new Date(Date.now() + 24 * 3600 * 1000); // 24 hours

        // Transaction to create User and Primary Vehicle
        const user = await prisma.$transaction(async (prisma) => {
            const newUser = await prisma.user.create({
                data: {
                    password: hashedPassword,
                    email,
                    isVerified: false,
                    verificationToken: verificationCode,
                    verificationExpires
                },
            });

            await prisma.vehicle.create({
                data: {
                    plate,
                    userId: newUser.id,
                    isPrimary: true
                }
            });

            return newUser;
        });

        // Send Verification Email
        await sendEmail(
            email,
            "Bienvenue sur Plaq'Up - Vérifiez votre compte",
            `Bonjour,\n\nBienvenue sur Plaq'Up !\n\nPour activer votre compte et commencer à utiliser l'application, veuillez saisir le code de vérification suivant :\n\n${verificationCode}\n\nCe code est valable 24 heures.\n\nÀ bientôt,\nL'équipe Plaq'Up`
        );

        res.status(201).json({
            message: 'Inscription réussie. Veuillez vérifier votre email.',
            userId: user.id,
            email: user.email,
            requiresVerification: true,
            primaryPlate: plate
        });
    } catch (error: any) {
        console.error('Registration Error:', error);
        console.error('Registration Error:', error);
        // Return a more specific error if email failed
        if (error.code === 'EAUTH' || error.responseCode === 535) {
            res.status(500).json({ error: "Impossible d'envoyer l'email. Vérifiez les paramètres SMTP." });
        } else {
            res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
        }
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    const { userId, code } = req.body;

    if (!userId || !code) {
        return res.status(400).json({ error: 'ID utilisateur et code requis' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'Compte déjà vérifié' });
        }

        if (user.verificationToken !== code || !user.verificationExpires || user.verificationExpires < new Date()) {
            return res.status(400).json({ error: 'Code invalide ou expiré' });
        }

        // Verify user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                isVerified: true,
                verificationToken: null,
                verificationExpires: null
            }
        });

        res.json({
            message: 'Compte vérifié avec succès',
            userId: updatedUser.id,
            email: updatedUser.email
        });

    } catch (error) {
        console.error('Email Verification Error:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { plate, password } = req.body;

    try {
        // Find vehicle first to get user
        const vehicle = await prisma.vehicle.findUnique({
            where: { plate },
            include: { user: true }
        });

        if (!vehicle) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        const user = vehicle.user;

        if (!user.isVerified) {
            return res.status(401).json({ error: 'Email non vérifié. Veuillez vérifier votre email.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        res.json({
            message: 'Connexion réussie',
            userId: user.id,
            email: user.email,
            primaryPlate: vehicle.plate // The plate they logged in with implies context
        });
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
            "Réinitialisation mot de passe - Plaq'Up",
            `Bonjour,\n\nVoici votre code de réinitialisation : ${code}\n\nCe code est valable 1 heure.\n\nCordialement,\nL'équipe Plaq'Up`
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
