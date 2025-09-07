import React from "react";
import type { GetClipboardResponse } from "../util/types";
import type { JSX } from "@emotion/react/jsx-runtime";

type ClipboardContextType = {
  clipboardList: GetClipboardResponse[];
  setClipboardList: React.Dispatch<
    React.SetStateAction<GetClipboardResponse[]>
  >;
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

  return (
    <ClipboardContext.Provider value={{ clipboardList, setClipboardList }}>
      {children}
    </ClipboardContext.Provider>
  );
};
