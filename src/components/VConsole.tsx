"use client";

import { useEffect } from "react";

export const VConsoleComponent = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_VCONSOLE === "true") {
      import("vconsole").then((module) => {
        const VConsole = module.default;
        new VConsole();
      });
    }
  }, []);

  return null;
};
