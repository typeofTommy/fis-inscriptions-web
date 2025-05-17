import React from "react";

type ResponsibleForEntryBlockProps = {
  gender: "M" | "W";
};

export const ResponsibleForEntryBlock = ({
  gender,
}: ResponsibleForEntryBlockProps) => {
  return (
    <div className="w-1/2 p-2 border-r border-black">
      <div className="text-sm font-bold">Responsible for Entry</div>
      <div className="text-xs italic">
        / Responsable de l&apos;inscription / Verantwortlich
      </div>
      {gender === "M" ? (
        <>
          <div className="text-center font-bold mt-2">Philippe MARTIN</div>
          <div className="text-center mt-1">Mobile :+33 666 49 28 99</div>
          <div className="text-center">Mail : pmartin@ffs.fr</div>
        </>
      ) : (
        <>
          <div className="text-center font-bold mt-2">Jean-Michel Agnellet</div>
          <div className="text-center mt-1">Mobile :+33 788 04 56 50</div>
          <div className="text-center">Mail : jmagnellet@orange.fr</div>
        </>
      )}
    </div>
  );
};
