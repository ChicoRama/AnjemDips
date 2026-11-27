import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Bike, User, MapPin } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isDriver = user.role === 'driver';

  return (
    <header className="sticky top-0 z-20 bg-[#0B4F4A] px-5 py-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[12px] bg-white">
            <MapPin className="h-[19px] w-[19px] text-[#0F766E]" strokeWidth={2.25} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-extrabold leading-[1.2] tracking-[-0.02em] text-white">
                AnjemDips
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-[99px] px-2 py-0.5 text-[10px] font-bold tracking-[0.02em] ${
                  isDriver
                    ? 'bg-[#DDF3E4] text-[#14532D]'
                    : 'bg-[#FBBF24] text-[#0F172A]'
                }`}
              >
                {isDriver ? (
                  <>
                    <Bike className="h-3 w-3" strokeWidth={2.25} />
                    <span>Driver</span>
                  </>
                ) : (
                  <>
                    <User className="h-3 w-3" strokeWidth={2.25} />
                    <span>Pemesan</span>
                  </>
                )}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[12px] font-medium text-[#B7E3DE]">
              Halo, {user.nama}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <NotificationCenter />
          <button
            type="button"
            onClick={handleLogout}
            title="Keluar Akun"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[12px] bg-white/12 px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-white/20 active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={2.2} />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}