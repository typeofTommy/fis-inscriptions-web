"use client";

import React, {useState, useEffect, useMemo} from "react";
import {toast} from "@/components/ui/use-toast";

export type Recipient = {
  email: string;
  name: string;
  surname: string;
  reason: string;
  isResolvable: boolean;
};

// New type for processed recipients
type DisplayRecipient = {
  id: string; // Unique key for React, email will be used
  email: string;
  name: string;
  surname: string;
  reasons: string[];
  isResolvable: boolean;
};

// Update RecipientManagerProps to include new props and remove onSendPdf
type RecipientManagerProps = {
  initialRecipients: Recipient[];
  gender?: "M" | "W";
  inscriptionId: string; // Added
  competitionName: string; // Added
};

// Email constants for predefined recipients
const PREDEFINED_EMAILS = {
  ALL_RACES: [
    {email: "pmartin@ffs.fr", name: "P. Martin", reason: "Automatique FFS"},
    {
      email: "jmagnellet@orange.fr",
      name: "J.M Agnellet",
      reason: "Automatique FFS",
    },
    {email: "dchastan@ffs.fr", name: "D. Chastan", reason: "Automatique FFS"},
    {
      email: "mbeauregard@ffs.fr",
      name: "M. Beauregard",
      reason: "Automatique FFS",
    },
  ],
  WOMEN: [
    {
      email: "lionelpellicier@gmail.com",
      name: "L. Pellicier",
      reason: "Courses Femmes",
    },
  ],
  MEN: [
    {
      email: "perrin.frederic3@gmail.com",
      name: "F. Perrin",
      reason: "Courses Hommes",
    },
  ],
};

const getBadgeClassForReason = (reason: string): string => {
  const baseClasses =
    "px-2 py-0.5 text-xs font-medium rounded-full mr-1 mb-1 inline-block";
  if (reason.toLowerCase().includes("créateur")) {
    return `${baseClasses} bg-green-100 text-green-700`;
  }
  if (reason.toLowerCase().includes("modifié")) {
    return `${baseClasses} bg-yellow-100 text-yellow-700`;
  }
  if (reason.toLowerCase().includes("actuel")) {
    return `${baseClasses} bg-blue-100 text-blue-700`;
  }
  if (
    reason.toLowerCase().includes("inconnu") ||
    reason.toLowerCase().includes("non fourni")
  ) {
    return `${baseClasses} bg-gray-100 text-gray-700`;
  }
  if (reason.toLowerCase().includes("automatique")) {
    return `${baseClasses} bg-indigo-100 text-indigo-700`;
  }
  if (reason.toLowerCase().includes("femmes")) {
    return `${baseClasses} bg-pink-100 text-pink-700`;
  }
  if (reason.toLowerCase().includes("hommes")) {
    return `${baseClasses} bg-blue-100 text-blue-700`;
  }
  return `${baseClasses} bg-purple-100 text-purple-700`; // Default for other reasons
};

