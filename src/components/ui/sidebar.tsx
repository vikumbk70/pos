
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Home,
  Menu,
  Settings,
  ShoppingBag,
  Users,
  LogOut,
  Clock,
} from "lucide-react";

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      setIsOpen(true);
    }
  }, [isMobile]);

  const routes = [
    {
      title: "Dashboard",
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Point of Sale",
      href: "/pos",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      title: "Products",
      href: "/products",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
    {
      title: "Sales History",
      href: "/sales-history",
      icon: <Clock className="h-5 w-5" />,
    },
  ];

  return (
    <aside className="hidden md:block">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-64 flex flex-col gap-4 z-50">
          <SheetHeader className="text-left">
            <SheetTitle>Nimble POS</SheetTitle>
            <SheetDescription>
              Manage your store with ease
            </SheetDescription>
          </SheetHeader>
          <Separator />
          <div className="flex-1">
            <ul className="space-y-1">
              {routes.map((route) => (
                <li key={route.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      navigate(route.href);
                      setIsOpen(false);
                    }}
                  >
                    {route.icon}
                    <span>{route.title}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.username ? `https://ui-avatars.com/api/?name=${user.username}` : undefined} alt={user?.username || ''} />
                  <AvatarFallback>{user?.username?.slice(0, 2) || '--'}</AvatarFallback>
                </Avatar>
                <span>{user?.username || 'User'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end" forceMount>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
              >
                Log out
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SheetContent>
      </Sheet>
      <div className="fixed top-0 left-0 h-full w-64 flex flex-col gap-4 z-50 bg-background border-r border-muted">
        <div className="p-4">
          <h1 className="text-lg font-bold">Nimble POS</h1>
          <p className="text-sm text-muted-foreground">
            Manage your store with ease
          </p>
        </div>
        <Separator />
        <div className="flex-1">
          <ul className="space-y-1">
            {routes.map((route) => (
              <li key={route.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(route.href)}
                >
                  {route.icon}
                  <span>{route.title}</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <Separator />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.username ? `https://ui-avatars.com/api/?name=${user.username}` : undefined} alt={user?.username || ''} />
                <AvatarFallback>{user?.username?.slice(0, 2) || '--'}</AvatarFallback>
              </Avatar>
              <span>{user?.username || 'User'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end" forceMount>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Settings
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
              }}
            >
              Log out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
