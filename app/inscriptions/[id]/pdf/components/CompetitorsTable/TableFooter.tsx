import React from "react";

export const TableFooter = () => {
  return (
    <div>
      {" "}
      <div className="flex border-b border-black">
        <div className="w-3/4 p-2 border-r border-black">
          <div className="flex items-center">
            <span className="font-semibold">Entry with FIS points</span>
            <span className="text-xs italic ml-1">
              / Inscription avec points FIS / Anmeldung mit FIS Punkten
            </span>
          </div>
        </div>
        <div className="w-1/4 p-2 flex justify-between items-center">
          <div className="text-xs italic">Signature</div>
          <div className="font-bold text-right">10</div>
        </div>
      </div>
      <div className="flex border-b border-black">
        <div className="w-3/4 p-2 border-r border-black">
          <div className="flex items-center">
            <span className="font-semibold">Entry Without FIS points</span>
            <span className="text-xs italic ml-1">
              / Inscription sans points FIS / Anmeldung ohne FIS punkte
            </span>
          </div>
        </div>
        <div className="w-1/4 p-2 flex justify-between items-center">
          <div className="text-xs italic"></div>
          <div className="font-bold text-right">0</div>
        </div>
      </div>
      <div className="flex">
        <div className="w-3/4 p-2 border-r border-black">
          <div className="flex items-center">
            <span className="font-semibold">No entry</span>
            <span className="text-xs italic ml-1">
              / Pas de participation / Keine Teilnahme
            </span>
          </div>
        </div>
        <div className="w-1/4 p-2 flex justify-between items-center">
          <div className="text-xs italic">Philippe MARTIN</div>
          <div className="font-bold text-right">0</div>
        </div>
      </div>
    </div>
  );
};
