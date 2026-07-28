import "./globals.css";

export const metadata = {
  title: "Triage — Node Wealth",
  description:
    "Automatic inbox triage for Gmail and Outlook. Connect your inbox, we sort urgent from routine from noise in real time.",
  metadataBase: new URL("https://triage.node-wealth.com"),
  openGraph: {
    title: "Triage — Node Wealth",
    description:
      "Automatic inbox triage for Gmail and Outlook, connected securely via OAuth.",
    url: "https://triage.node-wealth.com",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
