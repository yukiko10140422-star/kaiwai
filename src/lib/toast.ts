type ToastListener = (message: string, type: "error" | "success") => void;
let listener: ToastListener | null = null;

export function onToast(fn: ToastListener) {
  listener = fn;
  return () => {
    listener = null;
  };
}

export function showToast(message: string, type: "error" | "success" = "error") {
  if (listener) listener(message, type);
}
