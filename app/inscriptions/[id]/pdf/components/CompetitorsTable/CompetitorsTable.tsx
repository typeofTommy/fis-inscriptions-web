import {CompetitionItem, Competitor} from "@/app/types";
import React from "react";

export const CompetitorsTable = ({
  competitors,
  codexData,
}: {
  competitors: (Competitor & {codexNumbers: string[]})[];
  codexData: CompetitionItem[];
}) => {
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
              <div>YB</div>
              <div className="italic font-normal">AN</div>
              <div className="italic font-normal">JG</div>
            </th>
            {codexData.map((codex) => (
              <th
                key={codex.codex}
                className="border-r border-black p-1 font-semibold"
              >
                <div>{codex.eventCode}</div>
                <div>{codex.codex}</div>
                <div>{codex.categoryCode}</div>
              </th>
            ))}
            <th className="border-r border-black p-1 font-semibold">
              <div>Arrival</div>
              <div className="italic font-normal">Arrivée</div>
              <div className="italic font-normal">Anreise</div>
              <div className="italic font-normal">(dd.mm.yy)</div>
            </th>
            <th className="p-1 font-semibold">
              <div>Departure</div>
              <div className="italic font-normal">Départ</div>
              <div className="italic font-normal">Abreise</div>
              <div className="italic font-normal">(dd.mm.yy)</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from(
            new Map(competitors.map((c) => [c.competitorid, c])).values()
          ).map((competitor) => (
            <tr className="border-b border-black" key={competitor.competitorid}>
              <td className="border-r border-black p-1 text-center">
                {competitor.fiscode}
              </td>
              <td className="border-r border-black p-1">
                {competitor.lastname} {competitor.firstname}
              </td>
              <td className="border-r border-black p-1 text-center">
                {competitor.birthyear}
              </td>
              {codexData.map((codex) => (
                <td
                  key={codex.codex}
                  className="border-r border-black p-1 text-center"
                >
                  <div className="font-bold">
                    {competitor.codexNumbers?.includes(String(codex.codex))
                      ? (codex.eventCode === "SL" && competitor.slpoints) ||
                        (codex.eventCode === "GS" && competitor.gspoints) ||
                        (codex.eventCode === "SG" && competitor.sgpoints) ||
                        (codex.eventCode === "DH" && competitor.dhpoints) ||
                        (codex.eventCode === "AC" && competitor.acpoints)
                      : null}
                  </div>
                </td>
              ))}
              <td className="border-r border-black p-1 text-center">TODO</td>
              <td className="p-1 text-center">TODO</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
