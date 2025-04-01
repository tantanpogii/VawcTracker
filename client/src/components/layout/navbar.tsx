import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShieldAlert, Menu, Home, Folder, FileText, User, Settings, LogOut } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = async () => {
    await logout();
  };

  const navLinks = [
    { path: "/", label: "Dashboard", icon: <Home className="mr-2 h-4 w-4" /> },
    { path: "/cases", label: "Cases", icon: <Folder className="mr-2 h-4 w-4" /> },
    { path: "/reports", label: "Reports", icon: <FileText className="mr-2 h-4 w-4" /> },
  ];

  return (
    <nav className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <ShieldAlert className="h-6 w-6 mr-2" />
                <span className="font-bold text-lg hidden sm:inline">VAWC Case Management System</span>
                <span className="font-bold text-lg sm:hidden">VAWC CMS</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {navLinks.map((link) => (
              <Link key={link.path} href={link.path}>
                <Button 
                  variant={isActive(link.path) ? "secondary" : "ghost"}
                  className="text-primary-foreground hover:text-primary-foreground"
                >
                  {link.icon}
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-primary-foreground hover:text-primary-foreground gap-2 focus:ring-0"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline">{user?.fullName || 'User'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-primary-foreground hover:text-primary-foreground md:hidden ml-2"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex flex-col space-y-4 py-4">
                  <div className="flex items-center mb-6">
                    <ShieldAlert className="h-6 w-6 mr-2 text-primary" />
                    <span className="font-bold text-lg">VAWC CMS</span>
                  </div>
                  
                  {navLinks.map((link) => (
                    <Link key={link.path} href={link.path}>
                      <Button 
                        variant={isActive(link.path) ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.icon}
                        {link.label}
                      </Button>
                    </Link>
                  ))}
                  
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
