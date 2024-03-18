import { getPalette, PaletteColors } from "./getPalette";
import { useCallback, useReducer, useEffect } from "react";

// usage:
// const { data, loading, error } = usePalette(src)

export type PaletteState = {
  loading: boolean;
  error?: Error;
  data: PaletteColors;
};

type Action =
  | { type: "FETCH_PALETTE_REQUEST" }
  | { type: "FETCH_PALETTE_SUCCESS"; payload: PaletteColors }
  | { type: "FETCH_PALETTE_FAILURE"; payload: Error };

const initialState: PaletteState = {
  loading: true,
  data: {},
  error: undefined,
};

function reducer(state: PaletteState, action: Action): PaletteState {
  switch (action.type) {
    case "FETCH_PALETTE_REQUEST":
      return { ...state, loading: true };
    case "FETCH_PALETTE_SUCCESS":
      return { ...state, loading: false, data: action.payload };
    case "FETCH_PALETTE_FAILURE":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

export function usePalette(src: string): PaletteState {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  const fetchPalette = useCallback(async () => {
    dispatch({ type: "FETCH_PALETTE_REQUEST" });

    try {
      const data = await getPalette(src);
      dispatch({ type: "FETCH_PALETTE_SUCCESS", payload: data });
    } catch (error) {
      dispatch({ type: "FETCH_PALETTE_FAILURE", payload: error });
    }
  }, [src]);

  useEffect(() => {
    fetchPalette();
  }, [fetchPalette]);

  return state;
}
