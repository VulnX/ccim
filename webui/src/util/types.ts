export type GetClipboardResponse = {
  name: string;
  text: number[];
  file_map: { [key: string]: string };
  is_encrypted: boolean;
  expiry: number;
};