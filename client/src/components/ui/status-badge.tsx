import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  size?: string;
}

export default function StatusBadge({ status, size }: StatusBadgeProps) {
  // Define color classes based on status
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "pending":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      case "closed":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default:
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    }
  };

  // Format status display text
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "Active",
      pending: "Pending",
      closed: "Closed"
    };
    
    return statusMap[status.toLowerCase()] || status;
  };

  return (
    <Badge 
      className={cn(
        getStatusClass(status),
        size === "lg" ? "px-3 py-1 text-sm" : ""
      )} 
      variant="outline"
    >
      {getStatusDisplay(status)}
    </Badge>
  );
}