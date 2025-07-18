export const translations = {
  auth: {
    login: "Connexion",
    signup: "Inscription",
    scanIdCard: "Scanner votre carte d'identité",
    completeProfile: "Compléter votre profil",
    address: "Adresse",
    mobile: "Téléphone mobile",
    email: "Email",
    password: "Mot de passe",
    submit: "Valider",
    cancel: "Annuler",
  },
  animals: {
    myAnimals: "Mes Animaux",
    scanNfc: "Scanner NFC",
    search: "Rechercher",
    newAnimal: "Nouvel Animal",
    claimAnimal: "Réclamer cet animal",
    registerAnimal: "Enregistrer un nouvel animal",
    animalInfo: "Informations de l'animal",
    name: "Nom",
    birthdate: "Date de naissance",
    race: "Race",
    gender: "Genre",
    male: "Mâle",
    female: "Femelle",
    edit: "Modifier",
    save: "Enregistrer",
    delete: "Supprimer",
  },
  common: {
    loading: "Chargement...",
    error: "Une erreur est survenue",
    success: "Opération réussie",
    retry: "Réessayer",
    back: "Retour",
    next: "Suivant",
    confirm: "Confirmer",
  },
  permissions: {
    nfc: "L'accès NFC est nécessaire pour scanner les puces",
    camera: "L'accès à la caméra est nécessaire pour scanner les documents",
    location:
      "L'accès à la localisation est nécessaire pour certaines fonctionnalités",
  },
  errors: {
    scanFailed: "Échec du scan",
    nfcNotSupported: "NFC non supporté sur cet appareil",
    cameraNotAvailable: "Caméra non disponible",
    invalidIdCard: "Carte d'identité invalide",
    networkError: "Erreur de connexion",
    unknownError: "Une erreur inconnue est survenue",
  },
} as const;

export type Translations = typeof translations;
