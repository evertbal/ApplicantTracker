import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "./sidebar";
import { cn } from "@/lib/utils";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function ResponsiveLayout({ children, activeSection, onSectionChange }: ResponsiveLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar 
        activeSection={activeSection}
        onSectionChange={(section) => {
          onSectionChange(section);
          setSidebarOpen(false); // Close sidebar on mobile after selection
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="p-2"
            >
              <Menu className="w-6 h-6" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {activeSection === 'candidates' && 'Kandidaten'}
              {activeSection === 'trajectories' && 'Trajecten'}
              {activeSection === 'clients' && 'Opdrachtgevers'}
              {activeSection === 'reports' && 'Rapportages'}
            </h1>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}