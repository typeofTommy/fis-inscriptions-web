import type {Inscription, Status} from "@/app/types";

export type GenderStatusInfo = {
  canEdit: boolean;
  status: Status | null;
  emailSentAt: Date | null;
  overallStatus: Status;
};

/**
 * Détermine le statut pour un genre spécifique dans une inscription
 */
export const getGenderStatus = (
  inscription: Inscription,
  gender: "M" | "W" | null
): GenderStatusInfo => {
  // Si pas de genre spécifique, utilise le statut global
  if (!gender) {
    return {
      canEdit: inscription.status !== "email_sent",
      status: inscription.status,
      emailSentAt: inscription.emailSentAt,
      overallStatus: inscription.status,
    };
  }

  // Pour les événements mixtes avec statuts par genre
  const genderStatus = gender === "M" ? inscription.menStatus : inscription.womenStatus;
  const genderEmailSentAt = gender === "M" ? inscription.menEmailSentAt : inscription.womenEmailSentAt;
  
  // Le statut du genre spécifique, ou fallback sur le statut global
  const effectiveStatus = genderStatus || inscription.status;
  const effectiveEmailSentAt = genderEmailSentAt || inscription.emailSentAt;

  return {
    canEdit: effectiveStatus !== "email_sent",
    status: effectiveStatus,
    emailSentAt: effectiveEmailSentAt,
    overallStatus: inscription.status,
  };
};

/**
 * Détermine si l'inscription entière a été envoyée (tous les genres)
 */
export const isInscriptionFullySent = (inscription: Inscription): boolean => {
  return inscription.status === "email_sent";
};

/**
 * Détermine si un événement est mixte (contient des hommes et des femmes)
 */
export const isMixedEvent = (eventData: any): boolean => {
  if (!eventData?.genderCodes || !Array.isArray(eventData.genderCodes)) {
    return false;
  }
  
  return eventData.genderCodes.includes("M") && eventData.genderCodes.includes("W");
};