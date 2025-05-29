import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import CandidatesList from "@/components/CandidatesList";
import TrajectoryList from "@/components/TrajectoryList";
import ClientsList from "@/components/ClientsList";

export default function Dashboard() {
  const [location] = useLocation();
  const [activeSection, setActiveSection] = useState(() => {
    if (location.includes("trajectories")) return "trajectories";
    if (location.includes("clients")) return "clients";
    return "candidates";
  });

  const renderContent = () => {
    switch (activeSection) {
      case "trajectories":
        return <TrajectoryList />;
      case "clients":
        return <ClientsList />;
      default:
        return <CandidatesList />;
    }
  };

  return (
    <Layout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderContent()}
    </Layout>
  );
}
