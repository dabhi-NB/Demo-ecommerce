"use client";
import React, { useEffect } from "react";
import { useAppSettings } from "../../hooks/useAppSettings";

// Extend Window interface to include CookieConsent
declare global {
  interface Window {
    CookieConsent: any;
  }
}

const CookieConsentComponent: React.FC = () => {
  const { cookieConsentEnabled } = useAppSettings();

  useEffect(() => {
    if (cookieConsentEnabled && !document.cookie.includes("cookie_consent")) {
      // Load the CookieConsent library if not already loaded
      if (!window.CookieConsent) {
        // Load CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.0.1/dist/cookieconsent.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.0.1/dist/cookieconsent.umd.js";
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
          (window as any).CookieConsent.run({
            cookie: {
              name: "cc_cookie",
              expiresAfterDays: 365,
            },
            guiOptions: {
              consentModal: {
                layout: "cloud inline",
                position: "bottom right",
                equalWeightButtons: true,
                flipButtons: false,
              },
              preferencesModal: {
                layout: "box",
                equalWeightButtons: true,
                flipButtons: false,
              },
            },
            onChange: ({ changedCategories, changedServices }: any) => {
              if (
                (
                  window as any
                ).CookieConsent.getUserPreferences().rejectedCategories.indexOf(
                  "necessary",
                ) < 0
              ) {
                document.cookie =
                  "cookie_consent=1; path=/; max-age=" + 365 * 24 * 60 * 60;
              }
            },
            onModalHide: ({ modalName }: any) => {
              if (
                (
                  window as any
                ).CookieConsent.getUserPreferences().rejectedCategories.indexOf(
                  "necessary",
                ) < 0
              ) {
                document.cookie =
                  "cookie_consent=1; path=/; max-age=" + 365 * 24 * 60 * 60;
              }
            },
            categories: {
              necessary: {
                enabled: true,
                readOnly: true,
              },
              analytics: {
                autoClear: {
                  cookies: [
                    {
                      name: /^_ga/,
                    },
                    {
                      name: "_gid",
                    },
                  ],
                },
                services: {
                  ga: {
                    label: "Google Analytics",
                    onAccept: () => {},
                    onReject: () => {},
                  },
                  youtube: {
                    label: "Youtube Embed",
                    onAccept: () => {},
                    onReject: () => {},
                  },
                },
              },
            },
            language: {
              default: "en",
              translations: {
                en: {
                  consentModal: {
                    title: "We use cookies",
                    description:
                      'We use cookies to provide our services and for analytics and marketing. To find out more about our use of cookies, please see our Privacy Policy. By continuing to browse our website, you agree to our use of cookies. <a href="page/cookie-policy">Cookie policy</a>',
                    acceptAllBtn: "Accept all",
                    acceptNecessaryBtn: "Accept Necessary",
                    showPreferencesBtn: "Manage Individual preferences",
                    footer: ``,
                  },
                  preferencesModal: {
                    title: "Manage cookie preferences",
                    acceptAllBtn: "Accept all",
                    acceptNecessaryBtn: "Accept Necessary",
                    savePreferencesBtn: "Accept current selection",
                    closeIconLabel: "Close modal",
                    serviceCounterLabel: "Service|Services",
                    sections: [
                      {
                        title: "Your Privacy Choices",
                        description: `In this panel you can express some preferences related to the processing of your personal information. You may review and change expressed choices at any time by resurfacing this panel via the provided link. To deny your consent to the specific processing activities described below, switch the toggles to off or use the "Reject all" button and confirm you want to save your choices.`,
                      },
                      {
                        title: "Strictly Necessary",
                        description:
                          "These cookies are essential for the proper functioning of the website and cannot be disabled.",
                        linkedCategory: "necessary",
                        cookieTable: {
                          caption: "Cookie table",
                          headers: {
                            name: "Cookie",
                            domain: "Domain",
                            desc: "Description",
                          },
                          body: [
                            {
                              name: "next-auth.session-token",
                              domain: window.location.hostname,
                              desc: "user session",
                            },
                            {
                              name: "next-auth.csrf-token",
                              domain: window.location.hostname,
                              desc: "csrf security",
                            },
                          ],
                        },
                      },
                      {
                        title: "Performance and Analytics",
                        description:
                          "These cookies collect information about how you use our website. All of the data is anonymized and cannot be used to identify you.",
                        linkedCategory: "analytics",
                        cookieTable: {
                          caption: "Cookie table",
                          headers: {
                            name: "Cookie",
                            domain: "Domain",
                            desc: "Description",
                          },
                          body: [
                            {
                              name: "_ga",
                              domain: window.location.hostname,
                              desc: "Google Analytics tracking",
                            },
                            {
                              name: "_gid",
                              domain: window.location.hostname,
                              desc: "Google Analytics session",
                            },
                          ],
                        },
                      },
                      {
                        title: "More information",
                        description:
                          'For any queries in relation to my policy on cookies and your choices, please <a href="contact">contact us</a>',
                      },
                    ],
                  },
                },
              },
            },
          });
        };
      }
    }
  }, [cookieConsentEnabled]);

  return null;
};

export default CookieConsentComponent;
