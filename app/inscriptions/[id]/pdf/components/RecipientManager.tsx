"use client";

import {useUser} from "@clerk/nextjs";
import React, {useState, useEffect} from "react";

export type Recipient = {
  email: string;
  name: string;
  surname: string;
  reason: string;
  isResolvable: boolean;
};

type RecipientManagerProps = {
  initialRecipients: Recipient[];
  onSendPdf: (selectedEmails: string[]) => Promise<void>;
};

export const RecipientManager: React.FC<RecipientManagerProps> = ({
  initialRecipients,
  onSendPdf,
}) => {
  const [selectedRecipients, setSelectedRecipients] = useState<
    Record<string, boolean>
  >({});

  const {user} = useUser();
  console.log({user});

  useEffect(() => {
    // Initialize all recipients as selected, only if they are resolvable
    const initialSelection: Record<string, boolean> = {};
    initialRecipients.forEach((recipient) => {
      initialSelection[recipient.email] = recipient.isResolvable;
    });
    setSelectedRecipients(initialSelection);
  }, [initialRecipients]);

  const handleCheckboxChange = (email: string, isResolvable: boolean) => {
    if (!isResolvable) return;
    setSelectedRecipients((prev) => ({
      ...prev,
      [email]: !prev[email],
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedEmails = initialRecipients
      .filter((r) => r.isResolvable && selectedRecipients[r.email])
      .map((r) => r.email);
    if (selectedEmails.length === 0) {
      return;
    }
    await onSendPdf(selectedEmails);
  };

  const hasSelectedRecipients = Object.values(selectedRecipients).some(
    (isSelected) => isSelected
  );

  return (
    <div className="mt-8 p-4 border-2 border-dashed border-gray-300">
      <h2 className="text-xl font-semibold mb-3">
        Sélectionnez les destinataires du PDF :
      </h2>
      <form onSubmit={handleSubmit}>
        <ul className="list-none mb-4 space-y-2">
          {initialRecipients.map((recipient) => (
            <li key={recipient.email} className="flex items-center">
              <input
                type="checkbox"
                id={`recipient-${recipient.email}`}
                checked={
                  recipient.isResolvable &&
                  (selectedRecipients[recipient.email] || false)
                }
                onChange={() =>
                  handleCheckboxChange(recipient.email, recipient.isResolvable)
                }
                disabled={!recipient.isResolvable}
                className={`mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                  recipient.isResolvable
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-50"
                }`}
              />
              <label
                htmlFor={`recipient-${recipient.email}`}
                className={`${
                  recipient.isResolvable
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-50"
                }`}
              >
                {`${recipient.name}${
                  recipient.surname ? " " + recipient.surname : ""
                }`}
                {" - "}
                {recipient.email} - <em>{recipient.reason}</em>
              </label>
            </li>
          ))}
        </ul>
        <button
          type="submit"
          disabled={!hasSelectedRecipients}
          className={`bg-blue-500 text-white font-bold py-2 px-4 rounded ${
            hasSelectedRecipients
              ? "hover:bg-blue-700 cursor-pointer"
              : "opacity-50 cursor-not-allowed"
          }`}
        >
          Envoyer le PDF aux sélectionnés (EN COURS DE DEV)
        </button>
      </form>
    </div>
  );
};
