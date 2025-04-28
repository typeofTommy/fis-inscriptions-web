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
    <div className="relative z-10 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4">
        <Link href="/">
          <div className="flex items-center gap-3">
            <Snowflake className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Gestion des Inscriptions FIS</h1>
          </div>
        </Link>
        <div className="flex items-center gap-12">
          <SignedIn>
            <Link href="/inscriptions/new">
              <Button className="flex items-center bg-white text-[#3d7cf2] hover:bg-[#f0f7ff] cursor-pointer text-base">
                <PlusCircle className="mr-1 h-4 w-4" />
                Nouvelle Demande
              </Button>
            </Link>
          </SignedIn>
          {isHome ? (
            isLoaded && !user ? (
              <Link href="/sign-in">
                <Button className="bg-white text-[#3d7cf2] hover:bg-[#f0f7ff] cursor-pointer text-base">
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
  );
};
