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

  React.useEffect(() => {
    setLoading(true);
    const eventSource = new EventSource("/api/clipboards");

    eventSource.onmessage = (event) => {
      try {
        const data: ClipboardMetadata[] = JSON.parse(event.data);
        setClipboardList(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to parse SSE data", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error", err);
    };

    return () => {
      eventSource.close();
    };
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
        fetchClipboards: async () => { }, // Kept for type compatibility if needed elsewhere, but does nothing
        loading,
        fetchClipboardData
      }}
    >
      {children}
    </ClipboardContext.Provider>
  );
};
