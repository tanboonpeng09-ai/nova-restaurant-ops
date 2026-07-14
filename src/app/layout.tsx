import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { restaurantConfig } from "@/config/restaurant";

export const metadata: Metadata = {
  title: restaurantConfig.seo.title,
  description: restaurantConfig.seo.description,
  icons: {
    icon: restaurantConfig.faviconPath
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning style={themeStyle()}>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          richColors
          position="top-right"
          mobileOffset={{
            top: 16,
            bottom: "calc(6.75rem + env(safe-area-inset-bottom))"
          }}
        />
      </body>
    </html>
  );
}

function themeStyle(): React.CSSProperties {
  const { colors, radius, motion } = restaurantConfig.theme;

  return {
    "--color-primary": hexToRgb(colors.primary),
    "--color-secondary": hexToRgb(colors.secondary),
    "--color-accent": hexToRgb(colors.accent),
    "--color-background": hexToRgb(colors.background),
    "--color-surface": hexToRgb(colors.surface),
    "--color-foreground": hexToRgb(colors.foreground),
    "--color-light-background": hexToRgb(colors.lightBackground),
    "--color-light-foreground": hexToRgb(colors.lightForeground),
    "--radius-button": radius.button,
    "--radius-card": radius.card,
    "--motion-duration": motion.duration,
    "--motion-easing": motion.easing
  } as React.CSSProperties;
}

function hexToRgb(hex: string) {
  const cleanHex = hex.replace("#", "");
  const value = Number.parseInt(cleanHex, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `${red} ${green} ${blue}`;
}
