import {CompetitionItem, Competitor} from "@/app/types";
import {format} from "date-fns";
import React from "react";
import {pdfHeaderColorPerDiscipline} from "@/app/lib/colorMappers";

export const CompetitorsTable = ({
  competitors,
  codexData,
}: {
  competitors: (Competitor & {codexNumbers: string[]})[];
  codexData: CompetitionItem[];
}) => {
  // Calculate entries per codex (only those with points > 0 for that specific event)
  const entriesPerCodex = codexData.map((codexItem) => {
    const count = competitors.filter((c) => {
      const isAssociated = c.codexNumbers.includes(String(codexItem.codex));
      if (!isAssociated) return false;

      let hasPointsEntry = false;
      // Check if competitor has a points entry (including 0) for the specific event type
      switch (codexItem.eventCode) {
        case "SL":
          // Check for non-null value. parseFloat helps ensure "0" or "0.00" is treated as non-null.
          hasPointsEntry = c.slpoints != null && !isNaN(parseFloat(c.slpoints));
          break;
        case "GS":
          hasPointsEntry = c.gspoints != null && !isNaN(parseFloat(c.gspoints));
          break;
        case "SG":
          hasPointsEntry = c.sgpoints != null && !isNaN(parseFloat(c.sgpoints));
          break;
        case "DH":
          hasPointsEntry = c.dhpoints != null && !isNaN(parseFloat(c.dhpoints));
          break;
        case "AC":
          hasPointsEntry = c.acpoints != null && !isNaN(parseFloat(c.acpoints));
          break;
        // Add other event codes if necessary
      }
      return hasPointsEntry; // Count if associated AND has a non-null points value (0 counts)
    }).length;
    return {codex: String(codexItem.codex), count};
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="border-r border-black p-1 font-semibold">
              FIS Code
            </th>
            <th className="border-r border-black p-1 font-semibold">
              <div>Surname, First Name</div>
              <div className="italic font-normal">Nom de famille, Prénom</div>
              <div className="italic font-normal">Familienname, Vorname</div>
            </th>
            <th className="border-r border-black p-1 font-semibold">
              <div className="text-center text-lg">YB</div>
            </th>
            {codexData.map((codex, index) => {
              const disciplineBgColor =
                pdfHeaderColorPerDiscipline[codex.eventCode] || "bg-gray-200";
              return (
                <th
                  key={codex.codex}
                  className={`${
                    index === codexData.length - 1
                      ? ""
                      : "border-r border-black"
                  } p-0 font-semibold min-w-[70px] text-center align-middle`}
                >
                  <div
                    className={`border-b border-black py-1 text-md ${disciplineBgColor} flex items-center justify-center text-center align-middle`}
                  >
                    {codex.eventCode}
                  </div>
                  <div className="border-b border-black py-1 text-md flex items-center justify-center text-center align-middle">
                    {codex.codex}
                  </div>
                  <div className="border-b border-black py-1 text-md flex items-center justify-center text-center align-middle">
                    {codex.categoryCode}
                  </div>
                  <div className="py-1 text-md flex items-center justify-center text-center align-middle">
                    {format(codex.date, "dd/MM/yy")}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Array.from(
            new Map(
              [...competitors]
                .sort((a, b) => {
                  const aLast = a.lastname || "";
                  const bLast = b.lastname || "";
                  if (aLast < bLast) {
                    return -1;
                  }
                  if (aLast > bLast) {
                    return 1;
                  }
                  const aFirst = a.firstname || "";
                  const bFirst = b.firstname || "";
                  if (aFirst < bFirst) {
                    return -1;
                  }
                  if (aFirst > bFirst) {
                    return 1;
                  }
                  return 0;
                })
                .map((c) => [c.competitorid, c])
            ).values()
          ).map((competitor, rowIndex, arr) => (
            <tr
              className={`${
                rowIndex === arr.length - 1 ? "" : "border-b border-black"
              }`}
              key={competitor.competitorid}
            >
              <td className="border-r border-black p-1 text-center font-bold text-md">
                {competitor.fiscode}
              </td>
              <td className="border-r border-black p-1">
                {competitor.lastname} {competitor.firstname}
              </td>
              <td className="border-r border-black p-1 text-center">
                {competitor.birthyear}
              </td>
              {codexData.map((codex, colIndex) => (
                <td
                  key={codex.codex}
                  className={`${
                    colIndex === codexData.length - 1
                      ? ""
                      : "border-r border-black"
                  } p-1 text-center text-md`}
                >
                  {competitor.codexNumbers?.includes(String(codex.codex))
                    ? (codex.eventCode === "SL" && competitor.slpoints) ||
                      (codex.eventCode === "GS" && competitor.gspoints) ||
                      (codex.eventCode === "SG" && competitor.sgpoints) ||
                      (codex.eventCode === "DH" && competitor.dhpoints) ||
                      (codex.eventCode === "AC" && competitor.acpoints)
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-black">
            <td
              colSpan={3} // Spans FIS Code, Name, YB columns
              className="p-1 pr-2 border-r border-black text-right font-bold text-md"
            >
              Entries per Codex
            </td>
            {entriesPerCodex.map((item, index) => (
              <td
                key={item.codex}
                className={`p-1 text-center font-bold ${
                  index === entriesPerCodex.length - 1
                    ? ""
                    : "border-r border-black"
                }`}
              >
                {item.count}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
