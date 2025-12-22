import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
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
  isSuperAdmin: boolean;
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
  currentAgencyId: string | null;
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
  isSuperAdmin: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [currentAgencyId, setCurrentAgencyId] = useState<string | null>(null);
  
  // Track which user data we've fetched to avoid race conditions
  const fetchedUserIdRef = useRef<string | null>(null);

  // Separate effect to fetch user data when user changes
  // This avoids the setTimeout hack by using proper React effect dependencies
  useEffect(() => {
    const fetchUserData = async (authUser: User) => {
      // Avoid duplicate fetches for the same user
      if (fetchedUserIdRef.current === authUser.id) return;
      fetchedUserIdRef.current = authUser.id;

      // Fetch all user data in parallel
      await Promise.all([
        fetchUserRole(authUser.id),
        fetchUserPermissions(authUser.id),
        fetchCurrentAgencyId(authUser),
      ]);
    };

    if (user) {
      fetchUserData(user);
    } else {
      // Reset when user logs out
      fetchedUserIdRef.current = null;
      setUserRole(null);
      setPermissions(defaultPermissions);
      setCurrentAgencyId(null);
    }
  }, [user?.id]); // Only re-run when user.id changes

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Only update synchronous state in the callback
        // User data fetching is handled by the separate effect above
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Always pick the most recent role (avoid maybeSingle error when multiple rows exist)
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
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
      // Always pick the most recent permissions row (defensive)
      const { data, error } = await supabase
        .from("user_permissions")
        .select(
          "can_sales, can_ops, can_admin, can_finance, can_recurring, is_super_admin, updated_at"
        )
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user permissions:", error);
        // Fallback: if no permissions row, check if admin (admins have all permissions)
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (roleData?.role === "admin") {
          setPermissions({
            canSales: true,
            canOps: true,
            canAdmin: true,
            canFinance: true,
            canRecurring: true,
            isSuperAdmin: false,
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
          canRecurring: data.can_recurring ?? false,
          isSuperAdmin: data.is_super_admin ?? false,
        });
      } else {
        setPermissions(defaultPermissions);
      }
    } catch (err) {
      console.error("Error fetching user permissions:", err);
      setPermissions(defaultPermissions);
    }
  };

  const fetchCurrentAgencyId = async (authUser: User) => {
    const userId = authUser.id;
    const fullName =
      (authUser.user_metadata as any)?.full_name ||
      (authUser.user_metadata as any)?.name ||
      authUser.email ||
      "Usuário";

    try {
      // 1) Ensure profile exists (profiles.full_name is NOT NULL)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("current_agency_id")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching current agency:", profileError);
        setCurrentAgencyId(null);
        return;
      }

      if (!profile) {
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({ id: userId, full_name: fullName });

        if (insertError) {
          console.error("Error creating profile:", insertError);
          setCurrentAgencyId(null);
          return;
        }
      }

      // 2) If a current agency is already set, use it
      if (profile?.current_agency_id) {
        setCurrentAgencyId(profile.current_agency_id);
        return;
      }

      // 3) Otherwise, auto-select the first agency membership
      const { data: membership, error: membershipError } = await supabase
        .from("agency_members")
        .select("agency_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (membershipError) {
        console.error("Error fetching agency membership:", membershipError);
        setCurrentAgencyId(null);
        return;
      }

      const agencyId = membership?.agency_id ?? null;
      if (!agencyId) {
        setCurrentAgencyId(null);
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ current_agency_id: agencyId })
        .eq("id", userId);

      if (updateError) {
        console.error("Error setting current agency:", updateError);
        setCurrentAgencyId(null);
        return;
      }

      setCurrentAgencyId(agencyId);
    } catch (err) {
      console.error("Error fetching current agency:", err);
      setCurrentAgencyId(null);
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

    // Update last_login and log login event
    if (!error) {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;

      if (userId) {
        await supabase
          .from("profiles")
          .update({ last_login: new Date().toISOString() })
          .eq("id", userId);

        // Log successful login
        try {
          await supabase.rpc('log_login_event', {
            _success: true,
            _failure_reason: null,
            _ip_address: null, // Will be captured in the RPC if possible
            _user_agent: navigator.userAgent,
          });
        } catch (logError) {
          console.warn('Failed to log login event:', logError);
        }
      }
    } else {
      // Log failed login attempt (can't use RPC without auth, so skip)
      console.warn('Login failed:', error.message);
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setPermissions(defaultPermissions);
    setCurrentAgencyId(null);
  };

  const isAdminFlag = userRole === "admin";
  
  // Compute derived permissions - SuperAdmin has access to EVERYTHING
  const isSuperAdmin = permissions.isSuperAdmin;
  const derived: DerivedPermissions = {
    canSalesOrAdmin: isSuperAdmin || permissions.canSales || permissions.canAdmin || isAdminFlag,
    canOpsOrAdmin: isSuperAdmin || permissions.canOps || permissions.canAdmin || isAdminFlag,
    canFinanceOrAdmin: isSuperAdmin || permissions.canFinance || permissions.canAdmin || isAdminFlag,
    canAdminOrIsAdmin: isSuperAdmin || permissions.canAdmin || isAdminFlag,
    canRecurringOrAdmin: isSuperAdmin || permissions.canRecurring || permissions.canAdmin || isAdminFlag,
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
        currentAgencyId,
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
