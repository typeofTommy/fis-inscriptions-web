import React from "react";

type CoachesBlockProps = {
  coaches: Array<{
    id: number;
    firstName: string;
    lastName: string;
    team: string | null;
    gender: "M" | "W" | "BOTH";
    startDate?: string;
    endDate?: string;
  }>;
};

export const CoachesBlock = ({coaches}: CoachesBlockProps) => {
  return (
    <div className="w-full p-2 border-b border-black">
      <div className="text-sm font-bold">Coachs/Staff</div>
      <div className="text-xs italic mb-2">
        Team Staff / Encadrement de l&apos;équipe
      </div>
      {coaches.length > 0 ? (
        <div className="space-y-1">
          {coaches.map((coach, index) => (
            <div
              key={coach.id}
              className="text-sm flex items-center justify-between"
            >
              <span>
                {index + 1}. {coach.firstName} {coach.lastName}
                {coach.team && (
                  <span className="text-xs text-gray-600 ml-2">
                    ({coach.team})
                  </span>
                )}
                {(coach.startDate || coach.endDate) && (
                  <span className="text-xs text-gray-600 ml-2">
                    - First day : {coach.startDate
                      ? new Date(coach.startDate).toLocaleDateString("fr-FR")
                      : "TBD"} | Last day : {coach.endDate
                      ? new Date(coach.endDate).toLocaleDateString("fr-FR")
                      : "TBD"}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic">
          Aucun entraîneur déclaré
        </div>
      )}
    </div>
  );
};
