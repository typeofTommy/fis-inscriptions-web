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
  return `${baseClasses} bg-purple-100 text-purple-700`; // Default for other reasons
};

export const RecipientManager: React.FC<RecipientManagerProps> = ({
  initialRecipients,
  onSendPdf,
}) => {
  const [selectedRecipients, setSelectedRecipients] = useState<
    Record<string, boolean>
  >({});

  const {user} = useUser();
  console.log({user}); // Keep for debugging if needed, or remove

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
    return Array.from(processedMap.values());
  }, [initialRecipients]);

  useEffect(() => {
    const initialSelection: Record<string, boolean> = {};
    displayRecipients.forEach((recipient) => {
      initialSelection[recipient.email] = recipient.isResolvable;
    });
    setSelectedRecipients(initialSelection);
  }, [displayRecipients]);

  const handleCheckboxChange = (email: string, isResolvable: boolean) => {
    if (!isResolvable) return;
    setSelectedRecipients((prev) => ({
      ...prev,
      [email]: !prev[email],
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedEmails = displayRecipients
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
          {displayRecipients.map((recipient) => (
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
            </li>
          ))}
        </ul>
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
