import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import Button from '../../components/Button';
import Input from '../../components/Input';
import BottomNav from '../../components/BottomNav';
import { getDriverVehicleProfile } from '../../mocks/driverMocks';

function formatRibuan(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('id-ID');
}

export default function DriverProfil() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const isOnline = Boolean(user?.is_online);
  const initialVehicle = getDriverVehicleProfile(user);

  const [vehicle, setVehicle] = useState(initialVehicle);
  const [editingVehicle, setEditingVehicle] = useState(false);
  const [jenisKendaraan, setJenisKendaraan] = useState(
    initialVehicle.jenis_kendaraan
  );
  const [platNomor, setPlatNomor] = useState(initialVehicle.plat_nomor);
  const [kapasitas, setKapasitas] = useState(
    String(initialVehicle.kapasitas_penumpang || 4)
  );
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState('');

  const [stats, setStats] = useState({ completed: 0, earnings: 0 });

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const res = await api.get('/orders');
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const completedList = list.filter(
          (item) =>
            item.driver_id === user?.id && item.status === 'completed'
        );
        const earnings = completedList.reduce(
          (sum, item) => sum + (Number(item.ongkir) || 0),
          0
        );
        if (isMounted) {
          setStats({ completed: completedList.length, earnings });
        }
      } catch {
        // Abaikan gangguan jaringan sementara
      }
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    setVehicleError('');
    setSavingVehicle(true);
    try {
      const res = await api.patch('/driver/vehicle', {
        jenis_kendaraan: jenisKendaraan,
        plat_nomor: platNomor,
        kapasitas_penumpang: Number(kapasitas),
      });
      const saved = res.data.user;
      updateUser(saved);
      setVehicle({
        jenis_kendaraan: saved.jenis_kendaraan,
        plat_nomor: saved.plat_nomor,
        kapasitas_penumpang: saved.kapasitas_penumpang,
      });
      setEditingVehicle(false);
    } catch (err) {
      setVehicleError(
        err.response?.data?.message || 'Gagal menyimpan data kendaraan.'
      );
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.nama || 'Driver';
  const initial = (displayName.trim()[0] || 'D').toUpperCase();

  return (
    <div
      className="pwa-shell"
      style={{
        height: '844px',
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
      <div style={{ padding: '20px 20px 0', flex: 'none' }}>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 800,
            letterSpacing: '-.02em',
            margin: 0,
          }}
        >
          Profil
        </h1>
        <div style={{ color: '#5B6678', marginTop: '2px' }}>
          Data driver dan pengaturan kendaraan.
        </div>
      </div>

      {/* Konten Utama */}
      <div
        style={{
          flex: 1,
          padding: '16px 20px 84px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflowY: 'auto',
        }}
      >
        {/* Kartu Identitas */}
        <Card
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '99px',
              background: '#0F766E',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '20px',
              flex: 'none',
            }}
          >
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: '16px',
                letterSpacing: '-.01em',
              }}
            >
              {displayName}
            </div>
            <div style={{ color: '#5B6678', fontSize: '12px', marginTop: '2px' }}>
              {user?.nim ? `NIM ${user.nim}` : user?.email || '-'}
            </div>
          </div>
          <Chip variant={isOnline ? 'success' : 'off'}>
            {isOnline ? 'ON' : 'OFF'}
          </Chip>
        </Card>

        {/* Statistik Driver */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Card style={{ flex: 1, padding: '12px 14px' }}>
            <div style={{ color: '#5B6678', fontSize: '11px' }}>
              Trip selesai
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '20px',
                color: '#0F766E',
                marginTop: '2px',
              }}
            >
              {stats.completed}
            </div>
          </Card>

          <Card style={{ flex: 1, padding: '12px 14px' }}>
            <div style={{ color: '#5B6678', fontSize: '11px' }}>
              Total pendapatan
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '18px',
                color: '#0F172A',
                marginTop: '2px',
              }}
            >
              Rp {formatRibuan(stats.earnings)}
            </div>
          </Card>
        </div>

        {/* Kartu Kendaraan Driver */}
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '14px' }}>Kendaraan</div>
            {!editingVehicle && (
              <button
                type="button"
                onClick={() => setEditingVehicle(true)}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: '#0F766E',
                  font: "700 12px 'Plus Jakarta Sans',system-ui,sans-serif",
                  cursor: 'pointer',
                }}
              >
                Ubah
              </button>
            )}
          </div>

          {editingVehicle ? (
            <form
              onSubmit={handleSaveVehicle}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div
                style={{
                  display: 'flex',
                  background: '#F1F3F6',
                  borderRadius: '12px',
                  padding: '3px',
                  gap: '3px',
                }}
              >
                {['motor', 'mobil'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setJenisKendaraan(type)}
                    style={{
                      flex: 1,
                      height: '36px',
                      borderRadius: '9px',
                      border: 0,
                      background:
                        jenisKendaraan === type ? '#fff' : 'transparent',
                      color:
                        jenisKendaraan === type ? '#0F766E' : '#5B6678',
                      font: "700 12px 'Plus Jakarta Sans',system-ui,sans-serif",
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <Input
                label="Plat nomor"
                placeholder="H 1234 AB"
                value={platNomor}
                onChange={(e) => setPlatNomor(e.target.value)}
              />

              {jenisKendaraan === 'mobil' && (
                <Input
                  label="Kapasitas penumpang"
                  type="number"
                  min={1}
                  max={8}
                  value={kapasitas}
                  onChange={(e) => setKapasitas(e.target.value)}
                />
              )}

              {vehicleError && (
                <p role="alert" style={{ margin: 0, color: '#B91C1C', fontSize: '12px' }}>
                  {vehicleError}
                </p>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                <Button
                  type="button"
                  variant="outline"
                  height={40}
                  onClick={() => setEditingVehicle(false)}
                  style={{ flex: 1 }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  height={40}
                  disabled={savingVehicle}
                  style={{ flex: 1 }}
                >
                  {savingVehicle ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#5B6678' }}>Jenis kendaraan</span>
                <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>
                  {vehicle.jenis_kendaraan}
                </span>
              </div>

              <div style={{ height: '1px', background: '#EEF0F3' }} />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#5B6678' }}>Plat nomor</span>
                <span style={{ fontWeight: 700 }}>{vehicle.plat_nomor}</span>
              </div>

              {vehicle.jenis_kendaraan === 'mobil' && (
                <>
                  <div style={{ height: '1px', background: '#EEF0F3' }} />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: '#5B6678' }}>
                      Kapasitas penumpang
                    </span>
                    <span style={{ fontWeight: 700 }}>
                      {vehicle.kapasitas_penumpang} orang
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </Card>

        {/* Kartu Data Akun */}
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '14px' }}>Data akun</div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#5B6678' }}>NIM</span>
            <span style={{ fontWeight: 700 }}>{user?.nim || '-'}</span>
          </div>

          <div style={{ height: '1px', background: '#EEF0F3' }} />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#5B6678' }}>Email</span>
            <span style={{ fontWeight: 700 }}>{user?.email || '-'}</span>
          </div>

          <div style={{ height: '1px', background: '#EEF0F3' }} />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#5B6678' }}>Nomor WhatsApp</span>
            <span style={{ fontWeight: 700 }}>{user?.no_wa || '-'}</span>
          </div>
        </Card>

        {/* Hapus Akun */}
        <Card style={{ padding: '4px 14px' }}>
          <Link
            to="/driver/hapus-akun"
            style={{
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              color: '#B91C1C',
              fontWeight: 700,
            }}
          >
            <span>Hapus akun permanen</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </Card>

        {/* Tombol Keluar */}
        <div style={{ marginTop: '4px' }}>
          <Button type="button" variant="dangerOutline" onClick={handleLogout}>
            Keluar dari akun
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav role="driver" />
    </div>
  );
}

