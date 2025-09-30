import Image from "next/image";
import React from "react";
import {useOrganization} from "@/hooks/useOrganization";

export const NationalAssociationBlock = () => {
  const {data: organization} = useOrganization();
  return (
    <div className="w-1/2 p-2">
      <div className="flex">
        <div className="w-16 mr-4">
          <Image
            src={organization?.logo || "/pdf/ffs-logo.png"}
            alt={`${organization?.name || "FFS"} Logo`}
            width={60}
            height={60}
          />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold">National Association</div>
          <div className="text-xs italic">
            / Fédération nationale / Nationaler Verband
          </div>
          <div className="font-semibold mt-1">{organization?.name || "FEDERATION FRANCAISE DE SKI"}</div>
          <div>{organization?.contacts.responsible_for_entry.address || "2 rue René Dumond- Meythet"}</div>
        </div>
      </div>
    </div>
  );
};
