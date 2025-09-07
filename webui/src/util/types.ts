export type GetClipboardResponse = {
  name: string;
  text: number[];
  files: FileData[];
  is_encrypted: boolean;
  expiry: number;
};

export type FileData = {
  name: string;
  id: string;
  size: number;
};
