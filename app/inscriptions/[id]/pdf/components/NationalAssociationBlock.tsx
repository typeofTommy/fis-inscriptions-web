import Image from "next/image";
import React from "react";

export const NationalAssociationBlock = () => {
  return (
    <div className="w-1/2 p-2">
      <div className="flex">
        <div className="w-16 mr-4">
          <Image
            src="/pdf/ffs-logo.png"
            alt="FFS Logo"
            width={60}
            height={60}
          />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold">National Association</div>
          <div className="text-xs italic">
            / Fédération nationale / Nationaler Verband
          </div>
          <div className="font-semibold mt-1">FEDERATION FRANCAISE DE SKI</div>
          <div>2 rue René Dumond- Meythet</div>
          <div>74960 ANNECY</div>
        </div>
      </div>
    </div>
  );
};
