import "./globals.css";
import { LiffComponent } from "@/components/context/liff";
import { ToastProvider } from "@/components/ui/Toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LiffComponent>
          <ToastProvider>
            {children}
          </ToastProvider>
        </LiffComponent>
      </body>
    </html>
  );
}
