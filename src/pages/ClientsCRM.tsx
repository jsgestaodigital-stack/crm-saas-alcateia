import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { ClientsV2List } from '@/components/clients-v2';

export default function ClientsCRM() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 p-6">
            <ClientsV2List />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
