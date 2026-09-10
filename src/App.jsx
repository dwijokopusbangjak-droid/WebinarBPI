import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  User, Lock, Calendar, Users, FileText, Video, PenTool, ClipboardCheck, 
  Plus, Edit, Save, LogOut, FileUp, CheckCircle, ArrowLeft, LayoutDashboard,
  Trash2, Presentation, Share2, Award, X, Sun, Moon, Loader2, Image as ImageIcon,
  CheckSquare, Globe, Smartphone, Printer
} from 'lucide-react';

// --- MOCK DATA & CONFIG ---
const MODERATOR_LIST = [
  "Gizdy Chairul Rizaldy", "Ike Herdiani", "Karina Larasati", 
  "Farida Yustina Noer Fathoni Putri", "Juliyanti Ritonga"
];
const MC_LIST = [
  "Hafifah Aninadia", "Aprilia Nurlaily Utami", "Renita Ridha Laila", "Sugiyanto Agung Raga"
];
const ADMIN_DOCS = [
  "Undangan narasumber", "Undangan peserta", "Undangan keynote speech",
  "Nota Dinas Peminjaman Ruang", "Nota Dinas Relay Youtube"
];
const PUBLIKASI_LIST = [
  "Task force TPP", "Grub Sinergitas", "Instagram Kemendesa", "Instagram BPI", 
  "Instagram Pusbangjak", "Instagram eksternal", "Channel WA Kemendes", 
  "Channel WA BPI", "Website Kemendes", "Website BPI", "Website Pusbangjak"
];

