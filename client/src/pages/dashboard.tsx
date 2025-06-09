import { useState } from "react";
import { useLocation } from "wouter";
import ResponsiveLayout from "@/components/responsive-layout";
import CandidatesView from "@/components/candidates-view-responsive";
import TrajectoriesView from "@/components/trajectories-view";
import ClientsView from "@/components/clients-view";
import SkeletonDemo from "./skeleton-demo";


export default function Dashboard() {
  const [location] = useLocation();
  const [activeSection, setActiveSection] = useState(() => {
    if (location.includes('candidates')) return 'candidates';
    if (location.includes('trajectories')) return 'trajectories';
    if (location.includes('clients')) return 'clients';
    if (location.includes('skeleton-demo')) return 'skeleton-demo';
    return 'candidates';
  });

  const renderActiveView = () => {
    switch (activeSection) {
      case 'candidates':
        return <CandidatesView />;
      case 'trajectories':
        return <TrajectoriesView />;
      case 'clients':
        return <ClientsView />;
      case 'skeleton-demo':
        return <SkeletonDemo />;
      default:
        return <CandidatesView />;
    }
  };

  return (
    <ResponsiveLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {renderActiveView()}
    </ResponsiveLayout>
  );
}
