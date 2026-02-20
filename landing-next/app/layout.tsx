import type { Metadata } from "next";
import "./globals.css";

/* eslint-disable react-refresh/only-export-components -- layout exports metadata */
export const metadata: Metadata = {
    title: "One More — Ta progression, enfin simple",
    description:
        "Suivi de musculation sans prise de tête. Système de ligues pour garder ta motivation. Réserve ta place au lancement.",
    icons: {
        icon: "/logo.png",
        apple: "/logo.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" className="dark">
            <body className="min-h-screen">{children}</body>
        </html>
    );
}
