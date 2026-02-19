import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Sayfalarımız
import Login from './Login';
import AddClass from './AddClass';
import GradingPanel from './GradingPanel';
import ReportPanel from './ReportPanel';
import AdminPanel from './AdminPanel';

const ADMIN_EMAIL = "orhanyalcindag@gmail.com"; //

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const adminCheck = currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        setIsAdmin(adminCheck);
        if (!adminCheck) {
          const q = query(collection(db, "teachers"), where("email", "==", currentUser.email.toLowerCase()));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) setTeacherProfile(snapshot.docs[0].data());
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Sistem Hazırlanıyor...</div>;
  if (!user) return <Login />;

  const handleLogout = () => signOut(auth);

  // Menü Tasarımı
  const menuStyle = {
    padding: '15px 20px',
    color: 'white',
    textDecoration: 'none',
    display: 'block',
    fontSize: '16px',
    borderRadius: '8px',
    marginBottom: '10px',
    transition: 'background 0.3s'
  };

  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
        
        {/* 📟 SOL YAN MENÜ (SIDEBAR) */}
        <div style={{ width: '280px', backgroundColor: '#1e293b', color: 'white', padding: '20px', position: 'fixed', height: '100vh' }}>
          <h2 style={{ fontSize: '20px', borderBottom: '1px solid #334155', paddingBottom: '20px', marginBottom: '20px' }}>🎯 Öğrenci Kontrol</h2>
          
          <nav>
            <Link to="/" style={menuStyle} onMouseOver={(e) => e.target.style.backgroundColor='#334155'} onMouseOut={(e) => e.target.style.backgroundColor='transparent'}>🏠 Ana Sayfa</Link>
            
            {isAdmin && (
              <Link to="/admin" style={menuStyle} onMouseOver={(e) => e.target.style.backgroundColor='#334155'} onMouseOut={(e) => e.target.style.backgroundColor='transparent'}>👑 Yönetici Paneli</Link>
            )}
            
            <Link to="/sinif-ekle" style={menuStyle} onMouseOver={(e) => e.target.style.backgroundColor='#334155'} onMouseOut={(e) => e.target.style.backgroundColor='transparent'}>📂 Sınıf/Excel Yükle</Link>
            <Link to="/puanlama" style={menuStyle} onMouseOver={(e) => e.target.style.backgroundColor='#334155'} onMouseOut={(e) => e.target.style.backgroundColor='transparent'}>✍️ Not Girişi</Link>
            <Link to="/raporlar" style={menuStyle} onMouseOver={(e) => e.target.style.backgroundColor='#334155'} onMouseOut={(e) => e.target.style.backgroundColor='transparent'}>📊 Sınıf Raporları</Link>
          </nav>

          <button onClick={handleLogout} style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', padding: '10px', backgroundColor: '#ef4444', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🚪 Güvenli Çıkış</button>
        </div>

        {/* 🖼️ SAĞ İÇERİK ALANI */}
        <div style={{ marginLeft: '280px', flex: 1, padding: '40px' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', color: '#1e293b' }}>Hoş geldin, {teacherProfile?.name || "Yönetici"}</h1>
            <div style={{ backgroundColor: 'white', padding: '10px 20px', borderRadius: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              📧 {user.email}
            </div>
          </header>

          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <Routes>
              <Route path="/" element={<WelcomeMessage isAdmin={isAdmin} />} />
              <Route path="/admin" element={isAdmin ? <AdminPanel /> : <Navigate to="/" />} />
              <Route path="/sinif-ekle" element={<AddClass isAdmin={isAdmin} teacherProfile={teacherProfile} />} />
              <Route path="/puanlama" element={<GradingPanel isAdmin={isAdmin} teacherProfile={teacherProfile} />} />
              <Route path="/raporlar" element={<ReportPanel isAdmin={isAdmin} teacherProfile={teacherProfile} />} />
            </Routes>
          </div>
        </div>

      </div>
    </Router>
  );
}

// Basit bir karşılama bileşeni
function WelcomeMessage({ isAdmin }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h2>Öğrenci Kontrol Sistemine Hoş Geldiniz!</h2>
      <p style={{ color: '#64748b', marginTop: '10px' }}>Soldaki menüyü kullanarak işlemlerinizi gerçekleştirebilirsiniz.</p>
      {isAdmin && <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fef3c7', borderRadius: '8px', color: '#92400e' }}>⚠️ Yönetici modundasınız. Tüm yetkiler açık.</div>}
    </div>
  );
}

export default App;