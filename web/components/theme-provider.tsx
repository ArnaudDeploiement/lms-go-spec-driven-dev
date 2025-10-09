"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <div className="transition-[background-color,color] duration-500 ease-out">{children}</div>
    </NextThemesProvider>
  );
}
