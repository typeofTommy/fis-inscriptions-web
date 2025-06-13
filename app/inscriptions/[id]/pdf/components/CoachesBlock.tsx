import React from "react";

type CoachesBlockProps = {
  coaches: Array<{
    id: number;
    firstName: string;
    lastName: string;
    team: string | null;
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
              </span>
              {(coach.startDate || coach.endDate) && (
                <span className="text-xs text-gray-600">
                  {coach.startDate
                    ? new Date(coach.startDate).toLocaleDateString("fr-FR")
                    : "?"}{" "}
                  -{" "}
                  {coach.endDate
                    ? new Date(coach.endDate).toLocaleDateString("fr-FR")
                    : "?"}
                </span>
              )}
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
