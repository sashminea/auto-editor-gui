import { useEffect } from "react";
import { RocketIcon, ExclamationTriangleIcon, CheckIcon, Cross1Icon } from "@radix-ui/react-icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AlertProps {
  type: 'normal' | 'error' | 'success';
  message: string;
  onDismiss: () => void;
}

const AlertComponent: React.FC<AlertProps> = ({ type, message, onDismiss }) => {
  // Success messages clear themselves; errors and progress stay until dismissed
  useEffect(() => {
    if (type !== 'success') return;
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [type, message, onDismiss]);

  const config = {
    error: { icon: <ExclamationTriangleIcon className="h-4 w-4" />, title: "Something went wrong", variant: 'destructive' as const },
    success: { icon: <CheckIcon className="h-4 w-4" />, title: "Done", variant: 'default' as const },
    normal: { icon: <RocketIcon className="h-4 w-4" />, title: "Working…", variant: 'default' as const },
  }[type];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(26rem,calc(100vw-2rem))]">
      <Alert
        variant={config.variant}
        className={cn("flex items-start gap-3 bg-card shadow-lg", type === 'success' && "border-emerald-500/50")}
      >
        <span className={cn("mt-0.5 shrink-0", type === 'success' && "text-emerald-500", type === 'normal' && "text-primary")}>
          {config.icon}
        </span>
        <div className="min-w-0 flex-1">
          <AlertTitle>{config.title}</AlertTitle>
          <AlertDescription className={cn("max-h-40 overflow-auto whitespace-pre-wrap break-words", type !== 'error' && "text-muted-foreground")}>
            {message}
          </AlertDescription>
        </div>
        <Button variant="ghost" size="icon" className="-mr-2 -mt-1.5 h-7 w-7 shrink-0" onClick={onDismiss} aria-label="Dismiss">
          <Cross1Icon className="h-3.5 w-3.5" />
        </Button>
      </Alert>
    </div>
  );
};

export default AlertComponent;