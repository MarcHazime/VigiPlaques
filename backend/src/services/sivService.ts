const SIV_API_URL = 'https://api.apiplaqueimmatriculation.com/plaque';
const SIV_TOKEN = 'TokenDemo2025A'; // In production, use env var

export const getVehicleDetails = async (plate: string) => {
    try {
        const response = await fetch(`${SIV_API_URL}?immatriculation=${plate}&token=${SIV_TOKEN}&pays=FR`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error(`SIV API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('SIV Service Error:', error);
        throw error;
    }
};
