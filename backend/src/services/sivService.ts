// SIV External API is disabled. Returning local placeholder.
export const getVehicleDetails = async (plate: string) => {
    // Return placeholder data so the frontend doesn't break
    // and the controller can proceed to check the local database.
    return {
        immatriculation: plate,
        marque: "Non disponible",
        modele: "Recherche interne",
        version: "Base de données locale"
    };
};
