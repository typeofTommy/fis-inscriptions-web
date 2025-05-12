import React from "react";
import Image from "next/image";

export const TableFooter = () => {
  return (
    // Main container with top border separating from the new totals row in CompetitorsTable
    <div className="border-t border-black">
      {/* Row for SIGNATURE */}
      <div className="flex h-24">
        {/* Single cell spanning the entire width */}
        <div className="w-full p-2 flex items-center justify-center gap-32">
          <span className="font-bold">SIGNATURE</span>
          {/* Replace placeholder with the actual signature image */}
          <Image
            src="/pdf/signature.png"
            alt="Signature"
            width={160}
            height={64}
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
};
