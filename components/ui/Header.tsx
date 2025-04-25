import React from "react";
import {PlusCircle, Snowflake} from "lucide-react";
import {Button} from "./button";
import Link from "next/link";

export const Header = () => {
  return (
    <div className="relative z-10 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4">
        <Link href="/">
          <div className="flex items-center gap-3">
            <Snowflake className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Gestion des Inscriptions FIS</h1>
          </div>
        </Link>
        <Link href="/inscriptions/new">
          <Button className="flex items-center bg-white text-[#3d7cf2] hover:bg-[#f0f7ff] cursor-pointer text-base">
            <PlusCircle className="mr-1 h-4 w-4" />
            Nouvelle Demande
          </Button>
        </Link>
      </div>
    </div>
  );
};