export const RecipientManager: React.FC<RecipientManagerProps> = ({
  initialRecipients,
  gender,
  inscriptionId, // Use new prop
  competitionName, // Use new prop
}) => {
  const [selectedRecipients, setSelectedRecipients] = useState<
    Record<string, boolean>
  >({});
  const [customEmails, setCustomEmails] = useState<DisplayRecipient[]>([]);
  const [newEmail, setNewEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");

  // State for API call UI feedback
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // const {user} = useUser(); // Removed as unused
  // console.log({user}); // Keep for debugging if needed, or remove

  const predefinedRecipients = useMemo(() => {
    const processedEmails: DisplayRecipient[] = [];
    PREDEFINED_EMAILS.ALL_RACES.forEach(({email, name, reason}) => {
      processedEmails.push({
        id: `predefined-${email}`,
        email,
        name,
        surname: "",
        reasons: [reason],
        isResolvable: true,
      });
    });
    if (gender === "W") {
      PREDEFINED_EMAILS.WOMEN.forEach(({email, name, reason}) => {
        processedEmails.push({
          id: `predefined-${email}`,
          email,
          name,
          surname: "",
          reasons: [reason],
          isResolvable: true,
        });
      });
    } else if (gender === "M") {
      PREDEFINED_EMAILS.MEN.forEach(({email, name, reason}) => {
        processedEmails.push({
          id: `predefined-${email}`,
          email,
          name,
          surname: "",
          reasons: [reason],
          isResolvable: true,
        });
      });
    }
    return processedEmails;
  }, [gender]);

  const displayRecipients = useMemo(() => {
    const processedMap = new Map<string, DisplayRecipient>();
    initialRecipients.forEach((rec) => {
      const existing = processedMap.get(rec.email);
      if (existing) {
        if (!existing.reasons.includes(rec.reason)) {
          existing.reasons.push(rec.reason);
        }
        if (rec.isResolvable && !existing.isResolvable) {
          existing.isResolvable = true;
          if (rec.name !== "Utilisateur inconnu") {
            existing.name = rec.name;
            existing.surname = rec.surname;
          }
        }
      } else {
        processedMap.set(rec.email, {
          id: rec.email,
          email: rec.email,
          name: rec.name,
          surname: rec.surname,
          reasons: [rec.reason],
          isResolvable: rec.isResolvable,
        });
      }
    });
    predefinedRecipients.forEach((rec) => {
      if (!processedMap.has(rec.email)) {
        processedMap.set(rec.email, rec);
      } else {
        const existing = processedMap.get(rec.email)!;
        if (!existing.reasons.includes(rec.reasons[0])) {
          existing.reasons.push(rec.reasons[0]);
        }
      }
    });
    return Array.from(processedMap.values());
  }, [initialRecipients, predefinedRecipients]);

  const allRecipients = useMemo(() => {
    return [...displayRecipients, ...customEmails];
  }, [displayRecipients, customEmails]);

  useEffect(() => {
    setSelectedRecipients((prev) => {
      const updated: Record<string, boolean> = {...prev};
      allRecipients.forEach((recipient) => {
        if (!(recipient.email in updated)) {
          updated[recipient.email] = recipient.isResolvable;
        }
      });
      // Optionnel : supprimer les emails qui n'existent plus dans allRecipients
      Object.keys(updated).forEach((email) => {
        if (!allRecipients.some((r) => r.email === email)) {
          delete updated[email];
        }
      });
      return updated;
    });
  }, [allRecipients]);

  const handleCheckboxChange = (email: string, isResolvable: boolean) => {
    if (!isResolvable) return;
    setSelectedRecipients((prev) => ({
      ...prev,
      [email]: !prev[email],
    }));
  };

  const validateEmail = (email: string): boolean => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const addCustomEmail = () => {
    if (!newEmail.trim()) {
      setEmailError("Veuillez entrer une adresse email");
      return;
    }
    if (!validateEmail(newEmail)) {
      setEmailError("Veuillez entrer une adresse email valide");
      return;
    }
    if (allRecipients.some((recipient) => recipient.email === newEmail)) {
      setEmailError("Cette adresse email est déjà ajoutée");
      return;
    }
    const customRecipient: DisplayRecipient = {
      id: `custom-${newEmail}`,
      email: newEmail,
      name: "Email personnalisé",
      surname: "",
      reasons: ["Email ajouté manuellement"],
      isResolvable: true,
    };
    setCustomEmails((prev) => [...prev, customRecipient]);
    setNewEmail("");
    setEmailError("");
  };

  const removeCustomEmail = (email: string) => {
    setCustomEmails((prev) => prev.filter((rec) => rec.email !== email));
    setSelectedRecipients((prev) => {
      const newState = {...prev};
      delete newState[email];
      return newState;
    });
  };

  const handleSendPdf = async () => {
    const element = document.getElementById("pdf-content");
    if (!element) return;

    const toastInstance = toast({
      title: "Envoi de l'email en cours...",
      description: "Le PDF est en cours d'envoi aux destinataires.",
      open: true,
      duration: 1000000, // très long
    });
    const toastId = toastInstance.id;

    // Import dynamique pour éviter les erreurs de type
    const html2canvas = (await import("html2canvas-pro")).default;
    const jsPDF = (await import("jspdf")).default;

    // Génère le canvas avec html2canvas-pro (qualité élevée, poids réduit)
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: "#fff",
    });
    // Convertit le canvas en image JPEG (poids réduit)
    const imgData = canvas.toDataURL("image/jpeg", 0.98);

    // Crée le PDF avec jsPDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "cm",
      format: "a4",
    });
    // Dimensions du canvas/image
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Marge horizontale de 1cm
    const margin = 1;
    const availableWidth = pageWidth - 2 * margin;
    const availableHeight = pageHeight - 2 * margin;
    const ratio = Math.min(
      availableWidth / imgWidth,
      availableHeight / imgHeight
    );
    const displayWidth = imgWidth * ratio;
    const displayHeight = imgHeight * ratio;
    const x = (pageWidth - displayWidth) / 2;
    const y = (pageHeight - displayHeight) / 2;
    pdf.addImage(imgData, "JPEG", x, y, displayWidth, displayHeight);

    // Blob du PDF
    const pdfBlob = pdf.output("blob");

    setIsSending(true);
    setSendStatus(null);

    try {
      const formData = new FormData();
      const selectedEmails = Object.entries(selectedRecipients)
        .filter(([, isSelected]) => isSelected)
        .map(([email]) => email);
      if (selectedEmails.length === 0) {
        setSendStatus({
          message: "Veuillez sélectionner au moins un destinataire.",
          type: "error",
        });
        setIsSending(false);
        return;
      }
      formData.append("pdf", pdfBlob, "inscription.pdf");
      formData.append("to", JSON.stringify(selectedEmails));
      formData.append("inscriptionId", inscriptionId);
      formData.append(
        "subject",
        (() => {
          let subject = `Inscription FIS: ${competitionName}`;
          if (typeof window !== "undefined") {
            const place = document
              .querySelector("[data-fis-place]")
              ?.textContent?.trim();
            const date = document
              .querySelector("[data-fis-date]")
              ?.textContent?.trim();
            if (place) subject += ` - ${place}`;
            if (date) subject += ` - ${date}`;
          }
          if (gender) subject += ` (${gender})`;
          return subject;
        })()
      );
      if (gender) formData.append("gender", gender);

      const response = await fetch("/api/send-inscription-pdf", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.details || result.error || "Erreur lors de l'envoi de l'email"
        );
      }
      setSendStatus({
        message:
          "PDF envoyé avec succès ! Email ID: " + (result.emailId || "N/A"),
        type: "success",
      });
      // Met à jour le toast en succès
      if (toastInstance && toastInstance.update) {
        toastInstance.update({
          id: toastId,
          title: "Email envoyé !",
          description: "Le PDF a bien été envoyé aux destinataires.",
          open: true,
          duration: 1000000,
          variant: "default",
        });
      }
    } catch (error: any) {
      setSendStatus({
        message: error.message || "Une erreur est survenue lors de l'envoi.",
        type: "error",
      });
      // Met à jour le toast en erreur
      if (toastInstance && toastInstance.update) {
        toastInstance.update({
          id: toastId,
          title: "Erreur lors de l'envoi",
          description:
            error.message || "Une erreur est survenue lors de l'envoi.",
          open: true,
          duration: 1000000,
          variant: "destructive",
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mt-6 p-4 border-t border-gray-200 print:hidden">
      <h3 className="text-lg font-semibold mb-3">
        Gérer les destinataires et envoyer le PDF
      </h3>

      {/* Display API Call Status */}
      {sendStatus && (
        <div
          className={`p-3 mb-3 rounded-md text-sm ${
            sendStatus.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {sendStatus.message}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendPdf();
        }}
      >
        <div className="space-y-4">
          {allRecipients.map((recipient) => (
            <div
              key={recipient.id}
              className={`p-3 border rounded-lg flex items-start space-x-3 ${
                recipient.isResolvable
                  ? "border-gray-300"
                  : "border-red-300 bg-red-50"
              }`}
            >
              <input
                type="checkbox"
                id={`recipient-${recipient.email}`}
                checked={selectedRecipients[recipient.email] || false}
                onChange={() =>
                  handleCheckboxChange(recipient.email, recipient.isResolvable)
                }
                disabled={!recipient.isResolvable || isSending}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
              />
              <div className="flex-1">
                <label
                  htmlFor={`recipient-${recipient.email}`}
                  className={`font-medium ${
                    recipient.isResolvable ? "text-gray-800" : "text-red-600"
                  }`}
                >
                  {recipient.name} {recipient.surname}
                  {!recipient.isResolvable && " (Email Invalide/Manquant)"}
                </label>
                <p className="text-xs text-gray-500">{recipient.email}</p>
                <div>
                  {recipient.reasons.map((reason) => (
                    <span
                      key={reason}
                      className={getBadgeClassForReason(reason)}
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
              {recipient.id.startsWith("custom-") && (
                <button
                  type="button"
                  onClick={() => removeCustomEmail(recipient.email)}
                  disabled={isSending}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 cursor-pointer"
                >
                  Supprimer
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <label
            htmlFor="customEmail"
            className="block text-sm font-medium text-gray-700"
          >
            Ajouter un email personnalisé :
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="email"
              id="customEmail"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              placeholder="adresse@example.com"
              disabled={isSending}
              className="flex-1 block w-full min-w-0 rounded-none rounded-l-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50 px-3"
            />
            <button
              type="button"
              onClick={addCustomEmail}
              disabled={isSending}
              className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 rounded-r-md hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 cursor-pointer"
            >
              Ajouter
            </button>
          </div>
          {emailError && (
            <p className="mt-1 text-xs text-red-600">{emailError}</p>
          )}
        </div>

        <div className="mt-6 text-right">
          <button
            type="submit"
            disabled={isSending || allRecipients.length === 0}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:opacity-70 cursor-pointer"
          >
            {isSending ? "Envoi en cours..." : "Envoyer le PDF par Email"}
          </button>
        </div>
      </form>
    </div>
  );
};
