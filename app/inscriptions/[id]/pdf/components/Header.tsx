import Image from "next/image";
import React from "react";

export const Header = () => {
  return (
    <div className="flex items-start mb-4">
      <div className="w-24 mr-4">
        <Image
          src="/pdf/fis-logo.png"
          alt="FIS Logo"
          width={80}
          height={60}
          priority
        />
      </div>
      <div className="flex-1">
        <div className="h-2 bg-yellow-400 mb-1"></div>
        <div className="h-2 bg-blue-700"></div>
        <h1 className="text-lg font-bold mt-2">ENTRY FORM</h1>
        <p className="text-sm">FORMULAIRE D&apos;INSCRIPTION</p>
        <p className="text-sm">ANMELDUNGSFORMULAR</p>
      </div>
    </div>
  );
};
