import React from "react";

export const DateOfRaceBlock = ({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) => {
  return (
    <div className="w-1/2 p-2">
      <div className="text-sm font-bold">Date of race</div>
      <div className="text-xs italic">
        / Date de la course / Datum des wettkampfs
      </div>
      <div className="text-center font-bold mt-4">
        {startDate} - {endDate}
      </div>
    </div>
  );
};
