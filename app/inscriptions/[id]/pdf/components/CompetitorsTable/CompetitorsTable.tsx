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
  // Calculate entries per codex (including competitors registered but without points - displayed as 999)
  const entriesPerCodex = codexData.map((codexItem) => {
    const count = competitors.filter((c) => {
      const isAssociated = c.codexNumbers.includes(String(codexItem.codex));
      if (!isAssociated) return false;

      let hasEntry = false;
      // Check if competitor has a points entry OR is registered for this event (including those that would show 999)
      switch (codexItem.eventCode) {
        case "SL":
          // Count if has valid points OR is registered (will show 999)
          hasEntry =
            (c.slpoints != null && !isNaN(parseFloat(c.slpoints))) ||
            isAssociated;
          break;
        case "GS":
          hasEntry =
            (c.gspoints != null && !isNaN(parseFloat(c.gspoints))) ||
            isAssociated;
          break;
        case "SG":
          hasEntry =
            (c.sgpoints != null && !isNaN(parseFloat(c.sgpoints))) ||
            isAssociated;
          break;
        case "DH":
          hasEntry =
            (c.dhpoints != null && !isNaN(parseFloat(c.dhpoints))) ||
            isAssociated;
          break;
        case "AC":
          hasEntry =
            (c.acpoints != null && !isNaN(parseFloat(c.acpoints))) ||
            isAssociated;
          break;
        // Add other event codes if necessary
      }
      return hasEntry; // Count if associated (includes both those with points and those showing 999)
    }).length;
    return {codex: String(codexItem.codex), count};
  });

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full text-xs"
        style={{borderCollapse: "separate", borderSpacing: "0"}}
      >
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
              {codexData.map((codex, colIndex) => {
                let points: string | number | null | undefined = null;
                if (competitor.codexNumbers?.includes(String(codex.codex))) {
                  if (codex.eventCode === "SL") points = competitor.slpoints;
                  else if (codex.eventCode === "GS")
                    points = competitor.gspoints;
                  else if (codex.eventCode === "SG")
                    points = competitor.sgpoints;
                  else if (codex.eventCode === "DH")
                    points = competitor.dhpoints;
                  else if (codex.eventCode === "AC")
                    points = competitor.acpoints;
                }
                let displayValue: string | number | null = null;
                if (String(points) === "0") {
                  displayValue = 0;
                } else if (
                  points !== null &&
                  points !== undefined &&
                  String(points).trim() !== "" &&
                  String(points) !== "-"
                ) {
                  displayValue = points;
                } else if (
                  competitor.codexNumbers?.includes(String(codex.codex))
                ) {
                  displayValue = "999";
                } else {
                  displayValue = null;
                }
                return (
                  <td
                    key={codex.codex}
                    className={`${
                      colIndex === codexData.length - 1
                        ? ""
                        : "border-r border-black"
                    } p-1 text-center text-md`}
                  >
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-b border-black">
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
