import React, { ReactNode, ReactElement } from "react";
import { PaletteState, usePalette } from "./usePalette";

// usage:
// <Palette src={src}>
// {({data, loading, error }) => ()}
// </Palette>

export type PaletteProps = {
  src: string;
  children: (palette: PaletteState) => ReactNode;
}

export function Palette({ src, children }: PaletteProps): ReactElement | null {
  const palette = usePalette(src);

  return <>{children(palette)}</>;
}
