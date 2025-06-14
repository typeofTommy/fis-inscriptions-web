"use client";

import React from "react";
import {PlusCircle, Snowflake} from "lucide-react";
import Link from "next/link";
import {SignedIn, UserButton, useUser} from "@clerk/nextjs";
import {Button} from "./button";
import {usePathname} from "next/navigation";


export const Header = () => {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const {user, isLoaded} = useUser();

  return (
    <div className="relative z-10 py-4 md:py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 px-4">
        <Link href="/" className="flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <Snowflake className="h-6 w-6 md:h-8 md:w-8" />
            <h1 className="text-xl md:text-3xl font-bold text-center md:text-left">
              <span className="md:hidden">FIS Inscriptions</span>
              <span className="hidden md:inline">Inscriptions FIS étrangers</span>
            </h1>
          </div>
        </Link>
        
        {/* Mobile: Stack vertical avec espacement réduit */}
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 w-full md:w-auto">
          <SignedIn>
            <Link href="/inscriptions/new" className="w-full md:w-auto">
              <Button className="w-full md:w-auto flex items-center justify-center bg-white text-[#3d7cf2] hover:bg-[#f0f7ff] cursor-pointer text-sm md:text-base py-2 px-3 md:px-4">
                <PlusCircle className="mr-1 h-4 w-4" />
                Nouvelle Demande
              </Button>
            </Link>
          </SignedIn>
          
          <div className="flex-shrink-0">
            {isHome ? (
              isLoaded && !user ? (
                <Link href="/sign-in">
                  <Button className="bg-white text-[#3d7cf2] hover:bg-[#f0f7ff] cursor-pointer text-sm md:text-base py-2 px-3 md:px-4">
                    Connexion
                  </Button>
                </Link>
              ) : isLoaded && user ? (
                <UserButton />
              ) : null
            ) : (
              <SignedIn>
                <UserButton />
              </SignedIn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
