interface StatusMessageProps {
  type: "error" | "success" | "info";
  message: string;
}

export function StatusMessage({ type, message }: StatusMessageProps) {
  return <div className={`status-message status-${type}`}>{message}</div>;
}
