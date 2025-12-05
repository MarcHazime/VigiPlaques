import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
