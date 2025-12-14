import "./globals.css";
import { LiffComponent } from "@/components/context/liff";
import { ToastProvider } from "@/components/ui/Toast";
import { VConsoleComponent } from "@/components/VConsole";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <VConsoleComponent />
        <LiffComponent>
          <ToastProvider>
            {children}
          </ToastProvider>
        </LiffComponent>
      </body>
    </html>
  );
}
