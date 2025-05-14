"use client";

import React, {useState, useEffect} from "react";

export type Recipient = {
  email: string;
  name: string;
  surname: string;
  reason: string;
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

  useEffect(() => {
    // Initialize all recipients as selected
    const initialSelection: Record<string, boolean> = {};
    initialRecipients.forEach((recipient) => {
      initialSelection[recipient.email] = true;
    });
    setSelectedRecipients(initialSelection);
  }, [initialRecipients]);

  const handleCheckboxChange = (email: string) => {
    setSelectedRecipients((prev) => ({
      ...prev,
      [email]: !prev[email],
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedEmails = initialRecipients
      .filter((r) => selectedRecipients[r.email])
      .map((r) => r.email);
    // console.log("Selected emails to send to:", selectedEmails); // For debugging
    await onSendPdf(selectedEmails);
  };

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
                checked={selectedRecipients[recipient.email] || false}
                onChange={() => handleCheckboxChange(recipient.email)}
                className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label
                htmlFor={`recipient-${recipient.email}`}
                className="cursor-pointer"
              >
                <strong>{`${recipient.name} ${recipient.surname}`}</strong> (
                {recipient.email}) - <em>{recipient.reason}</em>
              </label>
            </li>
          ))}
        </ul>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
        >
          Envoyer le PDF aux sélectionnés (A IMPLEMENTER)
        </button>
      </form>
    </div>
  );
};
