"use client";

import React from "react";
import {PlusCircle, Snowflake, Users} from "lucide-react";
import Link from "next/link";
import {SignedIn, UserButton, useUser} from "@clerk/nextjs";
import {Button} from "./button";
import {useRole} from "@/app/lib/useRole";
import {LanguageSwitcher} from "@/components/LanguageSwitcher";
import {useTranslations} from "next-intl";

export const Header = () => {
  const {user, isLoaded} = useUser();
  const role = useRole();
  const t = useTranslations("inscriptions");
  const tNav = useTranslations("navigation");
  const tCommon = useTranslations("common.actions");

  return (
    <div className="relative z-10 py-4 md:py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 px-4">
        <Link href="/" className="flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <Snowflake className="h-6 w-6 md:h-8 md:w-8" />
            <h1 className="text-xl md:text-3xl font-bold text-center md:text-left">
              <span className="md:hidden">{t("titleShort")}</span>
              <span className="hidden md:inline">{t("title")}</span>
            </h1>
          </div>
        </Link>
        
        {/* Mobile: Stack vertical avec espacement réduit */}
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 w-full md:w-auto">
          <SignedIn>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <Link href="/inscriptions/new" className="w-full md:w-auto">
                <Button className="w-full md:w-auto flex items-center justify-center bg-white text-[#3d7cf2] hover:bg-[#f0f7ff] cursor-pointer text-sm md:text-base py-2 px-3 md:px-4">
                  <PlusCircle className="mr-1 h-4 w-4" />
                  {t("new")}
                </Button>
              </Link>
              {role === "admin" && (
                <Link href="/users" className="w-full md:w-auto">
                  <Button className="w-full md:w-auto flex items-center justify-center bg-white text-[#3d7cf2] hover:bg-[#f0f7ff] cursor-pointer text-sm md:text-base py-2 px-3 md:px-4">
                    <Users className="mr-1 h-4 w-4" />
                    {tNav("users")}
                  </Button>
                </Link>
              )}
            </div>
          </SignedIn>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <LanguageSwitcher />
            {isLoaded && !user ? (
              <Link href="/sign-in">
                <Button className="bg-white text-[#3d7cf2] hover:bg-[#f0f7ff] cursor-pointer text-sm md:text-base py-2 px-3 md:px-4">
                  {tCommon("signIn")}
                </Button>
              </Link>
            ) : isLoaded && user ? (
              <UserButton />
            ) : (
              // Fallback: afficher bouton de connexion si Clerk n'est pas chargé
              <Link href="/sign-in">
                <Button className="bg-white text-[#3d7cf2] hover:bg-[#f0f7ff] cursor-pointer text-sm md:text-base py-2 px-3 md:px-4">
                  {tCommon("signIn")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
