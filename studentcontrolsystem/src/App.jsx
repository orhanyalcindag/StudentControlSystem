import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase'; // db'yi ekledik
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore'; // Veri çekme komutları eklendi
import Login from './Login';
import AddClass from './AddClass';
import GradingPanel from './GradingPanel';
import ReportPanel from './ReportPanel';
import AdminPanel from './AdminPanel';

// BURAYA KENDİ E-POSTA ADRESİNİ YAZ (Tamamen küçük harflerle)
const ADMIN_EMAIL = "orhanyalcindag@gmail.com"; 

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Yeni eklenen durumlar (State)
  const [isAdmin, setIsAdmin] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const adminCheck = currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        setIsAdmin(adminCheck);

        if (adminCheck) {
          setIsAuthorized(true); // Admin her şeye yetkilidir
          setLoading(false);
        } else {
          // Giriş yapan kişi admin değilse, 'teachers' tablosunda yetkisi var mı diye bakıyoruz
          const q = query(collection(db, "teachers"), where("email", "==", currentUser.email.toLowerCase()));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            setTeacherProfile(snapshot.docs[0].data()); // Öğretmenin ders ve sınıf listesini alıyoruz
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false); // Sisteme kayıtlı ama Admin ona henüz yetki vermemiş
          }
          setLoading(false);
        }
      } else {
        setUser(null);
        setIsAuthorized(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '18px', fontWeight: 'bold', color: '#4b5563' }}>Sistem Yükleniyor...</div>;

  if (!user) {
    return <Login />;
  }

  // Kullanıcı giriş yapmış ama Admin ona panelden yetki/ders atamamışsa:
  if (!isAuthorized) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#dc2626' }}>Yetkisiz Giriş</h2>
        <p>Hesabınız başarıyla oluşturulmuş ancak henüz sınıflarınız ve dersleriniz tanımlanmamış.</p>
        <p>Lütfen okul yöneticisi ile iletişime geçin.</p>
        <button onClick={handleLogout} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#4b5563', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Çıkış Yap</button>
      </div>
    );
  }

  // Yetkili Kullanıcı (Admin veya Öğretmen) Ekranı
  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', width: '100%' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', backgroundColor: '#1e293b', color: 'white', padding: '15px 25px', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '0.5px' }}>Öğrenci Kontrol Sistemi</h1>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>
              Hoş geldin, <strong style={{ color: '#e2e8f0' }}>{user.email}</strong> {isAdmin ? "(Yönetici)" : `(${teacherProfile?.name})`}
            </span>
          </div>
          <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>🚪 Çıkış Yap</button>
        </div>
        
        {isAdmin && (
          <div style={{ marginBottom: '25px' }}>
            <AdminPanel />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '25px', alignItems: 'start', marginBottom: '25px' }}>
          <div style={{ width: '100%' }}>
            {/* Alt panellere yetki durumunu ve öğretmen profilini gönderiyoruz */}
            <AddClass isAdmin={isAdmin} teacherProfile={teacherProfile} />
          </div>
          <div style={{ width: '100%' }}>
            <GradingPanel isAdmin={isAdmin} teacherProfile={teacherProfile} />
          </div>
        </div>

        <div style={{ width: '100%', marginBottom: '20px' }}>
          <ReportPanel isAdmin={isAdmin} teacherProfile={teacherProfile} />
        </div>

      </div>
    </div>
  );
}

export default App;