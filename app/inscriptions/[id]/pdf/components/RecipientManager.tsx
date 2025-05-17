"use client";

import {useUser} from "@clerk/nextjs";
import React, {useState, useEffect, useMemo} from "react";

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

type RecipientManagerProps = {
  initialRecipients: Recipient[];
  onSendPdf: (selectedEmails: string[]) => Promise<void>;
  gender?: "M" | "W"; // Optional gender parameter for race-specific emails
};

// Email constants for predefined recipients
const PREDEFINED_EMAILS = {
  ALL_RACES: [
    {email: "pmartin@ffs.fr", name: "P. Martin", reason: "Automatique FFS"},
    {
      email: "jmagnellet@orange.fr",
      name: "J. Magnellet",
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
  onSendPdf,
  gender,
}) => {
  const [selectedRecipients, setSelectedRecipients] = useState<
    Record<string, boolean>
  >({});
  const [customEmails, setCustomEmails] = useState<DisplayRecipient[]>([]);
  const [newEmail, setNewEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");

  const {user} = useUser();
  console.log({user}); // Keep for debugging if needed, or remove

  // Process all predefined emails based on race type
  const predefinedRecipients = useMemo(() => {
    const processedEmails: DisplayRecipient[] = [];

    // Add emails for all races
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

    // Add gender-specific emails
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
          // Update name/surname if the new one is from a resolvable source
          // and the current one might be from an unresolvable one (e.g. "Utilisateur Inconnu")
          if (rec.name !== "Utilisateur inconnu") {
            existing.name = rec.name;
            existing.surname = rec.surname;
          }
        }
      } else {
        processedMap.set(rec.email, {
          id: rec.email, // Use email as a unique ID for map keys and React keys
          email: rec.email,
          name: rec.name,
          surname: rec.surname,
          reasons: [rec.reason],
          isResolvable: rec.isResolvable,
        });
      }
    });

    // Merge in predefined recipients, but don't override existing ones
    predefinedRecipients.forEach((rec) => {
      if (!processedMap.has(rec.email)) {
        processedMap.set(rec.email, rec);
      } else {
        // If email already exists, add the predefined reason to it
        const existing = processedMap.get(rec.email)!;
        if (!existing.reasons.includes(rec.reasons[0])) {
          existing.reasons.push(rec.reasons[0]);
        }
      }
    });

    return Array.from(processedMap.values());
  }, [initialRecipients, predefinedRecipients]);

  // Combine system recipients and custom emails
  const allRecipients = useMemo(() => {
    return [...displayRecipients, ...customEmails];
  }, [displayRecipients, customEmails]);

  useEffect(() => {
    const initialSelection: Record<string, boolean> = {};
    allRecipients.forEach((recipient) => {
      initialSelection[recipient.email] = recipient.isResolvable;
    });
    setSelectedRecipients(initialSelection);
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

    // Check if email already exists
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
    setCustomEmails((prev) =>
      prev.filter((recipient) => recipient.email !== email)
    );
    setSelectedRecipients((prev) => {
      const updated = {...prev};
      delete updated[email];
      return updated;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedEmails = allRecipients
      .filter((r) => r.isResolvable && selectedRecipients[r.email])
      .map((r) => r.email);
    if (selectedEmails.length === 0) {
      // Optionally, provide feedback to the user (e.g., with a toast notification)
      console.log("No recipients selected or none are resolvable.");
      return;
    }
    await onSendPdf(selectedEmails);
    // Optionally, provide feedback on successful initiation of send
    // alert("PDF send process initiated for: " + selectedEmails.join(", "));
  };

  const hasSelectedRecipients = Object.values(selectedRecipients).some(
    (isSelected) => isSelected
  );

  return (
    <div className="mt-8 p-4 border-2 border-dashed border-gray-300 rounded-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">
        Sélectionnez les destinataires du PDF :
      </h2>

      <form onSubmit={handleSubmit}>
        <ul className="list-none mb-6 space-y-3">
          {allRecipients.map((recipient) => (
            <li
              key={recipient.id}
              className="flex items-start p-2 rounded-md hover:bg-gray-50 transition-colors duration-150"
            >
              <input
                type="checkbox"
                id={`recipient-${recipient.id}`}
                checked={
                  recipient.isResolvable &&
                  (selectedRecipients[recipient.email] || false)
                }
                onChange={() =>
                  handleCheckboxChange(recipient.email, recipient.isResolvable)
                }
                disabled={!recipient.isResolvable}
                className={`mt-1 mr-3 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${
                  recipient.isResolvable
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-60"
                }`}
              />
              <label
                htmlFor={`recipient-${recipient.id}`}
                className={`flex-1 flex flex-wrap items-baseline ${
                  recipient.isResolvable
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-60"
                }`}
              >
                <div className="mr-2">
                  <span className="font-medium text-gray-800">
                    {`${recipient.name}${
                      recipient.surname ? " " + recipient.surname : ""
                    }`}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    ({recipient.email})
                  </span>
                </div>
                <div className="flex flex-wrap">
                  {recipient.reasons.map((reason, index) => (
                    <span
                      key={index}
                      className={getBadgeClassForReason(reason)}
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </label>

              {/* Add remove button for custom emails */}
              {recipient.id.startsWith("custom-") && (
                <button
                  type="button"
                  onClick={() => removeCustomEmail(recipient.email)}
                  className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>

        {/* Custom email input */}
        <div className="mb-6">
          <h3 className="text-md font-medium mb-2 text-gray-700">
            Ajouter d&apos;autres destinataires
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Vous pouvez entrer des adresses email supplémentaires
          </p>
          <div className="flex items-start gap-2">
            <div className="flex-grow">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Ajouter une adresse email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>
            <button
              type="button"
              onClick={addCustomEmail}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition cursor-pointer"
            >
              Ajouter
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={!hasSelectedRecipients}
          className={`w-full sm:w-auto bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-150 ease-in-out ${
            hasSelectedRecipients
              ? "hover:bg-blue-700 cursor-pointer transform hover:scale-105"
              : "opacity-50 cursor-not-allowed"
          }`}
        >
          Envoyer le PDF aux sélectionnés (EN COURS DE DEV)
        </button>
      </form>
    </div>
  );
};
