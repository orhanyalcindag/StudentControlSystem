import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db } from './firebase';

function ReportPanel({ isAdmin, teacherProfile }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);

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

    if (cls) {
      const q = query(collection(db, "students"), where("className", "==", cls));
      const querySnapshot = await getDocs(q);
      
      const studentList = [];
      const assignmentSet = new Set();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        studentList.push({ id: doc.id, ...data });
        
        if (data.grades) {
          data.grades.forEach(g => {
            // FİLTRELEME MANTIĞI: Admin her şeyi görür, Öğretmen sadece kendi girdiği uygulamaları görür
            if (isAdmin || g.teacherEmail === teacherProfile.email) {
              assignmentSet.add(g.assignmentName);
            }
          });
        }
      });

      studentList.sort((a, b) => String(a.studentNumber).localeCompare(String(b.studentNumber)));
      setStudents(studentList);
      setAssignments(Array.from(assignmentSet));
    } else {
      setStudents([]);
      setAssignments([]);
    }
  };

  const calculateAverage = (grades) => {
    if (!grades || grades.length === 0) return '-';
    let totalScore = 0;
    let validCount = 0;

    grades.forEach(g => {
      // Ortalamayı hesaplarken de sadece öğretmenin kendi derslerini hesaba katıyoruz
      if (isAdmin || g.teacherEmail === teacherProfile.email) {
        const score = g.score;
        if (score === 'G') {
          validCount++; 
        } else if (score !== 'R' && score !== 'İ' && score !== 'Not Seçin') {
          totalScore += parseInt(score);
          validCount++;
        }
      }
    });

    return validCount === 0 ? '-' : (totalScore / validCount).toFixed(2);
  };

  const getStudentScore = (studentGrades, assignmentName) => {
    if (!studentGrades) return '-';
    const grade = studentGrades.find(g => g.assignmentName === assignmentName);
    return grade ? grade.score : '-';
  };

  const exportToExcel = () => {
    const excelData = students.map(student => {
      const rowData = { "Okul No": student.studentNumber, "Ad Soyad": student.name };
      assignments.forEach(assign => {
        rowData[assign] = getStudentScore(student.grades, assign);
      });
      rowData["ORTALAMA"] = calculateAverage(student.grades);
      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Not_Raporu");
    XLSX.writeFile(workbook, `${selectedClass}_Not_Raporu.xlsx`);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #bbf7d0', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#166534', margin: 0 }}>Sınıf Raporu ve Not Ortalamaları</h2>
        {students.length > 0 && (
          <button onClick={exportToExcel} style={{ padding: '10px 15px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            📊 Excel Olarak İndir
          </button>
        )}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Raporunu Görmek İstediğiniz Sınıfı Seçin:</label>
        <select value={selectedClass} onChange={handleClassChange} style={{ width: '300px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
          <option value="">-- Sınıf Seç --</option>
          {classes.map(cls => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>

      {students.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
            <thead>
              <tr style={{ backgroundColor: '#22c55e', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '10px', border: '1px solid #16a34a' }}>Okul No</th>
                <th style={{ padding: '10px', border: '1px solid #16a34a' }}>Ad Soyad</th>
                {assignments.map(assign => (
                  <th key={assign} style={{ padding: '10px', border: '1px solid #16a34a' }}>{assign}</th>
                ))}
                <th style={{ padding: '10px', border: '1px solid #16a34a', backgroundColor: '#15803d' }}>ORTALAMA</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px', border: '1px solid #d1d5db', fontWeight: 'bold' }}>{student.studentNumber}</td>
                  <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{student.name}</td>
                  {assignments.map(assign => (
                    <td key={assign} style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                      {getStudentScore(student.grades, assign)}
                    </td>
                  ))}
                  <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold', color: '#b91c1c' }}>
                    {calculateAverage(student.grades)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ReportPanel;