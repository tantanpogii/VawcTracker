import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

interface RoleRestrictedProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

export default function RoleRestricted({ 
  children, 
  allowedRoles, 
  fallback 
}: RoleRestrictedProps) {
  const { user } = useAuth();
  
  // If user has no role or their role is not in the allowed roles
  if (!user?.role || !allowedRoles.includes(user.role)) {
    // Return fallback if provided, or default message
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Alert className="border-amber-500">
        <ShieldAlert className="h-4 w-4 text-amber-500" />
        <AlertDescription>
          You don't have permission to access this feature. Please contact an administrator.
        </AlertDescription>
      </Alert>
    );
  }
  
  // If they have permission, show the children
  return <>{children}</>;
}