const MOCK_EPISODE = {
  id: 1,
  tanggalRapat: '2023-10-25',
  tema: 'Pendidikan',
  judul: 'Webinar Optimalisasi Pendidikan Berkarakter',
  usulan: [
    { id: 1, judul: 'Webinar Optimalisasi Pendidikan Berkarakter', tema: 'Pendidikan' }
  ],
  tanggalWebinar: '2023-11-05',
  hasilRapatInputted: true,
  narasumber: [
    { id: 101, nama: 'Dr. Budi Santoso, M.Pd', instansi: 'Universitas Indonesia' },
    { id: 102, nama: 'Prof. Siti Rahma, Ph.D', instansi: 'UGM' }
  ],
  administrasi: {
    "Undangan narasumber": { draftFinal: 'Final', statusKirim: 'Sudah', file: 'undangan-narsum.pdf' },
    "Undangan peserta": { draftFinal: 'Draft', statusKirim: 'Belum', file: '' },
    "Undangan keynote speech": { draftFinal: 'Draft', statusKirim: 'Belum', file: '' },
    "Nota Dinas Peminjaman Ruang": { draftFinal: 'Draft', statusKirim: 'Belum', file: '' },
    "Nota Dinas Relay Youtube": { draftFinal: 'Draft', statusKirim: 'Belum', file: '' }
  },
  teknis: { moderator: 'Gizdy Chairul Rizaldy', mc: 'Hafifah Aninadia' },
  multimedia: {
    zoom: { status: 'Sudah', link: 'https://zoom.us/j/123456789' }, 
    ytBpi: { status: 'Belum', link: '' }, 
    ytKemendesa: { status: 'Belum', link: '' }
  },
  desain: { poster: { link: 'https://link.poster/123' }, bgZoom: { link: '' }, thumbnail: { link: '' } },
  presensi: { daring: { status: 'Sudah', link: 'https://forms.gle/xyz' }, luring: { status: 'Belum', link: '' } },
  asrot: {
    paparan1: { status: 'Sudah', file: 'paparan-narsum-1.pdf' },
    paparan2: { status: 'Belum', file: '' },
    paparan3: { status: 'Belum', file: '' }
  },
  publikasi: {
    "Instagram BPI": "Sudah",
    "Website BPI": "Sudah",
    "Grub Sinergitas": "Belum"
  },
  sertifikat: {
    desainStatus: 'Sudah',
    desainFile: 'template-sertifikat.png',
    distribusiStatus: 'Belum',
    linkPenerima: 'https://bit.ly/penerima-sertifikat'
  }
};

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'login' | 'editor'
  const [episodes, setEpisodes] = useState([]);
  const [activeEpisodeId, setActiveEpisodeId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    const unsubscribeDb = onSnapshot(collection(db, 'episodes'), (snapshot) => {
      const eps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEpisodes(eps);
      setIsLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDb();
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleLogin = async (e, email, password) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setCurrentView('home');
      showNotification("Berhasil masuk sebagai Admin!");
    } catch (error) {
      showNotification("Gagal login: Periksa email & password", "danger");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentView('home');
      showNotification("Berhasil keluar dari sesi Admin.");
    } catch (error) {
      showNotification("Gagal logout", "danger");
    }
  };

  const createNewEpisode = async () => {
    const newEp = {
      id: Date.now().toString(),
      tanggalRapat: '',
      tema: '',
      judul: '',
      usulan: [],
      tanggalWebinar: '',
      hasilRapatInputted: false,
      narasumber: [],
      administrasi: null,
      teknis: null,
      multimedia: null,
      desain: null,
      presensi: null,
      asrot: null,
      publikasi: null,
      sertifikat: null
    };
    try {
      await setDoc(doc(db, 'episodes', newEp.id), newEp);
      setActiveEpisodeId(newEp.id);
      setCurrentView('editor');
      showNotification("Episode webinar baru berhasil dibuat.");
    } catch (error) {
      console.error(error);
      showNotification("Gagal membuat episode baru", "danger");
    }
  };

  const openEpisode = (id) => {
    setActiveEpisodeId(id);
    setCurrentView('editor');
  };

  const deleteEpisode = async (id) => {
    try {
      await deleteDoc(doc(db, 'episodes', id.toString()));
      showNotification("Data episode webinar berhasil dihapus.", "danger");
    } catch (error) {
      console.error(error);
      showNotification("Gagal menghapus data", "danger");
    }
  };

  const saveEpisodeData = async (id, updatedData, successMessage = "Data persiapan berhasil disimpan!") => {
    try {
      await setDoc(doc(db, 'episodes', id.toString()), updatedData, { merge: true });
      showNotification(successMessage);
    } catch (error) {
      console.error(error);
      showNotification("Gagal menyimpan data", "danger");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 relative">
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-slide-up">
          <div className={`flex items-center px-5 py-4 rounded-xl shadow-xl backdrop-blur-md text-white border ${
            notification.type === 'danger' 
              ? 'bg-red-600/90 border-red-500' 
              : 'bg-indigo-600/90 border-indigo-500'
          }`}>
            <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 animate-pulse" />
            <span className="text-sm font-medium">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-6 text-white/70 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <nav className="bg-indigo-700 dark:bg-indigo-950 text-white shadow-lg relative z-10 transition-colors duration-300 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div 
              className="flex items-center space-x-3 cursor-pointer group" 
              onClick={() => setCurrentView('home')}
            >
              <div className="bg-indigo-600 dark:bg-indigo-800 p-2 rounded-lg group-hover:scale-105 transition-transform">
                <Video className="w-6 h-6 text-indigo-100" />
              </div>
              <span className="font-bold text-xl tracking-wide">WebinarManager<span className="text-indigo-300 font-light">Pro</span></span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="p-2 rounded-full hover:bg-indigo-600 dark:hover:bg-indigo-800 transition-colors text-indigo-100"
                title="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {isLoggedIn ? (
                <>
                  <span className="text-sm text-indigo-200 hidden sm:inline-block font-medium">Halo, Admin</span>
                  <button onClick={handleLogout} className="flex items-center text-sm bg-indigo-800 dark:bg-indigo-900 hover:bg-indigo-600 px-4 py-2 rounded-lg transition-colors shadow-sm font-medium">
                    <LogOut className="w-4 h-4 mr-2" /> Keluar
                  </button>
                </>
              ) : (
                currentView !== 'login' && (
                  <button onClick={() => setCurrentView('login')} className="flex items-center text-sm bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors shadow-sm font-medium">
                    <User className="w-4 h-4 mr-2" /> Login Admin
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Memuat data dari server...</p>
          </div>
        ) : (
          <>
            {currentView === 'home' && (
              <Dashboard 
                episodes={episodes} 
                isLoggedIn={isLoggedIn}
                onCreate={createNewEpisode} 
                onOpen={openEpisode}
                onDelete={deleteEpisode}
              />
            )}
            
            {currentView === 'login' && (
              <LoginScreen 
                onLogin={handleLogin} 
                onBack={() => setCurrentView('home')} 
              />
            )}

            {currentView === 'editor' && (
              <EpisodeEditor 
                episode={episodes.find(ep => ep.id === activeEpisodeId)} 
                isLoggedIn={isLoggedIn}
                onBack={() => setCurrentView('home')}
                onSave={(data, msg) => saveEpisodeData(activeEpisodeId, data, msg)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// --- LOGIN SCREEN ---
function LoginScreen({ onLogin, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="flex items-center justify-center pt-10 pb-20 animate-slide-up">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-600 p-2 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="bg-indigo-100 dark:bg-indigo-900/50 p-4 rounded-full mx-auto shadow-inner">
            <Video className="w-8 h-8 text-indigo-700 dark:text-indigo-400" />
          </div>
          <div className="w-9"></div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-8">Login Admin</h2>
        
        <form onSubmit={(e) => onLogin(e, email, password)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white" placeholder="admin@bpi.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white" placeholder="Masukkan password" />
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm px-5 py-3.5 text-center transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
            Masuk Sistem
          </button>
        </form>
      </div>
    </div>
  );
}

// --- DASHBOARD ---
function Dashboard({ episodes, isLoggedIn, onCreate, onOpen, onDelete }) {
  const [episodeToDelete, setEpisodeToDelete] = useState(null);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center print:hidden">
          <LayoutDashboard className="mr-3 text-indigo-600 dark:text-indigo-400" /> Dashboard Webinar
        </h1>
        <div className="flex space-x-3 print:hidden">
          <button onClick={() => window.print()} className="flex items-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all active:scale-95">
            <Printer className="w-5 h-5 mr-2" /> Cetak Rekap Usulan
          </button>
          {isLoggedIn && (
            <button onClick={onCreate} className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all active:scale-95">
              <Plus className="w-5 h-5 mr-2" /> Tambah Episode
            </button>
          )}
        </div>
      </div>
      
      {/* GLOBAL PRINT VIEW FOR USULAN */}
      <div className="hidden print:block mb-8">
        <h2 className="text-2xl font-bold text-center uppercase tracking-wider border-b-2 border-black pb-4 mb-6">Rekapitulasi Seluruh Usulan Judul Webinar</h2>
        {episodes.map((ep, i) => {
          if (!ep.usulan || ep.usulan.length === 0) return null;
          return (
            <div key={ep.id} className="mb-6 break-inside-avoid border border-black p-4 rounded">
              <h3 className="font-bold text-lg mb-2">Episode {i + 1}: {ep.judul || '(Belum Ada Judul Final)'}</h3>
              <p className="text-sm mb-3">Tanggal Pelaksanaan: {ep.tanggalWebinar || 'TBD'} | Tanggal Rapat: {ep.tanggalRapat || 'TBD'}</p>
              <table className="w-full text-sm border-collapse border border-black">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-black p-2 w-12 text-center">No</th>
                    <th className="border border-black p-2">Usulan Judul</th>
                    <th className="border border-black p-2">Tema</th>
                    <th className="border border-black p-2">Narasumber</th>
                  </tr>
                </thead>
                <tbody>
                  {ep.usulan.map((u, index) => {
                    const narsums = (ep.narasumber || []).filter(n => n.usulanId === u.id);
                    return (
                      <tr key={u.id}>
                        <td className="border border-black p-2 text-center">{index + 1}</td>
                        <td className="border border-black p-2 font-medium">{u.judul}</td>
                        <td className="border border-black p-2">{u.tema}</td>
                        <td className="border border-black p-2">
                          {narsums.length > 0 ? (
                            <ul className="list-disc pl-4">
                              {narsums.map(n => <li key={n.id}>{n.nama} ({n.instansi})</li>)}
                            </ul>
                          ) : (
                            <span className="italic text-gray-500">Kosong</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <div className="print:hidden">
        {episodes.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-16 text-center transition-colors">
            <Video className="w-20 h-20 text-slate-200 dark:text-slate-700 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Belum ada episode</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">Data kegiatan webinar belum tersedia saat ini. Mulai dengan membuat jadwal baru.</p>
            {isLoggedIn && (
              <button onClick={onCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg">
                Tambah Episode Sekarang
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {episodes.map(ep => (
              <div 
                key={ep.id} 
                onClick={() => onOpen(ep.id)}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500 transition-all cursor-pointer group relative transform hover:-translate-y-1"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                      {ep.tanggalWebinar ? ep.tanggalWebinar : 'Tanggal TBD'}
                    </span>
                    
                    {isLoggedIn && (
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEpisodeToDelete(ep.id); }} 
                          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-slate-700 p-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 transition-all"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                    {ep.judul || '(Belum ada judul)'}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 line-clamp-1">{ep.tema || 'Tema belum ditentukan'}</p>
                </div>
                <div className="p-5 bg-white dark:bg-slate-800 flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
                  <span className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" /> Rapat: {ep.tanggalRapat || '-'}</span>
                  {ep.hasilRapatInputted ? 
                    <span className="flex items-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md"><CheckCircle className="w-4 h-4 mr-1.5" /> Terjadwal</span> : 
                    <span className="flex items-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">Persiapan</span>
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {episodeToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-7 max-w-sm w-full border border-slate-100 dark:border-slate-700 animate-slide-up">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Konfirmasi Hapus</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-8 text-sm leading-relaxed">Apakah Anda yakin ingin menghapus episode ini? Semua data persiapan yang ada di dalamnya akan ikut terhapus permanen.</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setEpisodeToDelete(null)} 
                className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  onDelete(episodeToDelete);
                  setEpisodeToDelete(null);
                }} 
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- EPISODE EDITOR (THE MAIN FORM) ---
function EpisodeEditor({ episode, isLoggedIn, onBack, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [basicInfo, setBasicInfo] = useState({
    tanggalRapat: episode.tanggalRapat || '',
    tema: episode.tema || '',
    judul: episode.judul || '',
    tanggalWebinar: episode.tanggalWebinar || '',
    lokasiWebinar: episode.lokasiWebinar || ''
  });
  const [usulan, setUsulan] = useState(episode.usulan || []);
  const [hasilRapatInputted, setHasilRapatInputted] = useState(episode.hasilRapatInputted || false);
  const [activeTab, setActiveTab] = useState(1);
  const [isEditingJudul, setIsEditingJudul] = useState(false);

  const [narasumber, setNarasumber] = useState(episode.narasumber || []);
  
  const [formAdministrasi, setFormAdministrasi] = useState(() => {
    const base = ADMIN_DOCS.reduce((acc, doc) => ({ ...acc, [doc]: { draftFinal: 'Draft', statusKirim: 'Belum', file: '', kendala: '', mitigasi: '' } }), {});
    return { ...base, ...(episode.administrasi || {}) };
  });
  const [formTeknis, setFormTeknis] = useState(episode.teknis || { moderator: '', mc: '' });
  const [formMultimedia, setFormMultimedia] = useState(episode.multimedia || {
    zoom: { status: 'Belum', link: '' }, ytBpi: { status: 'Belum', link: '' }, ytKemendesa: { status: 'Belum', link: '' }
  });
  const [formDesain, setFormDesain] = useState(episode.desain || {
    poster: { status: 'Belum', link: '' }, bgZoom: { status: 'Belum', link: '' }, thumbnail: { status: 'Belum', link: '' }
  });
  const [formPresensi, setFormPresensi] = useState(episode.presensi || {
    daring: { status: 'Belum', link: '' }, luring: { status: 'Belum', link: '' }
  });
  const [formAsrot, setFormAsrot] = useState(episode.asrot || { laguIndonesiaRaya: 'Belum', dokumen: {} });
  const [formPublikasi, setFormPublikasi] = useState(() => {
    const base = PUBLIKASI_LIST.reduce((acc, item) => ({ ...acc, [item]: 'Belum' }), {});
    return { ...base, ...(episode.publikasi || {}) };
  });
  const [formSertifikat, setFormSertifikat] = useState(episode.sertifikat || {
    desainStatus: 'Belum',
    desainFile: '',
    distribusiStatus: 'Belum',
    linkPenerima: ''
  });

  const tabs = [
    { id: 1, label: 'Informasi Dasar', icon: <FileText className="w-4 h-4 mr-2" /> },
    { id: 2, label: 'Narasumber', icon: <Users className="w-4 h-4 mr-2" /> },
    { id: 3, label: 'Administrasi', icon: <ClipboardCheck className="w-4 h-4 mr-2" /> },
    { id: 4, label: 'Teknis & Multimedia', icon: <Video className="w-4 h-4 mr-2" /> },
    { id: 5, label: 'Desain, Publikasi & Lainnya', icon: <Award className="w-4 h-4 mr-2" /> },
    { id: 6, label: 'Asrot', icon: <Presentation className="w-4 h-4 mr-2" /> },
    { id: 7, label: 'Cetak Laporan', icon: <Printer className="w-4 h-4 mr-2" /> },
    { id: 8, label: 'Cetak Usulan Judul', icon: <Printer className="w-4 h-4 mr-2" /> }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({
      ...basicInfo,
      usulan,
      hasilRapatInputted,
      narasumber,
      administrasi: formAdministrasi,
      teknis: formTeknis,
      multimedia: formMultimedia,
      desain: formDesain,
      presensi: formPresensi,
      asrot: formAsrot,
      publikasi: formPublikasi,
      sertifikat: formSertifikat
    });
    setIsSaving(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 animate-slide-up transition-colors overflow-hidden print:shadow-none print:border-none print:bg-transparent">
      <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 print:hidden">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-5 p-2.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Data Webinar</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">Persiapan Episode: {basicInfo.judul || 'Baru'}</p>
          </div>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95"
        >
          {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          {isSaving ? 'Menyimpan...' : 'Simpan Data'}
        </button>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700 px-6 pt-4 bg-slate-50/30 dark:bg-slate-800/50 overflow-x-auto custom-scrollbar print:hidden">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-5 py-3.5 font-semibold text-sm whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.id 
                ? 'border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-t-xl' 
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-xl'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-8 min-h-[500px]">
        {/* TAB 1: INFORMASI DASAR */}
        {activeTab === 1 && (
          <div className="space-y-8 max-w-4xl animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              {isLoggedIn ? (
                <div className="md:col-span-2 space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Daftar Usulan Judul & Tema</label>
                    <button 
                      onClick={() => setUsulan([...usulan, { id: Date.now(), judul: '', tema: '' }])}
                      className="flex items-center text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800 px-3 py-1.5 rounded-lg font-semibold transition-colors shadow-sm"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Tambah Usulan
                    </button>
                  </div>
                  
                  {usulan.length === 0 ? (
                    <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Belum ada usulan judul & tema.</p>
                    </div>
                  ) : (
                    usulan.map((item, index) => (
                      <div key={item.id} className="flex gap-4 items-start bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 relative">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Usulan Judul {index + 1}</label>
                            <input 
                              type="text" 
                              value={item.judul}
                              onChange={e => {
                                const newUsulan = [...usulan];
                                newUsulan[index].judul = e.target.value;
                                setUsulan(newUsulan);
                              }}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                              placeholder="Masukkan usulan judul..." 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Usulan Tema {index + 1}</label>
                            <input 
                              type="text" 
                              value={item.tema}
                              onChange={e => {
                                const newUsulan = [...usulan];
                                newUsulan[index].tema = e.target.value;
                                setUsulan(newUsulan);
                              }}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                              placeholder="Masukkan usulan tema..." 
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => setUsulan(usulan.filter(u => u.id !== item.id))}
                          className="mt-6 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Hapus Usulan"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Pilih Judul & Tema Pelaksanaan</label>
                  <select 
                    value={usulan.find(u => u.judul === basicInfo.judul)?.id || ''}
                    onChange={e => {
                      const selected = usulan.find(u => u.id.toString() === e.target.value);
                      if (selected) {
                        setBasicInfo({ ...basicInfo, judul: selected.judul, tema: selected.tema });
                      } else {
                        setBasicInfo({ ...basicInfo, judul: '', tema: '' });
                      }
                      setIsEditingJudul(false);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Pilih Judul & Tema yang Disetujui --</option>
                    {usulan.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.judul} (Tema: {item.tema})
                      </option>
                    ))}
                  </select>
                  {basicInfo.judul && !isEditingJudul && (
                    <div className="mt-3 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800 relative group">
                      <p className="text-sm text-indigo-900 dark:text-indigo-300"><span className="font-bold">Judul Terpilih:</span> {basicInfo.judul}</p>
                      <p className="text-sm text-indigo-900 dark:text-indigo-300 mt-1"><span className="font-bold">Tema Terpilih:</span> {basicInfo.tema}</p>
                      <button 
                        onClick={() => setIsEditingJudul(true)}
                        className="absolute top-4 right-4 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-sm border border-indigo-200 dark:border-indigo-700 transition-all opacity-0 group-hover:opacity-100"
                        title="Edit Judul & Tema"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {isEditingJudul && (
                    <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Edit Judul Final</label>
                        <input 
                          type="text" 
                          value={basicInfo.judul}
                          onChange={e => setBasicInfo({ ...basicInfo, judul: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                          placeholder="Masukkan judul final..." 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Edit Tema Final</label>
                        <input 
                          type="text" 
                          value={basicInfo.tema}
                          onChange={e => setBasicInfo({ ...basicInfo, tema: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                          placeholder="Masukkan tema final..." 
                        />
                      </div>
                      <div className="flex justify-end">
                         <button 
                          onClick={() => setIsEditingJudul(false)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                          Selesai Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tanggal Rapat Persiapan</label>
                <input 
                  type="date" 
                  value={basicInfo.tanggalRapat}
                  onChange={e => setBasicInfo({...basicInfo, tanggalRapat: e.target.value})}
                  disabled={!isLoggedIn}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-200 dark:disabled:bg-slate-800" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tanggal Pelaksanaan Webinar</label>
                <input 
                  type="date" 
                  value={basicInfo.tanggalWebinar}
                  onChange={e => setBasicInfo({...basicInfo, tanggalWebinar: e.target.value})}
                  disabled={!isLoggedIn}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-200 dark:disabled:bg-slate-800" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Lokasi Webinar (Studio / Ruangan)</label>
                <input 
                  type="text" 
                  value={basicInfo.lokasiWebinar}
                  onChange={e => setBasicInfo({...basicInfo, lokasiWebinar: e.target.value})}
                  disabled={!isLoggedIn}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-200 dark:disabled:bg-slate-800" 
                  placeholder="Contoh: Studio Pusbangjak lantai 3" 
                />
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <label className={`flex items-center p-4 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors w-max ${!isLoggedIn ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                <input 
                  type="checkbox" 
                  checked={hasilRapatInputted}
                  onChange={(e) => setHasilRapatInputted(e.target.checked)}
                  disabled={!isLoggedIn}
                  className={`w-5 h-5 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 ${!isLoggedIn ? 'cursor-not-allowed' : 'cursor-pointer'}`} 
                />
                <span className="ml-3 text-slate-800 dark:text-slate-200 font-bold">Hasil Rapat Sudah Final & Lengkap</span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 2: NARASUMBER */}
        {activeTab === 2 && (
          <div className="space-y-6 animate-fade-in max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Daftar Narasumber</h3>
              <button 
                onClick={() => setNarasumber([...narasumber, { id: Date.now(), nama: '', instansi: '' }])}
                className="flex items-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> Tambah Narasumber
              </button>
            </div>
            
            {usulan.length === 0 ? (
              <div className="text-center p-10 bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Belum ada usulan judul. Silakan tambahkan di tab Informasi Dasar terlebih dahulu.</p>
              </div>
            ) : (
              usulan.map((u, uIndex) => (
                <div key={u.id} className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Narasumber untuk Usulan {uIndex + 1}</h4>
                      <p className="text-lg text-indigo-700 dark:text-indigo-400 font-bold">{u.judul || '(Judul Kosong)'}</p>
                    </div>
                    <button 
                      onClick={() => setNarasumber([...narasumber, { id: Date.now(), usulanId: u.id, nama: '', instansi: '' }])}
                      className="flex items-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                    >
                      <Plus className="w-3 h-3 mr-1.5" /> Tambah Narsum
                    </button>
                  </div>
                  
                  {narasumber.filter(n => n.usulanId === u.id).length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">Belum ada narasumber untuk usulan judul ini.</p>
                  ) : (
                    <div className="space-y-3">
                      {narasumber.map((narsum, index) => {
                        if (narsum.usulanId !== u.id) return null;
                        return (
                          <div key={narsum.id} className="flex gap-4 items-start bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 relative group transition-all hover:border-indigo-200 dark:hover:border-indigo-800">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nama & Gelar</label>
                                <input 
                                  type="text" 
                                  value={narsum.nama}
                                  onChange={(e) => {
                                    const newNarsum = [...narasumber];
                                    newNarsum[index].nama = e.target.value;
                                    setNarasumber(newNarsum);
                                  }}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                                  placeholder="Contoh: Dr. Budi Santoso" 
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Instansi</label>
                                <input 
                                  type="text" 
                                  value={narsum.instansi}
                                  onChange={(e) => {
                                    const newNarsum = [...narasumber];
                                    newNarsum[index].instansi = e.target.value;
                                    setNarasumber(newNarsum);
                                  }}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                                  placeholder="Contoh: Univ. Indonesia" 
                                />
                              </div>
                            </div>
                            <button 
                              onClick={() => setNarasumber(narasumber.filter(n => n.id !== narsum.id))}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors mt-6"
                              title="Hapus Narasumber"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}

            {narasumber.filter(n => !n.usulanId).length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Narasumber Umum / Lama</h4>
                <div className="space-y-3">
                  {narasumber.map((narsum, index) => {
                    if (narsum.usulanId) return null;
                    return (
                      <div key={narsum.id} className="flex gap-4 items-start bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 relative group transition-all hover:border-indigo-200 dark:hover:border-indigo-800">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nama & Gelar</label>
                            <input 
                              type="text" 
                              value={narsum.nama}
                              onChange={(e) => {
                                const newNarsum = [...narasumber];
                                newNarsum[index].nama = e.target.value;
                                setNarasumber(newNarsum);
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Instansi</label>
                            <input 
                              type="text" 
                              value={narsum.instansi}
                              onChange={(e) => {
                                const newNarsum = [...narasumber];
                                newNarsum[index].instansi = e.target.value;
                                setNarasumber(newNarsum);
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => setNarasumber(narasumber.filter(n => n.id !== narsum.id))}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors mt-6"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Penetapan Judul Final</h3>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Pilih Judul & Tema Pelaksanaan</label>
              <select 
                value={usulan.find(u => u.judul === basicInfo.judul)?.id || ''}
                onChange={e => {
                  const selected = usulan.find(u => u.id.toString() === e.target.value);
                  if (selected) {
                    setBasicInfo({ ...basicInfo, judul: selected.judul, tema: selected.tema });
                  } else {
                    setBasicInfo({ ...basicInfo, judul: '', tema: '' });
                  }
                  setIsEditingJudul(false);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer"
              >
                <option value="">-- Pilih Judul & Tema yang Disetujui --</option>
                {usulan.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.judul} (Tema: {item.tema})
                  </option>
                ))}
              </select>
              {basicInfo.judul && !isEditingJudul && (
                <div className="mt-3 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800 relative group">
                  <p className="text-sm text-indigo-900 dark:text-indigo-300"><span className="font-bold">Judul Terpilih:</span> {basicInfo.judul}</p>
                  <p className="text-sm text-indigo-900 dark:text-indigo-300 mt-1"><span className="font-bold">Tema Terpilih:</span> {basicInfo.tema}</p>
                  <button 
                    onClick={() => setIsEditingJudul(true)}
                    className="absolute top-4 right-4 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-sm border border-indigo-200 dark:border-indigo-700 transition-all opacity-0 group-hover:opacity-100"
                    title="Edit Judul & Tema"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              )}
              {isEditingJudul && (
                <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Edit Judul Final</label>
                    <input 
                      type="text" 
                      value={basicInfo.judul}
                      onChange={e => setBasicInfo({ ...basicInfo, judul: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="Masukkan judul final..." 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Edit Tema Final</label>
                    <input 
                      type="text" 
                      value={basicInfo.tema}
                      onChange={e => setBasicInfo({ ...basicInfo, tema: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="Masukkan tema final..." 
                    />
                  </div>
                  <div className="flex justify-end">
                     <button 
                      onClick={() => setIsEditingJudul(false)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Selesai Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ADMINISTRASI */}
        {activeTab === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Administrasi Dokumen</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jenis Dokumen</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status Draft/Final</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status Kirim</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">File Dokumen</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kendala</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mitigasi</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700/50">
                  {ADMIN_DOCS.map(doc => (
                    <tr key={doc} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-200">{doc}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm">
                        <select 
                          value={formAdministrasi[doc]?.draftFinal || 'Draft'}
                          onChange={(e) => setFormAdministrasi({
                            ...formAdministrasi,
                            [doc]: { ...formAdministrasi[doc], draftFinal: e.target.value }
                          })}
                          className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Final">Final</option>
                        </select>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm">
                        <select 
                          value={formAdministrasi[doc]?.statusKirim || 'Belum'}
                          onChange={(e) => setFormAdministrasi({
                            ...formAdministrasi,
                            [doc]: { ...formAdministrasi[doc], statusKirim: e.target.value }
                          })}
                          className={`border rounded-lg p-2 outline-none font-bold shadow-sm ${
                            formAdministrasi[doc]?.statusKirim === 'Sudah' 
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                              : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          <option value="Belum">Belum</option>
                          <option value="Sudah">Sudah</option>
                        </select>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm">
                        <input 
                          type="file" 
                          onChange={(e) => setFormAdministrasi({
                            ...formAdministrasi,
                            [doc]: { ...formAdministrasi[doc], file: e.target.files[0]?.name || '' }
                          })}
                          className="block w-full text-xs text-slate-500 dark:text-slate-400
                            file:mr-3 file:py-1.5 file:px-3
                            file:rounded-lg file:border-0
                            file:text-xs file:font-bold
                            file:bg-indigo-50 file:text-indigo-700
                            hover:file:bg-indigo-100
                            dark:file:bg-indigo-900/30 dark:file:text-indigo-400 dark:hover:file:bg-indigo-800/50
                            cursor-pointer transition-colors"
                        />
                        {formAdministrasi[doc]?.file && (
                          <div className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center bg-slate-100 dark:bg-slate-700/50 w-max px-2 py-1 rounded">
                            <FileText className="w-3 h-3 mr-1.5 text-indigo-500" /> {formAdministrasi[doc].file}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm">
                        <input 
                          type="text"
                          value={formAdministrasi[doc]?.kendala || ''}
                          onChange={(e) => setFormAdministrasi({
                            ...formAdministrasi,
                            [doc]: { ...formAdministrasi[doc], kendala: e.target.value }
                          })}
                          placeholder="Tulis kendala..."
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                        />
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm">
                        <input 
                          type="text"
                          value={formAdministrasi[doc]?.mitigasi || ''}
                          onChange={(e) => setFormAdministrasi({
                            ...formAdministrasi,
                            [doc]: { ...formAdministrasi[doc], mitigasi: e.target.value }
                          })}
                          placeholder="Tulis mitigasi..."
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: TEKNIS & MULTIMEDIA */}
        {activeTab === 4 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-fade-in">
            <div className="space-y-8 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                <Users className="w-5 h-5 mr-3 text-indigo-500" /> Personil Teknis
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Moderator</label>
                  <select 
                    value={formTeknis.moderator}
                    onChange={(e) => setFormTeknis({...formTeknis, moderator: e.target.value})}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                  >
                    <option value="">-- Pilih Moderator --</option>
                    {MODERATOR_LIST.map(mod => <option key={mod} value={mod}>{mod}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Master of Ceremony (MC)</label>
                  <select 
                    value={formTeknis.mc}
                    onChange={(e) => setFormTeknis({...formTeknis, mc: e.target.value})}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                  >
                    <option value="">-- Pilih MC --</option>
                    {MC_LIST.map(mc => <option key={mc} value={mc}>{mc}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-8 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                <Globe className="w-5 h-5 mr-3 text-indigo-500" /> Platform & Multimedia
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Link Zoom Meeting</label>
                  <div className="flex gap-3">
                    <select 
                      value={formMultimedia.zoom.status}
                      onChange={e => setFormMultimedia({ ...formMultimedia, zoom: { ...formMultimedia.zoom, status: e.target.value } })}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm w-32 shrink-0"
                    >
                      <option value="Belum">Belum</option>
                      <option value="Sudah">Sudah</option>
                    </select>
                    <input 
                      type="url" 
                      value={formMultimedia.zoom.link}
                      onChange={e => setFormMultimedia({ ...formMultimedia, zoom: { ...formMultimedia.zoom, link: e.target.value } })}
                      disabled={formMultimedia.zoom.status === 'Belum'}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors" 
                      placeholder="https://zoom.us/j/..." 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Link Live YouTube BPI</label>
                  <div className="flex gap-3">
                    <select 
                      value={formMultimedia.ytBpi.status}
                      onChange={e => setFormMultimedia({ ...formMultimedia, ytBpi: { ...formMultimedia.ytBpi, status: e.target.value } })}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm w-32 shrink-0"
                    >
                      <option value="Belum">Belum</option>
                      <option value="Sudah">Sudah</option>
                    </select>
                    <input 
                      type="url" 
                      value={formMultimedia.ytBpi.link}
                      onChange={e => setFormMultimedia({ ...formMultimedia, ytBpi: { ...formMultimedia.ytBpi, link: e.target.value } })}
                      disabled={formMultimedia.ytBpi.status === 'Belum'}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors" 
                      placeholder="https://youtube.com/live/..." 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Link Live YouTube Kemendesa</label>
                  <div className="flex gap-3">
                    <select 
                      value={formMultimedia.ytKemendesa?.status || 'Belum'}
                      onChange={e => setFormMultimedia({ ...formMultimedia, ytKemendesa: { ...formMultimedia.ytKemendesa, status: e.target.value } })}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm w-32 shrink-0"
                    >
                      <option value="Belum">Belum</option>
                      <option value="Sudah">Sudah</option>
                    </select>
                    <input 
                      type="url" 
                      value={formMultimedia.ytKemendesa?.link || ''}
                      onChange={e => setFormMultimedia({ ...formMultimedia, ytKemendesa: { ...formMultimedia.ytKemendesa, link: e.target.value } })}
                      disabled={formMultimedia.ytKemendesa?.status !== 'Sudah'}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors" 
                      placeholder="https://youtube.com/live/..." 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DESAIN, PRESENSI, SERTIFIKAT, PUBLIKASI */}
        {activeTab === 5 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            
            {/* Card Desain & Presensi */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 px-6 py-4 border-b border-indigo-100 dark:border-indigo-800/50">
                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" /> Aset Desain Visual
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Link / File Poster</label>
                  <div className="flex gap-3">
                    <select 
                      value={formDesain.poster?.status || 'Belum'}
                      onChange={e => setFormDesain({...formDesain, poster: { ...formDesain.poster, status: e.target.value }})}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none w-32 shrink-0"
                    >
                      <option value="Belum">Belum</option>
                      <option value="Sudah">Sudah</option>
                    </select>
                    <input 
                      type="text" 
                      value={formDesain.poster?.link || ''}
                      onChange={e => setFormDesain({...formDesain, poster: { ...formDesain.poster, link: e.target.value }})}
                      disabled={formDesain.poster?.status !== 'Sudah'}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors" 
                      placeholder="Drive link poster..." 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Link Virtual Background Zoom</label>
                  <div className="flex gap-3">
                    <select 
                      value={formDesain.bgZoom?.status || 'Belum'}
                      onChange={e => setFormDesain({...formDesain, bgZoom: { ...formDesain.bgZoom, status: e.target.value }})}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none w-32 shrink-0"
                    >
                      <option value="Belum">Belum</option>
                      <option value="Sudah">Sudah</option>
                    </select>
                    <input 
                      type="text" 
                      value={formDesain.bgZoom?.link || ''}
                      onChange={e => setFormDesain({...formDesain, bgZoom: { ...formDesain.bgZoom, link: e.target.value }})}
                      disabled={formDesain.bgZoom?.status !== 'Sudah'}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors" 
                      placeholder="Drive link background..." 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Link Thumbnail YouTube</label>
                  <div className="flex gap-3">
                    <select 
                      value={formDesain.thumbnail?.status || 'Belum'}
                      onChange={e => setFormDesain({...formDesain, thumbnail: { ...formDesain.thumbnail, status: e.target.value }})}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none w-32 shrink-0"
                    >
                      <option value="Belum">Belum</option>
                      <option value="Sudah">Sudah</option>
                    </select>
                    <input 
                      type="text" 
                      value={formDesain.thumbnail?.link || ''}
                      onChange={e => setFormDesain({...formDesain, thumbnail: { ...formDesain.thumbnail, link: e.target.value }})}
                      disabled={formDesain.thumbnail?.status !== 'Sudah'}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors" 
                      placeholder="Drive link thumbnail..." 
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center">
                  <CheckSquare className="w-5 h-5 mr-2 text-indigo-500" /> Presensi Kegiatan
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Link Form Presensi Daring</label>
                  <div className="flex gap-3">
                    <select 
                      value={formPresensi.daring?.status || 'Belum'}
                      onChange={e => setFormPresensi({...formPresensi, daring: { ...formPresensi.daring, status: e.target.value }})}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none w-32 shrink-0"
                    >
                      <option value="Belum">Belum</option>
                      <option value="Sudah">Sudah</option>
                    </select>
                    <input 
                      type="text" 
                      value={formPresensi.daring?.link || ''}
                      onChange={e => setFormPresensi({...formPresensi, daring: { ...formPresensi.daring, link: e.target.value }})}
                      disabled={formPresensi.daring?.status !== 'Sudah'}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors" 
                      placeholder="https://forms.gle/..." 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Link Form Presensi Luring (Opsional)</label>
                  <div className="flex gap-3">
                    <select 
                      value={formPresensi.luring?.status || 'Belum'}
                      onChange={e => setFormPresensi({...formPresensi, luring: { ...formPresensi.luring, status: e.target.value }})}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none w-32 shrink-0"
                    >
                      <option value="Belum">Belum</option>
                      <option value="Sudah">Sudah</option>
                    </select>
                    <input 
                      type="text" 
                      value={formPresensi.luring?.link || ''}
                      onChange={e => setFormPresensi({...formPresensi, luring: { ...formPresensi.luring, link: e.target.value }})}
                      disabled={formPresensi.luring?.status !== 'Sudah'}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors" 
                      placeholder="https://forms.gle/..." 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Card Sertifikat */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-amber-50 dark:bg-amber-900/20 px-6 py-4 border-b border-amber-100 dark:border-amber-900/50">
                  <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400 flex items-center">
                    <Award className="w-5 h-5 mr-2" /> Pengelolaan Sertifikat (Edisi Sebelumnya)
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Status Desain</label>
                    <select 
                      value={formSertifikat.desainStatus}
                      onChange={(e) => setFormSertifikat({...formSertifikat, desainStatus: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      <option value="Belum">Belum Ada</option>
                      <option value="Proses">Sedang Diproses</option>
                      <option value="Sudah">Selesai (Final)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Status Distribusi</label>
                    <select 
                      value={formSertifikat.distribusiStatus}
                      onChange={(e) => setFormSertifikat({...formSertifikat, distribusiStatus: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      <option value="Belum">Belum Dikirim</option>
                      <option value="Proses">Sedang Dikirim</option>
                      <option value="Sudah">Selesai Dikirim</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Link Drive File / Penerima</label>
                    <input 
                      type="text" 
                      value={formSertifikat.linkPenerima}
                      onChange={e => setFormSertifikat({...formSertifikat, linkPenerima: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 outline-none" 
                      placeholder="Link folder sertifikat..." 
                    />
                  </div>
                </div>
              </div>

              {/* Card Publikasi */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 px-6 py-4 border-b border-emerald-100 dark:border-emerald-900/50">
                  <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-400 flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" /> Checklist Publikasi
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[250px] overflow-y-auto custom-scrollbar">
                  {PUBLIKASI_LIST.map(pub => (
                    <div key={pub} className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:border-emerald-300 transition-colors">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{pub}</span>
                      <select 
                        value={formPublikasi[pub]}
                        onChange={(e) => setFormPublikasi({...formPublikasi, [pub]: e.target.value})}
                        className={`text-xs font-bold rounded-md outline-none p-1 border-0 ${
                          formPublikasi[pub] === 'Sudah' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        <option value="Belum">Belum</option>
                        <option value="Sudah">Sudah</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: ASROT */}
        {activeTab === 6 && (
          <div className="space-y-8 animate-fade-in max-w-4xl">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 px-6 py-4 border-b border-indigo-100 dark:border-indigo-800/50">
                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 flex items-center">
                  <Presentation className="w-5 h-5 mr-2" /> Dokumen Paparan & CV Narasumber
                </h3>
              </div>
              <div className="p-6">
                {narasumber.length === 0 ? (
                  <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Silakan tambahkan narasumber terlebih dahulu di Tab 2 (Narasumber).</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {narasumber.map((narsum) => (
                      <div key={narsum.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-6 bg-slate-50 dark:bg-slate-800/50 shadow-sm transition-all hover:border-indigo-200 dark:hover:border-indigo-800">
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-5 flex items-center">
                          <User className="w-5 h-5 mr-2 text-indigo-500 bg-indigo-100 dark:bg-indigo-900/50 rounded-full p-0.5" /> 
                          {narsum.nama || '(Nama belum diisi)'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Upload Paparan (PPT/PDF)</label>
                            <input 
                              type="file" 
                              onChange={(e) => setFormAsrot({
                                ...formAsrot,
                                dokumen: {
                                  ...formAsrot.dokumen,
                                  [narsum.id]: { ...formAsrot.dokumen?.[narsum.id], paparanFile: e.target.files[0]?.name || '' }
                                }
                              })}
                              className="block w-full text-xs text-slate-500 dark:text-slate-400
                                file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold
                                file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100
                                dark:file:bg-indigo-900/30 dark:file:text-indigo-400 dark:hover:file:bg-indigo-800/50 cursor-pointer transition-colors"
                            />
                            {formAsrot.dokumen?.[narsum.id]?.paparanFile && (
                              <div className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center bg-indigo-50 dark:bg-indigo-900/30 w-full px-3 py-2 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                <FileText className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" /> {formAsrot.dokumen[narsum.id].paparanFile}
                              </div>
                            )}
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Upload CV</label>
                            <input 
                              type="file" 
                              onChange={(e) => setFormAsrot({
                                ...formAsrot,
                                dokumen: {
                                  ...formAsrot.dokumen,
                                  [narsum.id]: { ...formAsrot.dokumen?.[narsum.id], cvFile: e.target.files[0]?.name || '' }
                                }
                              })}
                              className="block w-full text-xs text-slate-500 dark:text-slate-400
                                file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold
                                file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100
                                dark:file:bg-emerald-900/30 dark:file:text-emerald-400 dark:hover:file:bg-emerald-800/50 cursor-pointer transition-colors"
                            />
                            {formAsrot.dokumen?.[narsum.id]?.cvFile && (
                              <div className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center bg-emerald-50 dark:bg-emerald-900/30 w-full px-3 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                <FileText className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" /> {formAsrot.dokumen[narsum.id].cvFile}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden p-6 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white flex items-center">
                  <Video className="w-5 h-5 mr-2 text-indigo-500" /> Ketersediaan Lagu Indonesia Raya
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-7">Pastikan file lagu (video/audio) sudah siap untuk diputar.</p>
              </div>
              <label className="flex items-center cursor-pointer p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700/50 transition-colors rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <input 
                  type="checkbox" 
                  checked={formAsrot.laguIndonesiaRaya === 'Sudah'}
                  onChange={(e) => setFormAsrot({...formAsrot, laguIndonesiaRaya: e.target.checked ? 'Sudah' : 'Belum'})}
                  className="w-5 h-5 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500 cursor-pointer" 
                />
                <span className="ml-3 text-slate-800 dark:text-slate-200 font-bold pr-2">{formAsrot.laguIndonesiaRaya === 'Sudah' ? 'Sudah Tersedia' : 'Belum Tersedia'}</span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 7: CETAK LAPORAN */}
        {activeTab === 7 && (
          <div className="space-y-6 animate-fade-in print:block">
            <div className="flex justify-between items-center print:hidden bg-indigo-50 dark:bg-indigo-900/30 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
              <div>
                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300">Cetak Laporan Hasil Pendataan</h3>
                <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">Unduh seluruh ringkasan persiapan episode ini ke dalam format PDF yang rapi.</p>
              </div>
              <button 
                onClick={() => window.print()} 
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95"
              >
                <Printer className="w-5 h-5 mr-2" /> Download PDF
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm print:shadow-none print:border-none print:bg-white print:text-black">
              <div className="text-center mb-8 border-b-2 border-slate-800 dark:border-slate-500 pb-4 print:border-black">
                <h2 className="text-2xl font-bold uppercase tracking-wider print:text-black">Laporan Kesiapan Webinar</h2>
                <h3 className="text-xl font-semibold mt-1 print:text-black">{basicInfo.judul || 'Belum Ada Judul'}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                <div>
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 print:text-gray-600">Informasi Dasar</h4>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr><td className="py-1 font-semibold w-1/3">Tema:</td><td className="py-1">{basicInfo.tema || '-'}</td></tr>
                      <tr><td className="py-1 font-semibold w-1/3">Tgl Rapat:</td><td className="py-1">{basicInfo.tanggalRapat || '-'}</td></tr>
                      <tr><td className="py-1 font-semibold w-1/3">Tgl Webinar:</td><td className="py-1">{basicInfo.tanggalWebinar || '-'}</td></tr>
                      <tr><td className="py-1 font-semibold w-1/3">Lokasi:</td><td className="py-1">{basicInfo.lokasiWebinar || '-'}</td></tr>
                      <tr><td className="py-1 font-semibold w-1/3">Status Rapat:</td><td className="py-1">{hasilRapatInputted ? 'Sudah Final' : 'Belum Final'}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 print:text-gray-600">Teknis</h4>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr><td className="py-1 font-semibold w-1/3">Moderator:</td><td className="py-1">{formTeknis.moderator || '-'}</td></tr>
                      <tr><td className="py-1 font-semibold w-1/3">MC:</td><td className="py-1">{formTeknis.mc || '-'}</td></tr>
                      <tr><td className="py-1 font-semibold w-1/3">Presensi Daring:</td><td className="py-1">{formPresensi.daring?.status === 'Sudah' ? 'Tersedia' : '-'}</td></tr>
                      <tr><td className="py-1 font-semibold w-1/3">Presensi Luring:</td><td className="py-1">{formPresensi.luring?.status === 'Sudah' ? 'Tersedia' : '-'}</td></tr>
                      <tr><td className="py-1 font-semibold w-1/3">Sertifikat:</td><td className="py-1">{formSertifikat.desainStatus === 'Sudah' ? 'Siap' : 'Proses'}</td></tr>
                      <tr><td className="py-1 font-semibold w-1/3">Indonesia Raya:</td><td className="py-1 font-bold text-indigo-600 dark:text-indigo-400 print:text-black">{formAsrot.laguIndonesiaRaya === 'Sudah' ? '✓ Tersedia' : 'Belum'}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 print:text-gray-600">Daftar Narasumber & Status Dokumen</h4>
                <table className="w-full text-sm border-collapse border border-slate-300 dark:border-slate-600 print:border-black">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-700/50 print:bg-gray-100">
                      <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-left">Nama Narasumber</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-left">Asal Instansi</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center w-32">Status Paparan</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center w-32">Status CV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {narasumber.length === 0 ? (
                      <tr><td colSpan="4" className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center italic text-slate-500 dark:text-slate-400">Belum ada narasumber</td></tr>
                    ) : (
                      narasumber.map(narsum => (
                        <tr key={narsum.id}>
                          <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 font-semibold">{narsum.nama || '-'}</td>
                          <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2">{narsum.instansi || '-'}</td>
                          <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center font-bold text-indigo-600 dark:text-indigo-400 print:text-black">
                            {formAsrot.dokumen?.[narsum.id]?.paparanFile ? '✓ Sudah' : 'Belum'}
                          </td>
                          <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center font-bold text-emerald-600 dark:text-emerald-400 print:text-black">
                            {formAsrot.dokumen?.[narsum.id]?.cvFile ? '✓ Sudah' : 'Belum'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mb-8">
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 print:text-gray-600">Dokumen Administrasi</h4>
                <table className="w-full text-sm border-collapse border border-slate-300 dark:border-slate-600 print:border-black">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-700/50 print:bg-gray-100">
                      <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-left">Jenis Dokumen</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center w-24">Draft/Final</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center w-24">Status Kirim</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-left w-48">Kendala</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-left w-48">Mitigasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ADMIN_DOCS.map(doc => (
                      <tr key={doc}>
                        <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2">{doc}</td>
                        <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center">{formAdministrasi[doc]?.draftFinal || '-'}</td>
                        <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center font-bold">{formAdministrasi[doc]?.statusKirim || '-'}</td>
                        <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2">{formAdministrasi[doc]?.kendala || '-'}</td>
                        <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2">{formAdministrasi[doc]?.mitigasi || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 print:text-gray-600">Platform & Link</h4>
                  <ul className="text-sm space-y-2">
                    <li><span className="font-semibold inline-block w-24">Zoom:</span> {formMultimedia.zoom.link || '-'}</li>
                    <li><span className="font-semibold inline-block w-24">YT BPI:</span> {formMultimedia.ytBpi.link || '-'}</li>
                    <li><span className="font-semibold inline-block w-24">YT Kemendesa:</span> {formMultimedia.ytKemendesa?.link || '-'}</li>
                    <li><span className="font-semibold inline-block w-24">Poster:</span> {formDesain.poster.link || '-'}</li>
                    <li><span className="font-semibold inline-block w-24">Background:</span> {formDesain.bgZoom.link || '-'}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 print:text-gray-600">Status Publikasi</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {PUBLIKASI_LIST.map(pub => (
                      <div key={pub} className="flex justify-between border-b border-slate-100 dark:border-slate-700 print:border-gray-200 pb-1">
                        <span>{pub}</span>
                        <span className="font-bold">{formPublikasi[pub]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
        {/* TAB 8: CETAK USULAN JUDUL */}
        {activeTab === 8 && (
          <div className="space-y-6 animate-fade-in print:block">
            <div className="flex justify-between items-center print:hidden bg-indigo-50 dark:bg-indigo-900/30 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
              <div>
                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300">Cetak Usulan Judul & Narasumber</h3>
                <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">Unduh rekap usulan judul dan narasumber yang telah diinput.</p>
              </div>
              <button 
                onClick={() => window.print()} 
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95"
              >
                <Printer className="w-5 h-5 mr-2" /> Print Data
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm print:shadow-none print:border-none print:bg-white print:text-black">
              <div className="text-center mb-8 border-b-2 border-slate-800 dark:border-slate-500 pb-4 print:border-black">
                <h2 className="text-2xl font-bold uppercase tracking-wider print:text-black">Rekap Usulan Judul & Narasumber</h2>
                <h3 className="text-xl font-semibold mt-1 print:text-black">Episode: {basicInfo.judul || 'Belum Ada Judul Final'}</h3>
              </div>

              {usulan.length === 0 ? (
                <p className="text-center italic text-gray-500">Belum ada data usulan judul.</p>
              ) : (
                <div className="space-y-8">
                  {usulan.map((u, uIndex) => {
                    const narsums = narasumber.filter(n => n.usulanId === u.id);
                    return (
                      <div key={u.id} className="border border-slate-200 dark:border-slate-700 print:border-black p-5 rounded-xl">
                        <div className="mb-4 pb-2 border-b border-slate-100 dark:border-slate-700 print:border-gray-300">
                          <h4 className="font-bold text-lg text-slate-800 dark:text-white print:text-black">Usulan {uIndex + 1}: {u.judul || '(Judul Kosong)'}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 print:text-gray-700 mt-1"><span className="font-semibold">Tema:</span> {u.tema || '-'}</p>
                        </div>
                        
                        <h5 className="font-semibold text-sm text-slate-700 dark:text-slate-300 print:text-black mb-3">Daftar Narasumber:</h5>
                        {narsums.length === 0 ? (
                          <p className="text-sm text-slate-500 italic print:text-gray-500">Belum ada narasumber untuk usulan ini.</p>
                        ) : (
                          <table className="w-full text-sm text-left border-collapse border border-slate-200 dark:border-slate-600 print:border-black">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 print:bg-gray-100">
                              <tr>
                                <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 w-12 text-center">No</th>
                                <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2">Nama & Gelar</th>
                                <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2">Asal Instansi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {narsums.map((n, i) => (
                                <tr key={n.id}>
                                  <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center">{i + 1}</td>
                                  <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2">{n.nama || '-'}</td>
                                  <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2">{n.instansi || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
