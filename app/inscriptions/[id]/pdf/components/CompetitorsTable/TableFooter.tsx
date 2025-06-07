import React from "react";
import Image from "next/image";

type TableFooterProps = {
  gender: "M" | "W";
};

export const TableFooter = ({gender}: TableFooterProps) => {
  return (
    // Main container with top border separating from the new totals row in CompetitorsTable
    <div className="border-t border-black">
      {/* Row for SIGNATURE */}
      <div className="flex h-24">
        {/* Single cell spanning the entire width */}
        <div className="w-full p-2 flex items-center justify-center gap-32">
          <span className="font-bold">SIGNATURE</span>
          <div className="flex items-center gap-4">
            {gender === "M" ? (
              <Image
                src="/pdf/pm-signature.jpg"
                alt="Philippe Martin Signature"
                width={80}
                height={32}
                className="object-contain"
              />
            ) : (
              <Image
                src="/pdf/ja-signature.png"
                alt="Jean-Michel Agnellet Signature"
                width={120}
                height={48}
                className="object-contain"
              />
            )}
            <Image
              src="/pdf/tampon.jpg"
              alt="FFS Stamp"
              width={80}
              height={64}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
