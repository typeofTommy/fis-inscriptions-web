import {Competitor, CodexData} from "@/app/types";
import React from "react";

export const CompetitorsTable = ({
  competitors,
  codexData,
}: {
  competitors: Competitor[];
  codexData: CodexData[];
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
                key={codex.number}
                className="border-r border-black p-1 font-semibold"
              >
                <div>{codex.discipline}</div>
                <div>{codex.number}</div>
                <div>{codex.raceLevel}</div>
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
                  key={codex.number}
                  className="border-r border-black p-1 text-center"
                >
                  <div className="font-bold">
                    {codex.discipline === "SL" && competitor.slpoints}
                    {codex.discipline === "GS" && competitor.gspoints}
                    {codex.discipline === "SG" && competitor.sgpoints}
                    {codex.discipline === "DH" && competitor.dhpoints}
                    {codex.discipline === "AC" && competitor.acpoints}
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
