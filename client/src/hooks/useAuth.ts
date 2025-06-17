import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // Also check for Replit Auth user
  const { data: replitUser, isLoading: replitLoading } = useQuery({
    queryKey: ["/api/replit-user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const finalUser = user || replitUser;
  const finalLoading = isLoading || replitLoading;

  return {
    user: finalUser,
    isLoading: finalLoading,
    isAuthenticated: !!finalUser,
    isReplitUser: !!replitUser,
    isDatabaseUser: !!user,
  };
}
