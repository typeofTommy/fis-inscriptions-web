import React from "react";

export const CompetitionBlock = ({
  station,
  countryTrigram,
}: {
  station: string;
  countryTrigram: string;
}) => {
  return (
    <div className="w-1/2 p-2 border-r border-black">
      <div className="flex gap-2">
        <div className="text-sm font-bold">Competition</div>
        <span className="text-xs italic">
          (Name/Place) / (Manifestation/Nom/Lieu) / (Veranstaltung (Name/Ort)
        </span>
      </div>
      <div className="text-center font-bold flex items-center justify-center gap-2">
        {station} - {countryTrigram}{" "}
      </div>
    </div>
  );
};
