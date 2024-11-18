import { RocketIcon, ExclamationTriangleIcon, CheckIcon, Cross1Icon } from "@radix-ui/react-icons"; // Import Cross1Icon
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AlertProps {
  type: 'normal' | 'error' | 'success';
  message: string;
  onDismiss: () => void;
}

const AlertComponent: React.FC<AlertProps> = ({ type, message, onDismiss }) => {
  let icon;
  let alertTitle = '';
  let alertVariant: 'default' | 'destructive' = 'default'; // Renamed to `alertVariant`

  // Determine the appropriate icon, title, and variant based on the alert type
  if (type === 'error') {
    icon = <ExclamationTriangleIcon className="h-4 w-4" />;
    alertTitle = "Error!";
    alertVariant = 'destructive'; // Set to 'destructive' for error
  } else if (type === 'success') {
    icon = <CheckIcon className="h-4 w-4" />;
    alertTitle = "Success!";
    alertVariant = 'default'; // Success also uses 'default'
  } else {
    icon = <RocketIcon className="h-4 w-4" />;
    alertTitle = "Processing...";
    alertVariant = 'default'; // Processing uses 'default'
  }

  return (
    <Alert variant={alertVariant} className="alert flex flex-row justify-between">
      <span className="mt-1 flex flex-row gap-2">
        {icon}
        <AlertTitle>{alertTitle}</AlertTitle>
      </span>
      <AlertDescription>{message}</AlertDescription>
      <button onClick={onDismiss} className="close-btn">
        <Cross1Icon className="h-4 w-4" /> {/* Use Cross1Icon for close button */}
      </button>
    </Alert>
  );
};

export default AlertComponent;
