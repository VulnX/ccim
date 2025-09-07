import React from "react";
import type { GetClipboardResponse } from "../util/types";
import type { JSX } from "@emotion/react/jsx-runtime";

type ClipboardContextType = {
  clipboardList: GetClipboardResponse[];
  setClipboardList: React.Dispatch<
    React.SetStateAction<GetClipboardResponse[]>
  >;
  fetchClipboards: () => Promise<void>;
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

  const fetchClipboards = React.useCallback(async () => {
    const response = await fetch("/api/clipboards");
    if (response.status === 204) {
      setClipboardList([]);
      return;
    }
    if (response.status !== 200) {
      console.error("Failed to get all clipboards");
      return;
    }
    const text = await response.text();
    const parsed: GetClipboardResponse[] = JSON.parse(text);
    setClipboardList(parsed);
  }, []);

  return (
    <ClipboardContext.Provider
      value={{ clipboardList, setClipboardList, fetchClipboards }}
    >
      {children}
    </ClipboardContext.Provider>
  );
};
