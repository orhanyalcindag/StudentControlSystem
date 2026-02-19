import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

// App.jsx'ten gönderdiğimiz yetki props'larını alıyoruz
function AddClass({ isAdmin, teacherProfile }) {
  const [className, setClassName] = useState('');
  const [status, setStatus] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!className) {
      alert("Lütfen önce sınıfı seçin veya yazın!");
      return;
    }

    setStatus("Excel okunuyor...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const students = XLSX.utils.sheet_to_json(worksheet);
      
      setStatus("Veritabanına kaydediliyor...");

      try {
        for (const student of students) {
          await addDoc(collection(db, "students"), {
            studentNumber: student["Okul No"] || student["No"] || student["OkulNo"], 
            name: student["Ad Soyad"] || student["Adı Soyadı"] || student["Isim"],
            className: className,
            grades: [] 
          });
        }
        setStatus(`Başarılı! ${className} sınıfından ${students.length} öğrenci eklendi.`);
      } catch (error) {
        console.error("Hata:", error);
        setStatus("Kayıt sırasında hata oluştu.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>Sınıf ve Öğrenci Ekle (Excel)</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px', marginTop: '15px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Sınıf Adı:</label>
          
          {/* Adminse serbestçe yazabilir, Öğretmense sadece atanan sınıflarından birini seçebilir */}
          {isAdmin ? (
            <input 
              type="text" 
              placeholder="Örn: 11-A Bilişim" 
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          ) : (
            <select 
              value={className} 
              onChange={(e) => setClassName(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">-- Yetkili Olduğunuz Sınıfı Seçin --</option>
              {teacherProfile?.classes?.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Öğrenci Listesi (Excel):</label>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
          <small style={{ display: 'block', marginTop: '5px', color: 'gray' }}>
            * Excel'de "Okul No" ve "Ad Soyad" adında iki sütun olmalıdır.
          </small>
        </div>
      </div>

      {status && <p style={{ fontWeight: 'bold', color: status.includes('Başarılı') ? 'green' : 'red' }}>{status}</p>}
    </div>
  );
}

export default AddClass;