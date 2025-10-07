import React from "react";
import type { GetClipboardResponse } from "../util/types";
import type { JSX } from "@emotion/react/jsx-runtime";

type ClipboardContextType = {
  clipboardList: GetClipboardResponse[];
  setClipboardList: React.Dispatch<
    React.SetStateAction<GetClipboardResponse[]>
  >;
  fetchClipboards: () => Promise<void>;
  loading: boolean;
};

const ClipboardContext = React.createContext<ClipboardContextType | null>(null);

export const useClipboard = () => {
  return React.useContext(ClipboardContext);
};

type ClipboardProviderProps = {
  children: JSX.Element | JSX.Element[];
};

export const ClipboardProvider: React.FC<ClipboardProviderProps> = ({
  children,
}) => {
  const [clipboardList, setClipboardList] = React.useState<
    GetClipboardResponse[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  const fetchClipboards = React.useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/clipboards");
    if (response.status === 204) {
      setClipboardList([]);
      setLoading(false);
      return;
    }
    if (response.status !== 200) {
      console.error("Failed to get all clipboards");
      setLoading(false);
      return;
    }
    const text = await response.text();
    const parsed: GetClipboardResponse[] = JSON.parse(text);
    setClipboardList(parsed);
    setLoading(false);
  }, []);

  return (
    <ClipboardContext.Provider
      value={{ clipboardList, setClipboardList, fetchClipboards, loading }}
    >
      {children}
    </ClipboardContext.Provider>
  );
};
