import React from "react";

type ResponsibleForEntryBlockProps = {
  gender: "M" | "W";
  organization: any;
};

export const ResponsibleForEntryBlock = ({
  gender,
  organization,
}: ResponsibleForEntryBlockProps) => {

  type Person = {name: string; phone: string; email: string};
  type MenWomen = {men: Person; women: Person};

  const isRecord = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === "object";
  const isMenWomen = (v: unknown): v is MenWomen =>
    isRecord(v) && "men" in v && "women" in v;
  const isPerson = (v: unknown): v is Person =>
    isRecord(v) && "name" in v && "phone" in v && "email" in v;

  const rfeUnknown: unknown = organization?.contacts?.responsible_for_entry;
  let contact: Person | undefined;
  if (isMenWomen(rfeUnknown)) {
    contact = gender === "M" ? rfeUnknown.men : rfeUnknown.women;
  } else if (isPerson(rfeUnknown)) {
    contact = rfeUnknown;
  }

  return (
    <div className="w-1/2 p-2 border-r border-black">
      <div className="text-sm font-bold">Responsible for Entry</div>
      <div className="text-xs italic">
        / Responsable de l&apos;inscription / Verantwortlich
      </div>
      {contact && (
        <>
          <div className="text-center font-bold mt-2">{contact.name}</div>
          <div className="text-center mt-1">Mobile : {contact.phone}</div>
          <div className="text-center">Mail : {contact.email}</div>
        </>
      )}
    </div>
  );
};
