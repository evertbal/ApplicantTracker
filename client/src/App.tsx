import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCombinedAuth } from "@/hooks/useCombinedAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import CandidateDetail from "@/pages/candidate-detail";
import ClientDetail from "@/pages/client-detail";
import TrajectoryDetail from "@/pages/trajectory-detail";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useCombinedAuth();

  return (
    <Switch>
      {/* Auth page - always accessible */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin routes - independent of Replit auth */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      
      {/* Regular app routes */}
      {isLoading ? (
        <Route path="/" component={Landing} />
      ) : !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/candidates" component={Dashboard} />
          <Route path="/candidate/:id" component={CandidateDetail} />
          <Route path="/client/:id" component={ClientDetail} />
          <Route path="/trajectory/:id" component={TrajectoryDetail} />
          <Route path="/trajectories" component={Dashboard} />
          <Route path="/clients" component={Dashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
