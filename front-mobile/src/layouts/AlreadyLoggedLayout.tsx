import { Navigate, Outlet } from 'react-router';
import { useUser } from '../hooks/auth/useAuth';
import { isLoggedIn } from '../storage/auth/auth.storage';

export default function AlreadyLoggedLayout() {
  const { data: user, isLoading } = useUser();

  if (isLoggedIn() && isLoading) {
    return null;
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
