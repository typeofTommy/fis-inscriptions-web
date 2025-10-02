import React from "react";
import Image from "next/image";

type TableFooterProps = {
  gender: "M" | "W";
  organization: any;
};

export const TableFooter = ({gender, organization}: TableFooterProps) => {
  return (
    // Main container with top border separating from the new totals row in CompetitorsTable
    <div className="border-t border-black">
      {/* Row for SIGNATURE */}
      <div className="flex h-24">
        {/* Single cell spanning the entire width */}
        <div className="w-full p-2 flex items-center justify-center gap-32">
          <div className="text-center">
            <div className="font-bold">SIGNATURE</div>
            {organization && (
              <div className="text-sm mt-2">
                <div>{organization.contacts.signature.name}</div>
                <div>{organization.contacts.signature.title}</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* For now keep existing signatures - TODO: make dynamic when we have multiple orgs */}
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
