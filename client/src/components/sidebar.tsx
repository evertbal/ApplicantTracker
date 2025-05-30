import { Users, Route, Building, BarChart3, Settings, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeSection, onSectionChange, isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();

  // Fetch actual counts from API
  const { data: candidates = [] } = useQuery({
    queryKey: ['/api/candidates'],
    retry: false,
  });

  const { data: trajectories = [] } = useQuery({
    queryKey: ['/api/trajectories'],
    retry: false,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    retry: false,
  });

  const navigationItems = [
    {
      id: 'candidates',
      label: 'Kandidaten',
      icon: Users,
      count: candidates.length,
    },
    {
      id: 'trajectories',
      label: 'Trajecten',
      icon: Route,
      count: trajectories.length,
    },
    {
      id: 'clients',
      label: 'Opdrachtgevers',
      icon: Building,
      count: clients.length,
    },
  ];

  const managementItems = [
    {
      id: 'reports',
      label: 'Rapportages',
      icon: BarChart3,
    },
    {
      id: 'settings',
      label: 'Instellingen',
      icon: Settings,
    },
  ];

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">ATS Portal</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Recruitment Hub</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start space-x-3 px-4 py-3 h-auto font-medium",
                  activeSection === item.id
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                onClick={() => onSectionChange(item.id)}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  activeSection === item.id
                    ? "bg-white bg-opacity-20 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                )}>
                  {item.count}
                </span>
              </Button>
            </li>
          ))}
        </ul>

        {/* Secondary Navigation */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Beheer
          </h3>
          <ul className="space-y-1">
            {managementItems.map((item) => (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  className="w-full justify-start space-x-3 px-4 py-2 h-auto text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary text-white text-sm">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || 'User'
              }
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            onClick={() => window.location.href = '/api/logout'}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
    </>
  );
}
