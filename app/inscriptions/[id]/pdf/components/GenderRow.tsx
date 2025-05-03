import React from "react";

export const GenderRow = () => {
  return (
    <div className="border-b border-black p-2">
      <div className="flex items-center">
        <div className="font-bold mr-4">
          COMPETITORS / COUREURS / WETTKÄMPFER
        </div>
        <div className="flex items-center ml-8">
          <span className="mr-2">L</span>
          <div className="w-5 h-5 border border-black mr-4"></div>
          <span className="mr-2">/ M</span>
          <div className="w-5 h-5 border border-black relative">
            <span className="absolute inset-0 text-center text-red-600 font-bold text-lg">
              X
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
