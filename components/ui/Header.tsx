"use client";

import React, { useState } from "react";
import { PlusCircle, Snowflake, Users, Settings, Menu, ChevronDown } from "lucide-react";
import Link from "next/link";
import { SignedIn, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "./button";
import { useRole, isAdminRole, isSuperAdminRole } from "@/app/lib/useRole";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { user, isLoaded } = useUser();
  const role = useRole();
  const t = useTranslations("inscriptions");
  const tNav = useTranslations("navigation");
  const tCommon = useTranslations("common.actions");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showAdminItems = isAdminRole(role);
  const showSuperAdminItems = isSuperAdminRole(role);

  return (
    <header className="relative z-10 py-3 md:py-4 lg:py-6">
      <div className="flex items-center justify-between gap-3 px-4">
        <Link href="/" className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <Snowflake className="h-6 w-6 md:h-7 md:w-7" />
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold">
              <span className="md:hidden">{t("titleShort")}</span>
              <span className="hidden md:inline">{t("title")}</span>
            </h1>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Mobile: New request button (always visible when signed in) */}
          <SignedIn>
            <Link href="/inscriptions/new" className="md:hidden">
              <Button size="sm" className="bg-white text-[#3d7cf2] hover:bg-[#f0f7ff] h-9">
                <PlusCircle className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">{t("new")}</span>
              </Button>
            </Link>
          </SignedIn>

          {/* Desktop navigation (lg+) */}
          <nav className="hidden lg:flex items-center gap-2">
            <SignedIn>
              <Link href="/inscriptions/new">
                <Button className="bg-white text-[#3d7cf2] hover:bg-[#f0f7ff]">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t("new")}
                </Button>
              </Link>
              {showAdminItems && (
                <Link href="/users">
                  <Button variant="ghost" className="hover:bg-white/10">
                    <Users className="mr-2 h-4 w-4" />
                    {tNav("users")}
                  </Button>
                </Link>
              )}
              {showSuperAdminItems && (
                <Link href="/admin/organization">
                  <Button variant="ghost" className="hover:bg-white/10">
                    <Settings className="mr-2 h-4 w-4" />
                    Config
                  </Button>
                </Link>
              )}
            </SignedIn>
          </nav>

          {/* Tablet navigation (md to lg) */}
          <nav className="hidden md:flex lg:hidden items-center gap-2">
            <SignedIn>
              <Link href="/inscriptions/new">
                <Button size="sm" className="bg-white text-[#3d7cf2] hover:bg-[#f0f7ff]">
                  <PlusCircle className="mr-1.5 h-4 w-4" />
                  {t("new")}
                </Button>
              </Link>
              {(showAdminItems || showSuperAdminItems) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="hover:bg-white/10">
                      Admin
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {showAdminItems && (
                      <DropdownMenuItem asChild>
                        <Link href="/users" className="flex items-center cursor-pointer">
                          <Users className="mr-2 h-4 w-4" />
                          {tNav("users")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {showSuperAdminItems && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin/organization" className="flex items-center cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Config
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SignedIn>
          </nav>

          <LanguageSwitcher />

          {isLoaded && !user ? (
            <Link href="/sign-in">
              <Button size="sm" className="bg-white text-[#3d7cf2] hover:bg-[#f0f7ff]">
                {tCommon("signIn")}
              </Button>
            </Link>
          ) : isLoaded && user ? (
            <UserButton />
          ) : (
            <Link href="/sign-in">
              <Button size="sm" className="bg-white text-[#3d7cf2] hover:bg-[#f0f7ff]">
                {tCommon("signIn")}
              </Button>
            </Link>
          )}

          {/* Mobile admin menu (< md, only if admin) */}
          <SignedIn>
            {(showAdminItems || showSuperAdminItems) && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="ghost" className="md:hidden hover:bg-white/10 h-9 w-9 p-0">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle>Admin</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-2 mt-6">
                    {showAdminItems && (
                      <Link href="/users" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start hover:bg-accent">
                          <Users className="mr-2 h-4 w-4" />
                          {tNav("users")}
                        </Button>
                      </Link>
                    )}
                    {showSuperAdminItems && (
                      <Link href="/admin/organization" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start hover:bg-accent">
                          <Settings className="mr-2 h-4 w-4" />
                          Config
                        </Button>
                      </Link>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            )}
          </SignedIn>
        </div>
      </div>
    </header>
  );
};
