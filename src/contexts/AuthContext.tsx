import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface UserPermissions {
  canSales: boolean;
  canOps: boolean;
  canAdmin: boolean;
  canFinance: boolean;
  canRecurring: boolean;
}

// Derived permission helpers
export interface DerivedPermissions {
  canSalesOrAdmin: boolean;
  canOpsOrAdmin: boolean;
  canFinanceOrAdmin: boolean;
  canAdminOrIsAdmin: boolean;
  canRecurringOrAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userRole: AppRole | null;
  isAdmin: boolean;
  permissions: UserPermissions;
  derived: DerivedPermissions;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

const defaultPermissions: UserPermissions = {
  canSales: false,
  canOps: false,
  canAdmin: false,
  canFinance: false,
  canRecurring: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer fetching role and permissions to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
            fetchUserPermissions(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setPermissions(defaultPermissions);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
        fetchUserPermissions(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        setUserRole(null);
        return;
      }

      setUserRole(data?.role ?? null);
    } catch (err) {
      console.error("Error fetching user role:", err);
      setUserRole(null);
    }
  };

  const fetchUserPermissions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_permissions")
        .select("can_sales, can_ops, can_admin, can_finance, can_recurring")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user permissions:", error);
        // Fallback: if no permissions row, check if admin (admins have all permissions)
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (roleData?.role === "admin") {
          setPermissions({
            canSales: true,
            canOps: true,
            canAdmin: true,
            canFinance: true,
            canRecurring: true,
          });
        } else {
          setPermissions(defaultPermissions);
        }
        return;
      }

      if (data) {
        setPermissions({
          canSales: data.can_sales ?? false,
          canOps: data.can_ops ?? false,
          canAdmin: data.can_admin ?? false,
          canFinance: data.can_finance ?? false,
          canRecurring: (data as any).can_recurring ?? false,
        });
      } else {
        setPermissions(defaultPermissions);
      }
    } catch (err) {
      console.error("Error fetching user permissions:", err);
      setPermissions(defaultPermissions);
    }
  };

  const refreshPermissions = async () => {
    if (user) {
      await fetchUserPermissions(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Update last_login (based on the current authenticated user)
    if (!error) {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;

      if (userId) {
        await supabase
          .from("profiles")
          .update({ last_login: new Date().toISOString() })
          .eq("id", userId);
      }
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setPermissions(defaultPermissions);
  };

  const isAdminFlag = userRole === "admin";
  
  // Compute derived permissions
  const derived: DerivedPermissions = {
    canSalesOrAdmin: permissions.canSales || permissions.canAdmin || isAdminFlag,
    canOpsOrAdmin: permissions.canOps || permissions.canAdmin || isAdminFlag,
    canFinanceOrAdmin: permissions.canFinance || permissions.canAdmin || isAdminFlag,
    canAdminOrIsAdmin: permissions.canAdmin || isAdminFlag,
    canRecurringOrAdmin: permissions.canRecurring || permissions.canAdmin || isAdminFlag,
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        userRole,
        isAdmin: isAdminFlag,
        permissions,
        derived,
        signIn,
        signOut,
        refreshPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
