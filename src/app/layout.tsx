import "../styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const metadata: Metadata = {
  title: "Retenza",
  description: "Loyalty Platform",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  manifest: "/manifest.json",
  themeColor: "#317EFB",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', async () => {
                  try {
                    // Register service worker
                    await navigator.serviceWorker.register('/sw.js');
                    console.log('SW registered');

                    // Wait for active service worker
                    const reg = await navigator.serviceWorker.ready;

                    // Request notification permission
                    if ('Notification' in window) {
                      const permission = await Notification.requestPermission();
                      if (permission === 'granted') {
                        console.log('Notification permission granted.');

                        // Show a test notification
                        reg.showNotification('Hello from Retenza 🚀', {
                          body: 'This is a test PWA notification.',
                          icon: '/icon-192.png',
                        });
                      } else {
                        console.log('Notification permission denied:', permission);
                      }
                    }
                  } catch (err) {
                    console.log('SW registration/notification failed:', err);
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
