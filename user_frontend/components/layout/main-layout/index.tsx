import React from "react";
import Header from "./header";
import { MainContent } from "./main-content";
import Footer from "./footer";
import CookieConsentComponent from "../../common/CookieConsent";

type UserLayoutProps = {
  children: React.ReactNode;
};

export function UserLayout({ children }: UserLayoutProps) {
  return (
    <>
      <div className="wrapper ">
        <Header />
        <div className="min-h-screen bg-background">
          <MainContent>{children}</MainContent>
        </div>
        <Footer />
      </div>
      <CookieConsentComponent />
    </>
  );
}
