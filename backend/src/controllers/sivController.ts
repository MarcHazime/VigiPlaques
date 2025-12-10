import { Request, Response } from 'express';
import { getVehicleDetails } from '../services/sivService';
import { extractPlateFromImage } from '../services/ocrService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

export const scanPlate = async (req: Request, res: Response): Promise<void> => {
    const multerReq = req as MulterRequest;
    if (!multerReq.file) {
        res.status(400).json({ error: 'Image requise' });
        return;
    }

    try {
        const plate = await extractPlateFromImage(multerReq.file.buffer);

        if (!plate) {
            res.status(404).json({ error: 'Aucune plaque détectée' });
            return;
        }

        // Reuse the logic to fetch info and check user
        const sivData = await getVehicleDetails(plate);

        const vehicle = await prisma.vehicle.findUnique({
            where: { plate },
            include: { user: { select: { id: true } } }
        });

        const registeredUser = vehicle && vehicle.user ? {
            id: vehicle.user.id,
            plate: vehicle.plate
        } : null;

        res.json({
            ...(sivData as object),
            registeredUser: registeredUser || null,
            detectedPlate: plate
        });

    } catch (error: any) {
        console.error('Scan Error:', error);
        res.status(500).json({ error: error.message || 'Échec du scan de la plaque' });
    }
};

export const getVehicleInfo = async (req: Request, res: Response): Promise<void> => {
    const { plate } = req.params;

    if (!plate) {
        res.status(400).json({ error: 'Plaque requise' });
        return;
    }

    try {
        // Fetch SIV data
        const sivData = await getVehicleDetails(plate);

        // Check if vehicle exists in our DB
        const vehicle = await prisma.vehicle.findUnique({
            where: { plate },
            include: { user: { select: { id: true } } }
        });

        const registeredUser = vehicle && vehicle.user ? {
            id: vehicle.user.id,
            plate: vehicle.plate
        } : null;

        res.json({
            ...(sivData as object),
            registeredUser: registeredUser || null
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Échec de la récupération des détails du véhicule' });
    }
};
