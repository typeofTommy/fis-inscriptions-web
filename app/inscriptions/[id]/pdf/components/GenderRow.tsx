import {Checkbox} from "@/components/ui/checkbox";
import React from "react";

export const GenderRow = ({gender}: {gender: "M" | "W"}) => {
  return (
    <div className="border-b border-black p-2">
      <div className="flex items-center">
        <div className="font-bold mr-4">
          COMPETITORS / COUREURS / WETTKÄMPFER
        </div>
        <div className="flex items-center justify-center align-middle ml-8 gap-4">
          <div className="flex items-center">
            <Checkbox
              checked={gender === "W"}
              style={{
                color: "black",
                backgroundColor: "white",
                width: "30px",
                height: "30px",
              }}
            />
            <span className="ml-2 leading-none">L</span>
          </div>
          <div className="flex items-center">
            <Checkbox
              checked={gender === "M"}
              style={{
                color: "black",
                backgroundColor: "white",
                width: "30px",
                height: "30px",
              }}
            />
            <span className="ml-2 leading-none">M</span>
          </div>
        </div>
      </div>
    </div>
  );
};
