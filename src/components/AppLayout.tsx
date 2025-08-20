import { Outlet } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      <AppFooter />
    </div>
  );
}

export default AppLayout;

