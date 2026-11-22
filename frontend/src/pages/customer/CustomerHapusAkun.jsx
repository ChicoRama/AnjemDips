import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';

const ACTIVE_STATUSES = [
  'pending',
  'accepted',
  'on_progress',
  'on_the_way',
  'in_progress',
];

export default function CustomerHapusAkun() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [nimConfirm, setNimConfirm] = useState('');
  const [hasActiveOrders, setHasActiveOrders] = useState(false);
  const [checkingOrders, setCheckingOrders] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const checkActiveOrders = async () => {
      try {
        const res = await api.get('/orders');
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const active = list.some((item) =>
          ACTIVE_STATUSES.includes(item.status)
        );
        if (isMounted) {
          setHasActiveOrders(active);
        }
      } catch {
        // Biarkan pengecekan server menangani saat endpoint Langkah 3 aktif
      } finally {
        if (isMounted) {
          setCheckingOrders(false);
        }
      }
    };

    checkActiveOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const expectedIdentifier = user?.nim || user?.email || '';
  const isConfirmed =
    expectedIdentifier !== '' &&
    nimConfirm.trim().toLowerCase() === expectedIdentifier.trim().toLowerCase();

  const canDelete = !checkingOrders && !hasActiveOrders && isConfirmed;

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setError('');

    if (hasActiveOrders) {
      setError('Selesaikan atau batalkan pesanan aktif terlebih dahulu.');
      return;
    }

    if (!isConfirmed) {
      setError('Konfirmasi NIM tidak sesuai dengan akunmu.');
      return;
    }

    setSubmitting(true);
    try {
      await api.delete('/auth/me', { data: { nim: nimConfirm.trim() } });
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus akun.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleDeleteAccount}
      noValidate
      className="pwa-shell"
      style={{
        minHeight: '844px',
        boxSizing: 'border-box',
        background: '#F5F6F8',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '13px',
        lineHeight: 1.4,
        color: '#0F172A',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 20px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          height: '52px',
          flex: 'none',
        }}
      >
        <Link
          to="/customer/profil"
          aria-label="Kembali"
          style={{
            width: '44px',
            height: '44px',
            marginLeft: '-12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0F172A',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <div
          style={{
            fontWeight: 800,
            fontSize: '17px',
            letterSpacing: '-.01em',
          }}
        >
          Hapus akun
        </div>
      </div>

      {/* Konten Utama */}
      <div
        style={{
          flex: 1,
          padding: '10px 20px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Kartu Peringatan Permanen */}
        <Card
          variant="danger"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B91C1C"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.3 3.8L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z" />
            </svg>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#7F1D1D' }}>
              Tindakan ini permanen
            </div>
          </div>

          <div style={{ fontSize: '12.5px', color: '#7F1D1D' }}>
            Menghapus akun akan menghapus profil, data mahasiswa, dan seluruh
            riwayat pesanan AnJem maupun JasTip secara permanen dan tidak
            dapat dipulihkan.
          </div>
        </Card>

        {/* Peringatan jika masih ada pesanan aktif */}
        {hasActiveOrders && (
          <Card
            style={{
              background: '#FEF6E7',
              boxShadow: '0 0 0 1.5px #F59E0B',
              color: '#6B4308',
              fontSize: '12.5px',
              fontWeight: 600,
            }}
          >
            Kamu masih memiliki pesanan yang sedang berjalan. Selesaikan atau
            batalkan pesanan aktif sebelum menghapus akun.
          </Card>
        )}

        {/* Kartu Konfirmasi Identitas */}
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ fontWeight: 700 }}>Konfirmasi penghapusan</div>
          <div style={{ color: '#5B6678', fontSize: '12px' }}>
            Ketik{' '}
            <strong style={{ color: '#0F172A' }}>{expectedIdentifier}</strong>{' '}
            di bawah ini untuk melanjutkan.
          </div>

          <Input
            variant="bordered"
            label={user?.nim ? 'Konfirmasi NIM' : 'Konfirmasi Email'}
            placeholder={expectedIdentifier}
            value={nimConfirm}
            onChange={(e) => {
              setNimConfirm(e.target.value);
              if (error) setError('');
            }}
          />
        </Card>

        {error && (
          <div
            role="alert"
            style={{
              borderRadius: '12px',
              background: '#FEF2F2',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#B91C1C',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Tombol Bawah */}
      <div
        style={{
          padding: '12px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          flex: 'none',
        }}
      >
        <Button
          type="submit"
          variant="danger"
          disabled={!canDelete || submitting}
        >
          {submitting ? 'Menghapus akun...' : 'Hapus akun permanen'}
        </Button>

        <Button to="/customer/profil" variant="outline">
          Batal
        </Button>
      </div>
    </form>
  );
}

