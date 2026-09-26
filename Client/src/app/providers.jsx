import { AuthProvider } from '../features/auth/state/authContext';
export default function Providers({ children }) { return <AuthProvider>{children}</AuthProvider>; }
