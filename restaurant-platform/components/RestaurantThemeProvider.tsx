import React from "react";

interface RestaurantThemeProviderProps {
  primaryColor?: string;
  secondaryColor?: string;
  children: React.ReactNode;
  className?: string;
}

export function RestaurantThemeProvider({
  primaryColor = "#2196F3",
  secondaryColor = "#0A1A3C",
  children,
  className = "",
}: RestaurantThemeProviderProps) {
  const styleObj = {
    "--restaurant-primary": primaryColor,
    "--restaurant-secondary": secondaryColor,
  } as React.CSSProperties;

  return (
    <div className={className} style={styleObj}>
      {children}
    </div>
  );
}

export default RestaurantThemeProvider;
