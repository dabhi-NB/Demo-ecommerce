import { useState } from "react";

export default function useDialogState(initialState: boolean = false) {
  return useState<boolean>(initialState);
}
