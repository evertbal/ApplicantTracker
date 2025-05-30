import { useAuth } from "./useAuth";
import { useAdminAuth } from "./useAdminAuth";

export function useCombinedAuth() {
  const { user: replitUser, isLoading: replitLoading, isAuthenticated: replitAuth } = useAuth();
  const { adminUser, loading: adminLoading } = useAdminAuth();

  // If either is loading, show loading
  const isLoading = replitLoading || adminLoading;
  
  // User is authenticated if they have either Replit auth or admin auth
  const isAuthenticated = replitAuth || !!adminUser;
  
  // Return the authenticated user (prefer Replit user, fallback to admin user)
  const user = replitUser || (adminUser ? { 
    id: adminUser.id.toString(), 
    email: null, 
    firstName: adminUser.username,
    lastName: null,
    profileImageUrl: null 
  } : null);

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin: !!adminUser,
    adminUser,
    replitUser
  };
}