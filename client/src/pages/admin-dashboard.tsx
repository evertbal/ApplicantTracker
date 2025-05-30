import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Users, 
  Settings, 
  LogOut, 
  Plus,
  Edit,
  Trash,
  UserCheck,
  UserX
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { adminUser, loading, logout, getAuthHeaders } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newUserDialog, setNewUserDialog] = useState(false);
  const [newAdminDialog, setNewAdminDialog] = useState(false);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Laden...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!adminUser) {
    setLocation('/admin/login');
    return null;
  }

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: adminUser?.role === 'admin',
  });

  // Fetch admin users
  const { data: adminUsers = [], isLoading: adminUsersLoading } = useQuery({
    queryKey: ['admin-admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/admin-users', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch admin users');
      return response.json();
    },
    enabled: adminUser?.role === 'admin',
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error('Failed to update user role');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Gebruikersrol bijgewerkt',
        description: 'De rol van de gebruiker is succesvol gewijzigd.',
      });
    },
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error('Failed to update user status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Gebruikersstatus bijgewerkt',
        description: 'De status van de gebruiker is succesvol gewijzigd.',
      });
    },
  });

  const handleLogout = () => {
    logout();
    setLocation('/admin/login');
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'recruiter': return 'default';
      case 'viewer': return 'secondary';
      default: return 'outline';
    }
  };

  if (adminUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <Shield className="w-12 h-12 mx-auto text-gray-400" />
            <CardTitle>Geen toegang</CardTitle>
            <CardDescription>
              U heeft geen rechten om dit beheerpaneel te bekijken.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} variant="outline">
              Uitloggen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Welkom, {adminUser.username}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={getRoleBadgeVariant(adminUser.role)}>
                {adminUser.role}
              </Badge>
              <Button onClick={handleLogout} variant="ghost" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Uitloggen
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Replit Gebruikers</TabsTrigger>
            <TabsTrigger value="admin-users">Admin Gebruikers</TabsTrigger>
          </TabsList>

          {/* Replit Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Replit Gebruikers
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Beheer gebruikers die via Replit inloggen
                </p>
              </div>
            </div>

            {usersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Laden...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {users.map((user: any) => (
                  <Card key={user.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName} 
                              {!user.firstName && !user.lastName && user.email}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {user.email}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={getRoleBadgeVariant(user.role)}>
                                {user.role}
                              </Badge>
                              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                {user.isActive ? 'Actief' : 'Inactief'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={user.role}
                            onValueChange={(role) => 
                              updateUserRoleMutation.mutate({ userId: user.id, role })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="recruiter">Recruiter</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant={user.isActive ? "destructive" : "default"}
                            onClick={() => 
                              updateUserStatusMutation.mutate({ 
                                userId: user.id, 
                                isActive: !user.isActive 
                              })
                            }
                          >
                            {user.isActive ? (
                              <>
                                <UserX className="w-4 h-4 mr-1" />
                                Deactiveer
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-1" />
                                Activeer
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Admin Users Tab */}
          <TabsContent value="admin-users" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Admin Gebruikers
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Beheer interne admin accounts
                </p>
              </div>
              <Dialog open={newAdminDialog} onOpenChange={setNewAdminDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nieuwe Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nieuwe Admin Gebruiker</DialogTitle>
                    <DialogDescription>
                      Maak een nieuwe admin account aan
                    </DialogDescription>
                  </DialogHeader>
                  <AdminUserForm onSuccess={() => setNewAdminDialog(false)} />
                </DialogContent>
              </Dialog>
            </div>

            {adminUsersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Laden...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {adminUsers.map((user: any) => (
                  <Card key={user.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {user.username}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={getRoleBadgeVariant(user.role)}>
                                {user.role}
                              </Badge>
                              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                {user.isActive ? 'Actief' : 'Inactief'}
                              </Badge>
                            </div>
                            {user.lastLogin && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Laatste login: {new Date(user.lastLogin).toLocaleDateString('nl-NL')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive">
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Form component for creating new admin users
function AdminUserForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');
  const { getAuthHeaders } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createAdminMutation = useMutation({
    mutationFn: async (data: { username: string; passwordHash: string; role: string }) => {
      const response = await fetch('/api/admin/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create admin user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-admin-users'] });
      toast({
        title: 'Admin gebruiker aangemaakt',
        description: 'De nieuwe admin gebruiker is succesvol aangemaakt.',
      });
      onSuccess();
      setUsername('');
      setPassword('');
      setRole('viewer');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAdminMutation.mutate({
      username,
      passwordHash: password, // Will be hashed by the server
      role,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Gebruikersnaam</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Wachtwoord</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="recruiter">Recruiter</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={createAdminMutation.isPending}>
          {createAdminMutation.isPending ? 'Bezig...' : 'Aanmaken'}
        </Button>
      </DialogFooter>
    </form>
  );
}