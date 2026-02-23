import React from "react";
import type { ClipboardMetadata, ClipboardData } from "../util/types";
import type { JSX } from "@emotion/react/jsx-runtime";

type ClipboardContextType = {
  clipboardList: ClipboardMetadata[];
  setClipboardList: React.Dispatch<
    React.SetStateAction<ClipboardMetadata[]>
  >;
  fetchClipboards: (silent?: boolean) => Promise<void>;
  loading: boolean;

  // For full data
  fetchClipboardData: (name: string) => Promise<ClipboardData | null>;
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
    ClipboardMetadata[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  const fetchClipboards = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const response = await fetch("/api/clipboards");
    if (response.status === 204) {
      setClipboardList([]);
      if (!silent) setLoading(false);
      return;
    }
    if (response.status !== 200) {
      console.error("Failed to get all clipboards");
      if (!silent) setLoading(false);
      return;
    }
    const text = await response.text();
    const parsed: ClipboardMetadata[] = JSON.parse(text);
    setClipboardList(parsed);
    if (!silent) setLoading(false);
  }, []);

  const fetchClipboardData = React.useCallback(async (name: string) => {
    try {
      const response = await fetch(`/api/clipboards/${name}`);
      if (!response.ok) {
        throw new Error("Failed to fetch clipboard data");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching clipboard data:", error);
      return null;
    }
  }, []);

  return (
    <ClipboardContext.Provider
      value={{
        clipboardList,
        setClipboardList,
        fetchClipboards,
        loading,
        fetchClipboardData
      }}
    >
      {children}
    </ClipboardContext.Provider>
  );
};
