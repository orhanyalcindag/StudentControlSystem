import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

function AdminPanel() {
  const [teachers, setTeachers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [assignedClasses, setAssignedClasses] = useState('');
  const [assignedSubjects, setAssignedSubjects] = useState('');
  const [status, setStatus] = useState('');

  // Veritabanından mevcut öğretmen yetkilerini çek
  const fetchTeachers = async () => {
    const querySnapshot = await getDocs(collection(db, "teachers"));
    const teacherList = [];
    querySnapshot.forEach((doc) => {
      teacherList.push({ id: doc.id, ...doc.data() });
    });
    setTeachers(teacherList);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Yeni öğretmen yetkisi ekle
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setStatus('Öğretmen ekleniyor...');
    
    try {
      await addDoc(collection(db, "teachers"), {
        name,
        email: email.toLowerCase().trim(),
        // Virgülle ayrılan sınıfları ve dersleri diziye (array) çeviriyoruz
        classes: assignedClasses.split(',').map(c => c.trim()),
        subjects: assignedSubjects.split(',').map(s => s.trim())
      });
      
      setStatus('Öğretmen başarıyla eklendi!');
      setName('');
      setEmail('');
      setAssignedClasses('');
      setAssignedSubjects('');
      fetchTeachers(); // Listeyi güncelle
    } catch (error) {
      console.error(error);
      setStatus('Hata oluştu!');
    }
  };

  const handleDeleteTeacher = async (id) => {
    if(window.confirm('Bu öğretmenin yetkilerini silmek istediğinize emin misiniz?')) {
      await deleteDoc(doc(db, "teachers", id));
      fetchTeachers();
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#fdf4ff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#a21caf', borderBottom: '2px solid #f0abfc', paddingBottom: '10px' }}>Yönetici (Admin) Paneli - Öğretmen Yetkilendirme</h2>
      
      <form onSubmit={handleAddTeacher} style={{ display: 'grid', gap: '15px', marginBottom: '30px', backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Öğretmen Adı Soyadı:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '8px' }} placeholder="Örn: Ahmet Yılmaz" />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>E-posta Adresi:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px' }} placeholder="Örn: ahmetyilmaz@okul.com" />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Gireceği Sınıflar (Virgülle ayırın):</label>
          <input type="text" value={assignedClasses} onChange={(e) => setAssignedClasses(e.target.value)} required style={{ width: '100%', padding: '8px' }} placeholder="Örn: 11-A, 10-B, 12-C" />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Vereceği Dersler (Virgülle ayırın):</label>
          <input type="text" value={assignedSubjects} onChange={(e) => setAssignedSubjects(e.target.value)} required style={{ width: '100%', padding: '8px' }} placeholder="Örn: Matematik, Geometri" />
        </div>
        <button type="submit" style={{ padding: '10px', backgroundColor: '#a21caf', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Öğretmeni Yetkilendir</button>
        {status && <p style={{ color: status.includes('başarıyla') ? 'green' : 'red', fontWeight: 'bold' }}>{status}</p>}
      </form>

      <h3 style={{ color: '#1f2937' }}>Sistemdeki Yetkili Öğretmenler</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
        <thead>
          <tr style={{ backgroundColor: '#e5e7eb', textAlign: 'left' }}>
            <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Ad Soyad</th>
            <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>E-posta</th>
            <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Sınıflar</th>
            <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Dersler</th>
            <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map(t => (
            <tr key={t.id}>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{t.name}</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{t.email}</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{t.classes.join(', ')}</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{t.subjects.join(', ')}</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                <button onClick={() => handleDeleteTeacher(t.id)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Sil</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPanel;