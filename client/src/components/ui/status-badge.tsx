import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Status = 'active' | 'pending' | 'closed';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase() as Status;
  
  const getVariant = (status: Status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 hover:bg-green-500/90';
      case 'pending':
        return 'bg-amber-500 hover:bg-amber-500/90 text-black';
      case 'closed':
        return 'bg-gray-500 hover:bg-gray-500/90';
      default:
        return 'bg-secondary';
    }
  };
  
  const getSizeClass = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'md':
        return 'px-2.5 py-1 text-sm';
      case 'lg':
        return 'px-3 py-1.5 text-base';
    }
  };
  
  const label = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
  
  return (
    <Badge 
      className={cn(
        getVariant(normalizedStatus),
        getSizeClass(size)
      )}
    >
      {label}
    </Badge>
  );
}
