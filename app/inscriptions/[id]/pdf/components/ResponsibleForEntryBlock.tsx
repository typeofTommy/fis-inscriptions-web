import React from "react";
import {useOrganization} from "@/hooks/useOrganization";

type ResponsibleForEntryBlockProps = {
  gender: "M" | "W";
};

export const ResponsibleForEntryBlock = ({
  gender,
}: ResponsibleForEntryBlockProps) => {
  const {data: organization} = useOrganization();

  const contact = organization?.contacts?.responsible_for_entry?.[gender === "M" ? "men" : "women"];

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
