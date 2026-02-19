import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

function GradingPanel({ isAdmin, teacherProfile }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assignmentName, setAssignmentName] = useState('');
  
  const [gradesInput, setGradesInput] = useState({});
  const [status, setStatus] = useState('');

  const gradeOptions = ['Not Seçin', '100', '90', '80', '70', '60', '50', '40', '30', '20', '10', '0', 'G', 'R', 'İ'];

  useEffect(() => {
    const fetchClasses = async () => {
      if (isAdmin) {
        const querySnapshot = await getDocs(collection(db, "students"));
        const classSet = new Set();
        querySnapshot.forEach((doc) => classSet.add(doc.data().className));
        setClasses(Array.from(classSet));
      } else if (teacherProfile && teacherProfile.classes) {
        setClasses(teacherProfile.classes);
      }
    };
    fetchClasses();
  }, [isAdmin, teacherProfile]);

  const handleClassChange = async (e) => {
    const cls = e.target.value;
    setSelectedClass(cls);
    setGradesInput({});
    setStatus('');

    if (cls) {
      const q = query(collection(db, "students"), where("className", "==", cls));
      const querySnapshot = await getDocs(q);
      const studentList = [];
      querySnapshot.forEach((doc) => studentList.push({ id: doc.id, ...doc.data() }));
      studentList.sort((a, b) => String(a.studentNumber).localeCompare(String(b.studentNumber)));
      setStudents(studentList);
    } else {
      setStudents([]);
    }
  };

  const handleGradeChange = (studentId, value) => {
    setGradesInput(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSaveGrades = async () => {
    if (!isAdmin && !selectedSubject) {
      alert("Lütfen önce listeden dersinizi seçin!");
      return;
    }
    if (!assignmentName) {
      alert("Lütfen uygulamanın/sınavın adını girin!");
      return;
    }

    // YENİ EKLENEN KONTROL: Öğretmen en az 1 kişiye not vermiş mi?
    let isAnyGradeGiven = false;
    for (const student of students) {
      const score = gradesInput[student.id];
      if (score && score !== 'Not Seçin') {
        isAnyGradeGiven = true;
        break;
      }
    }

    if (!isAnyGradeGiven) {
      alert("Lütfen kaydetmeden önce en az bir öğrenciye not verin! (Hiç not girilmeyen uygulamalar sisteme eklenmez)");
      return;
    }

    const finalAssignmentName = isAdmin ? assignmentName : `${selectedSubject} - ${assignmentName}`;

    setStatus('Notlar kaydediliyor...');
    try {
      for (const student of students) {
        const score = gradesInput[student.id];
        // Sadece "Not Seçin" haricinde geçerli bir not girilmişse veritabanına yaz
        if (score && score !== 'Not Seçin') {
          const studentRef = doc(db, "students", student.id);
          await updateDoc(studentRef, {
            grades: arrayUnion({
              assignmentName: finalAssignmentName,
              score: score,
              date: new Date().toISOString(),
              teacherEmail: isAdmin ? 'Admin' : teacherProfile.email
            })
          });
        }
      }
      setStatus('Notlar başarıyla kaydedildi!');
      
      // Kayıttan sonra giriş alanlarını temizle
      setGradesInput({});
      setAssignmentName('');
    } catch (error) {
      console.error("Not kaydetme hatası:", error);
      setStatus('Hata oluştu!');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>Uygulama Puanlama Paneli</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Sınıf Seçin:</label>
          <select value={selectedClass} onChange={handleClassChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">-- Sınıf Seç --</option>
            {classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Ders ve Uygulama Adı:</label>
          
          {!isAdmin && teacherProfile && teacherProfile.subjects && (
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)} 
              style={{ width: '100%', padding: '8px', borderRadius: '4px', marginBottom: '10px', border: '1px solid #ccc' }}
            >
              <option value="">-- Hangi Ders? --</option>
              {teacherProfile.subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          )}

          <input 
            type="text" 
            placeholder={isAdmin ? "Ders/Uygulama Adı (Örn: C# Form - 1)" : "Uygulama/Sınav Adı (Örn: 1. Dönem 1. Sınav)"} 
            value={assignmentName}
            onChange={(e) => setAssignmentName(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
      </div>

      {students.length > 0 && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
            <thead>
              <tr style={{ backgroundColor: '#e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Okul No</th>
                <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Ad Soyad</th>
                <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Puan</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{student.studentNumber}</td>
                  <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{student.name}</td>
                  <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>
                    <select value={gradesInput[student.id] || ''} onChange={(e) => handleGradeChange(student.id, e.target.value)} style={{ padding: '6px', width: '100%', cursor: 'pointer' }}>
                      {gradeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleSaveGrades} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Notları Kaydet</button>
        </>
      )}

      {status && <p style={{ marginTop: '15px', fontWeight: 'bold', color: status.includes('başarıyla') ? 'green' : 'red' }}>{status}</p>}
    </div>
  );
}

export default GradingPanel;