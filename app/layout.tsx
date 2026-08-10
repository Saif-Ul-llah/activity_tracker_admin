import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Activity Tracker — Admin",
  description: "Monitoring and analytics for the desktop activity tracker",
};

// Set the theme before paint to avoid a flash. Defaults to the OS preference,
// overridable by a stored choice (see the toggle in the sidebar).
const themeScript = `
(function(){try{
  var s=localStorage.getItem('tracker_theme');
  var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;
  if(d)document.documentElement.classList.add('dark');
}catch(e){}})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
