import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Save, Download, FileText, Plus, Trash2, GraduationCap, Briefcase, Award, FolderGit, Languages, User, Globe, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playClickSound, playAdvancementSound } from '../utils/sound';

interface CVEducation {
  university: string;
  degree: string;
  major: string;
  gpa: string;
  startDate: string;
  endDate: string;
  achievements: string;
}

interface CVWorkExperience {
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface CVProject {
  name: string;
  role: string;
  link: string;
  description: string;
  technologies: string;
}

interface CVSkill {
  category: string;
  items: string;
}

interface CVCertification {
  name: string;
  authority: string;
  issueDate: string;
}

interface CVLanguage {
  name: string;
  proficiency: string;
}

export default function CVBuilder() {
  const { authorizedFetch, profile, updateProfile, rewardPoints } = useAuth();

  // Loaders and messages
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // PERSONAL INFORMATION STATES
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    personalWebsite: '',
    summary: '',
    linkedin: '',
    github: ''
  });

  // EDUCATION LIST STATE
  const [educationList, setEducationList] = useState<CVEducation[]>([]);
  // WORK EXPERIENCE LIST STATE
  const [workList, setWorkList] = useState<CVWorkExperience[]>([]);
  // PROJECTS LIST STATE
  const [projectList, setProjectList] = useState<CVProject[]>([]);
  // SKILLS LIST STATE
  const [skillList, setSkillList] = useState<CVSkill[]>([]);
  // CERTIFICATIONS LIST STATE
  const [certificationList, setCertificationList] = useState<CVCertification[]>([]);
  // LANGUAGES LIST STATE
  const [languageList, setLanguageList] = useState<CVLanguage[]>([]);

  // NEW ITEM INPUT FORM STATES (TEMP)
  const [newEdu, setNewEdu] = useState<CVEducation>({
    university: '', degree: 'Master\'s Degree', major: '', gpa: '', startDate: '', endDate: '', achievements: ''
  });
  const [newWork, setNewWork] = useState<CVWorkExperience>({
    company: '', role: '', location: '', startDate: '', endDate: '', description: ''
  });
  const [newProj, setNewProj] = useState<CVProject>({
    name: '', role: '', link: '', description: '', technologies: ''
  });
  const [newSkill, setNewSkill] = useState<CVSkill>({
    category: '', items: ''
  });
  const [newCert, setNewCert] = useState<CVCertification>({
    name: '', authority: '', issueDate: ''
  });
  const [newLanguage, setNewLanguage] = useState<CVLanguage>({
    name: '', proficiency: 'Professional Working Proficiency'
  });

  // FETCH CV DATA FROM PROFILE DIRECTORY
  useEffect(() => {
    async function loadAllCVData() {
      try {
        setLoading(true);
        // Hydrate Personal Info from Profile Context first
        if (profile) {
          setPersonalInfo(prev => ({
            ...prev,
            fullName: profile.fullName || '',
            location: profile.nationality || '',
          }));

          // Basic education from profile
          if (profile.collegeName || profile.primaryMajor) {
            setEducationList([{
              university: profile.collegeName || 'Selected Academy',
              degree: profile.intendedDegree || 'Master\'s Degree',
              major: profile.primaryMajor || profile.intendedMajor || '',
              gpa: profile.gpa ? profile.gpa.toString() : '4.00',
              startDate: '2021',
              endDate: profile.graduationYear ? profile.graduationYear.toString() : '2025',
              achievements: 'Extracurricular high merits'
            }]);
          }
        }

        // Fetch remaining work lists from /api/profile/cv
        const res = await authorizedFetch('/api/profile/cv');
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (data.workExperience && data.workExperience.length > 0) {
              // Convert formats safely
              setWorkList(data.workExperience.map((exp: any) => ({
                company: exp.company || '',
                role: exp.jobTitle || exp.role || '',
                location: exp.location || '',
                startDate: exp.dates?.split(' - ')[0] || '',
                endDate: exp.dates?.split(' - ')[1] || '',
                description: exp.description || ''
              })));
            }

            if (data.projects && data.projects.length > 0) {
              setProjectList(data.projects.map((proj: any) => ({
                name: proj.name || '',
                role: proj.role || 'Lead Architect',
                link: proj.link || '',
                description: proj.description || '',
                technologies: proj.technologies || ''
              })));
            }

            if (data.skills && data.skills.length > 0) {
              setSkillList(data.skills.map((s: any) => {
                if (typeof s === 'string') {
                  return { category: 'Core Expertise', items: s };
                }
                return { category: s.category || 'Expertise', items: s.items || s.join?.(', ') || '' };
              }));
            }

            if (data.certifications && data.certifications.length > 0) {
              setCertificationList(data.certifications.map((cert: any) => ({
                name: typeof cert === 'string' ? cert : cert.name || '',
                authority: cert.authority || 'Academic Board',
                issueDate: cert.issueDate || '2024'
              })));
            }

            if (data.extracurriculars && data.extracurriculars.length > 0) {
              setLanguageList(data.extracurriculars.map((lang: any) => ({
                name: typeof lang === 'string' ? lang : lang.name || '',
                proficiency: lang.proficiency || 'Full Professional'
              })));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load CV Data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAllCVData();
  }, [profile]);

  // ACTION LIST ITEM ADDS & REMOVES
  const addEducation = () => {
    if (!newEdu.university || !newEdu.major) return;
    playClickSound();
    setEducationList([...educationList, newEdu]);
    setNewEdu({ university: '', degree: 'Master\'s Degree', major: '', gpa: '', startDate: '', endDate: '', achievements: '' });
  };

  const removeEducation = (index: number) => {
    playClickSound();
    setEducationList(educationList.filter((_, idx) => idx !== index));
  };

  const addWork = () => {
    if (!newWork.company || !newWork.role) return;
    playClickSound();
    setWorkList([...workList, newWork]);
    setNewWork({ company: '', role: '', location: '', startDate: '', endDate: '', description: '' });
  };

  const removeWork = (index: number) => {
    playClickSound();
    setWorkList(workList.filter((_, idx) => idx !== index));
  };

  const addProject = () => {
    if (!newProj.name || !newProj.description) return;
    playClickSound();
    setProjectList([...projectList, newProj]);
    setNewProj({ name: '', role: '', link: '', description: '', technologies: '' });
  };

  const removeProject = (index: number) => {
    playClickSound();
    setProjectList(projectList.filter((_, idx) => idx !== index));
  };

  const addSkill = () => {
    if (!newSkill.category || !newSkill.items) return;
    playClickSound();
    setSkillList([...skillList, newSkill]);
    setNewSkill({ category: '', items: '' });
  };

  const removeSkill = (index: number) => {
    playClickSound();
    setSkillList(skillList.filter((_, idx) => idx !== index));
  };

  const addCert = () => {
    if (!newCert.name || !newCert.authority) return;
    playClickSound();
    setCertificationList([...certificationList, newCert]);
    setNewCert({ name: '', authority: '', issueDate: '' });
  };

  const removeCert = (index: number) => {
    playClickSound();
    setCertificationList(certificationList.filter((_, idx) => idx !== index));
  };

  const addLanguage = () => {
    if (!newLanguage.name) return;
    playClickSound();
    setLanguageList([...languageList, newLanguage]);
    setNewLanguage({ name: '', proficiency: 'Professional Working Proficiency' });
  };

  const removeLanguage = (index: number) => {
    playClickSound();
    setLanguageList(languageList.filter((_, idx) => idx !== index));
  };

  // SAVE CV TO BOTH SQLITE AND CONTEXT PROFILE
  const handleSaveCV = async () => {
    playClickSound();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      // 1. Save standard CV Lists to the /api/profile/cv endpoint
      const cvPayload = {
        workExperience: workList.map(w => ({
          jobTitle: w.role,
          company: w.company,
          location: w.location,
          dates: `${w.startDate} - ${w.endDate}`,
          description: w.description
        })),
        internships: [],
        projects: projectList.map(p => ({
          name: p.name,
          role: p.role,
          link: p.link,
          description: p.description,
          technologies: p.technologies
        })),
        skills: skillList,
        certifications: certificationList,
        extracurriculars: languageList
      };

      const cvRes = await authorizedFetch('/api/profile/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cvPayload)
      });

      // 2. Sync fundamental Profile details if edited
      if (personalInfo.fullName) {
        await updateProfile({
          fullName: personalInfo.fullName,
          nationality: personalInfo.location
        });
      }

      if (cvRes.ok) {
        setSuccess('🏆 Adventurer CV blueprint has been securely logged into the SQLite vaults!');
        playAdvancementSound();
        await rewardPoints(20, 'CV Blueprint Complete', 'CV Craftsman');
      } else {
        throw new Error('Database rejection: Secure connection interrupted.');
      }
    } catch (err: any) {
      setError(err.message || 'Anomaly writing to secondary SQLite node.');
    } finally {
      setSaving(false);
    }
  };

  // EXPORT OUT COMPRESSED PDF USING JSPDF
  const handleDownloadPDF = () => {
    playClickSound();
    try {
      const doc = new jsPDF();
      let y = 20;

      // Header Banner Panel
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(33, 150, 243); // Vivid Slate Blue Theme Accent
      doc.text(personalInfo.fullName || profile?.fullName || 'Academic Candidate', 20, y);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      y += 6;
      
      const contactInfo = [
        personalInfo.email && `Email: ${personalInfo.email}`,
        personalInfo.phone && `Phone: ${personalInfo.phone}`,
        personalInfo.location && `Location: ${personalInfo.location}`,
        personalInfo.personalWebsite && `Portfolio: ${personalInfo.personalWebsite}`
      ].filter(Boolean).join('  |  ');
      
      doc.text(contactInfo, 20, y);
      y += 10;

      // Brief summary sentence
      if (personalInfo.summary) {
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        const splitText = doc.splitTextToSize(personalInfo.summary, 170);
        doc.text(splitText, 20, y);
        y += splitText.length * 5 + 4;
      }

      // Decorative divider
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(20, y, 190, y);
      y += 8;

      // Section: EDUCATION
      if (educationList.length > 0) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(33, 150, 243);
        doc.text('🎓 ACADEMIC EDUCATION', 20, y);
        y += 6;

        educationList.forEach((edu) => {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(30, 30, 30);
          doc.text(`${edu.degree} in ${edu.major}`, 20, y);
          
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(`${edu.startDate} - ${edu.endDate}`, 150, y);
          y += 5;

          doc.text(`${edu.university}  (GPA: ${edu.gpa})`, 20, y);
          y += 4;

          if (edu.achievements) {
            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(80, 80, 80);
            doc.text(`• Achievements: ${edu.achievements}`, 24, y);
            y += 5;
          }
          y += 2;
        });
        y += 4;
      }

      // Section: WORK EXPERIENCE
      if (workList.length > 0) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(33, 150, 243);
        doc.text('💼 RELEVANT EXPERIENCE', 20, y);
        y += 6;

        workList.forEach((w) => {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(30, 30, 30);
          doc.text(`${w.role} at ${w.company}`, 20, y);

          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(`${w.startDate} - ${w.endDate}`, 150, y);
          y += 5;

          if (w.location) {
            doc.text(w.location, 20, y);
            y += 4;
          }

          if (w.description) {
            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(80, 80, 80);
            const descLines = doc.splitTextToSize(w.description, 160);
            doc.text(descLines, 20, y);
            y += descLines.length * 5;
          }
          y += 4;
        });
        y += 4;
      }

      // Section: PROJECTS
      if (projectList.length > 0) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(33, 150, 243);
        doc.text('📦 COMPLETED PROJECT DEPLOYS', 20, y);
        y += 6;

        projectList.forEach((p) => {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(30, 30, 30);
          doc.text(p.name, 20, y);
          y += 4;

          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(110, 110, 110);
          doc.text(`Role: ${p.role} | Tech: ${p.technologies}`, 20, y);
          y += 5;

          if (p.description) {
            doc.setTextColor(80, 80, 80);
            const descLines = doc.splitTextToSize(p.description, 160);
            doc.text(descLines, 20, y);
            y += descLines.length * 5;
          }
          y += 3;
        });
        y += 4;
      }

      // Section: SKILLS
      if (skillList.length > 0) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(33, 150, 243);
        doc.text('⚡ DEVELOPER SKILL SHARDS', 20, y);
        y += 6;

        skillList.forEach((s) => {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(30, 30, 30);
          doc.text(`${s.category}: `, 20, y);

          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(80, 80, 80);
          doc.text(s.items, doc.getTextWidth(`${s.category}: `) + 22, y);
          y += 6;
        });
        y += 4;
      }

      // Section: CERTIFICATIONS & LANGUAGES
      if (certificationList.length > 0 || languageList.length > 0) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(33, 150, 243);
        doc.text('🏅 CERTIFICATIONS & LANGUAGES', 20, y);
        y += 6;

        certificationList.forEach((c) => {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(50, 50, 50);
          doc.text(`• Certification: ${c.name}`, 20, y);
          doc.setFont('Helvetica', 'normal');
          doc.text(`(${c.authority}, ${c.issueDate})`, doc.getTextWidth(`• Certification: ${c.name}`) + 22, y);
          y += 5;
        });

        languageList.forEach((l) => {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(50, 50, 50);
          doc.text(`• Language: ${l.name}`, 20, y);
          doc.setFont('Helvetica', 'normal');
          doc.text(`(${l.proficiency})`, doc.getTextWidth(`• Language: ${l.name}`) + 22, y);
          y += 5;
        });
      }

      // Save document out
      doc.save(`ScholarPath_CV_${personalInfo.fullName.replace(/\s+/g, '_') || 'adventurer'}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Error building local PDF blueprint.');
    }
  };

  return (
    <div className="space-y-6" id="scholarpath-cv-builder-panel">
      
      {/* Title Window Header */}
      <div className="mc-window border-4 border-black p-5 text-stone-800">
        <h3 className="font-press text-xs text-stone-900 uppercase flex items-center gap-2">
          <FileText className="w-5 h-5 text-stone-900 shrink-0" /> HERO PORTFOLIO CV WORKBENCH
        </h3>
        <p className="text-xs text-stone-700 font-sans mt-2 leading-relaxed">
          Compile your official scholarship profile credentials. Edit educational standards, project milestones, language masteries and download an admissions-compliant formatted PDF!
        </p>
      </div>

      {success && (
        <div className="bg-emerald-950 border-4 border-[#55ff55] text-[#55ff55] p-3 text-xs font-mono rounded-none flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#55ff55] shrink-0" />
          <span className="mc-text-shadow font-bold">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-950 border-4 border-[#ff5555] text-[#ff5555] p-3 text-xs font-mono rounded-none">
          <span className="font-bold">⚠️ REDSTONE FAULT: {error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 font-press text-[11px] text-[#ffff55] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#ffff55]" />
          <span className="mc-text-shadow">SYNCHRONIZING SCHOLAR ARCHIVES...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main CV Sections inputs */}
          <div className="lg:col-span-8 space-y-6 bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] text-stone-200">
            
            {/* Section 1: Personal Info */}
            <div className="space-y-4">
              <h4 className="font-press text-[9px] text-[#ffff55] mc-text-shadow uppercase pb-2 border-b-2 border-black flex items-center gap-2">
                <User className="w-4.5 h-4.5" /> PERSONAL INFORMATION ID
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-300 uppercase text-[9px] font-bold">FULL PLAYER NAME</span>
                  <input
                    type="text"
                    value={personalInfo.fullName}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                    placeholder="e.g. Arif Rahaman"
                    className="bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55]"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-300 uppercase text-[9px] font-bold">EMAIL ADDRESS</span>
                  <input
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                    placeholder="e.g. arif@gmail.com"
                    className="bg-[#141414] border-2 border-black p-2 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-300 uppercase text-[9px] font-bold">CONTACT PHONE</span>
                  <input
                    type="text"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                    placeholder="e.g. +880 17123456"
                    className="bg-[#141414] border-2 border-black p-2 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-300 uppercase text-[9px] font-bold">GEOGRAPHIC REGION</span>
                  <input
                    type="text"
                    value={personalInfo.location}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                    placeholder="e.g. Bangladesh"
                    className="bg-[#141414] border-2 border-black p-2 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-300 uppercase text-[9px] font-bold">WEBSITE PORTFOLIO</span>
                  <input
                    type="text"
                    value={personalInfo.personalWebsite}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, personalWebsite: e.target.value })}
                    placeholder="e.g. https://scholar.io"
                    className="bg-[#141414] border-2 border-black p-2 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-300 uppercase text-[9px] font-bold">LINKEDIN URL</span>
                  <input
                    type="text"
                    value={personalInfo.linkedin}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                    placeholder="e.g. linkedin.com/in/scholar"
                    className="bg-[#141414] border-2 border-black p-2 outline-none font-sans"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 font-mono text-xs">
                <span className="text-stone-300 uppercase text-[9px] font-bold">ACADEMIC SUMMARY</span>
                <textarea
                  value={personalInfo.summary}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, summary: e.target.value })}
                  placeholder="Summarize your admissions objectives, specialization tracks, and ECTS accomplishments..."
                  className="bg-[#141414] border-2 border-black p-3 outline-none focus:border-[#ffff55] font-sans min-h-[80px]"
                />
              </div>
            </div>

            {/* Section 2: Education */}
            <div className="space-y-4 pt-5 border-t-2 border-black">
              <h4 className="font-press text-[9px] text-[#ffff55] mc-text-shadow uppercase pb-2 border-b-2 border-black flex items-center gap-2">
                <GraduationCap className="w-4.5 h-4.5" /> ACADEMIC EDUCATION HISTORIES
              </h4>

              {/* Saved list */}
              {educationList.length > 0 && (
                <div className="space-y-2 bg-[#1a1a1a] p-3 border-2 border-black divider-y divider-stone-700">
                  {educationList.map((edu, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs font-mono py-1">
                      <div>
                        <span className="font-bold text-[#ffff55]">{edu.degree} in {edu.major}</span>
                        <div className="text-stone-400">{edu.university} • GPA: {edu.gpa} ({edu.startDate} - {edu.endDate})</div>
                        {edu.achievements && <div className="text-[10px] text-stone-500 italic">★ {edu.achievements}</div>}
                      </div>
                      <button onClick={() => removeEducation(idx)} className="text-red-400 hover:text-red-300 p-0.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New item form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs p-4 bg-black/30 border border-stone-800">
                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 text-[10px] uppercase">UNIVERSITY</span>
                  <input
                    type="text"
                    value={newEdu.university}
                    onChange={(e) => setNewEdu({ ...newEdu, university: e.target.value })}
                    placeholder="e.g. Stanford University"
                    className="bg-[#141414] border-2 border-black p-1.5 text-[#e5e5e5]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 text-[10px] uppercase">DEGREE CLASS</span>
                  <select
                    value={newEdu.degree}
                    onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                    className="bg-[#141414] border-2 border-black p-1.5 select-none"
                  >
                    <option>Bachelor's Degree</option>
                    <option>Master's Degree</option>
                    <option>Ph.D.</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 text-[10px] uppercase">MAJOR DISCIPLINE</span>
                  <input
                    type="text"
                    value={newEdu.major}
                    onChange={(e) => setNewEdu({ ...newEdu, major: e.target.value })}
                    placeholder="e.g. Computer Science"
                    className="bg-[#141414] border-2 border-black p-1.5 text-stone-300"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 text-[10px] uppercase">GPA STANDING</span>
                  <input
                    type="text"
                    value={newEdu.gpa}
                    onChange={(e) => setNewEdu({ ...newEdu, gpa: e.target.value })}
                    placeholder="e.g. 3.92 / 4.00"
                    className="bg-[#141414] border-2 border-black p-1.5 text-stone-300"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 text-[10px] uppercase">START / END DATE</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newEdu.startDate}
                      onChange={(e) => setNewEdu({ ...newEdu, startDate: e.target.value })}
                      placeholder="e.g. 2021"
                      className="w-1/2 bg-[#141414] border-2 border-black p-1.5 text-stone-300"
                    />
                    <input
                      type="text"
                      value={newEdu.endDate}
                      onChange={(e) => setNewEdu({ ...newEdu, endDate: e.target.value })}
                      placeholder="e.g. 2025"
                      className="w-1/2 bg-[#141414] border-2 border-black p-1.5 text-stone-400"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 col-span-1">
                  <span className="text-stone-400 text-[10px] uppercase">Achievements / Honours</span>
                  <input
                    type="text"
                    value={newEdu.achievements}
                    onChange={(e) => setNewEdu({ ...newEdu, achievements: e.target.value })}
                    placeholder="e.g. Graduated Summa Cum Laude"
                    className="w-full bg-[#141414] border-2 border-black p-1.5 text-stone-450"
                  />
                </div>
                <div className="col-span-2 flex justify-end pb-1 pt-1.5">
                  <button
                    type="button"
                    onClick={addEducation}
                    className="mc-btn px-4 py-1.5 font-press text-[8px] uppercase text-[#ffff55] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-[#ffff55]" /> ADD EDUCATION
                  </button>
                </div>
              </div>
            </div>

            {/* Section 3: Work Experience */}
            <div className="space-y-4 pt-5 border-t-2 border-black">
              <h4 className="font-press text-[9px] text-[#ffff55] mc-text-shadow uppercase pb-2 border-b-2 border-black flex items-center gap-2">
                <Briefcase className="w-4.5 h-4.5" /> RELEVANT WORK EXPERIENCES
              </h4>

              {workList.map((work, idx) => (
                <div key={idx} className="bg-[#1a1a1a] border-2 border-black p-3 text-xs font-mono relative flex justify-between">
                  <div>
                    <span className="font-bold text-[#ffff55]">{work.role} at {work.company}</span>
                    <div className="text-stone-400">{work.location && `${work.location} • `}{work.startDate} - {work.endDate}</div>
                    {work.description && <p className="text-[11px] text-stone-300 font-sans mt-2">{work.description}</p>}
                  </div>
                  <button onClick={() => removeWork(idx)} className="text-red-400 absolute right-3 top-3 select-none hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs p-4 bg-black/30 border border-stone-800">
                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 text-[10px] uppercase">COMPANY / INSTITUTION</span>
                  <input
                    type="text"
                    value={newWork.company}
                    onChange={(e) => setNewWork({ ...newWork, company: e.target.value })}
                    placeholder="e.g. Google Research"
                    className="bg-[#141414] border-2 border-black p-1.5 text-stone-300"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 text-[10px] uppercase">ROLE / ROLE CLASS</span>
                  <input
                    type="text"
                    value={newWork.role}
                    onChange={(e) => setNewWork({ ...newWork, role: e.target.value })}
                    placeholder="e.g. Deep Learning Intern"
                    className="bg-[#141414] border-2 border-black p-1.5 text-stone-300"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 text-[10px] uppercase">LOCATION</span>
                  <input
                    type="text"
                    value={newWork.location}
                    onChange={(e) => setNewWork({ ...newWork, location: e.target.value })}
                    placeholder="e.g. Zurich, Switzerland"
                    className="bg-[#141414] border-2 border-black p-1.5 text-stone-300"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 text-[10px] uppercase">START / END DATE</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="w-1/2 bg-[#141414] border-2 border-black p-1.5 text-stone-300"
                      value={newWork.startDate}
                      onChange={(e) => setNewWork({ ...newWork, startDate: e.target.value })}
                      placeholder="e.g. Jun 2023"
                    />
                    <input
                      type="text"
                      className="w-1/2 bg-[#141414] border-2 border-black p-1.5 text-stone-400"
                      value={newWork.endDate}
                      onChange={(e) => setNewWork({ ...newWork, endDate: e.target.value })}
                      placeholder="e.g. Sep 2023"
                    />
                  </div>
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <span className="text-stone-400 text-[10px] uppercase">DESCRIPTION</span>
                  <textarea
                    rows={2}
                    value={newWork.description}
                    onChange={(e) => setNewWork({ ...newWork, description: e.target.value })}
                    placeholder="Describe your highly rigorous duties, ECTS tasks, code modules..."
                    className="bg-[#141414] border-2 border-black p-2 font-sans text-xs focus:outline-none focus:border-[#ffff55]"
                  />
                </div>
                <div className="col-span-2 flex justify-end pb-1 pt-1.5">
                  <button
                    type="button"
                    onClick={addWork}
                    className="mc-btn px-4 py-1.5 font-press text-[8px] uppercase text-[#ffff55] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-[#ffff55]" /> ADD WORK SLOT
                  </button>
                </div>
              </div>
            </div>

            {/* Section 4: Projects */}
            <div className="space-y-4 pt-5 border-t-2 border-black">
              <h4 className="font-press text-[9px] text-[#ffff55] mc-text-shadow uppercase pb-2 border-b-2 border-black flex items-center gap-2">
                <FolderGit className="w-4.5 h-4.5" /> SCHOLARLY / RESEARCH PROJECTS
              </h4>

              {projectList.map((p, idx) => (
                <div key={idx} className="bg-[#1a1a1a] border-2 border-black p-3 text-xs font-mono relative flex justify-between">
                  <div>
                    <span className="font-bold text-[#ffff55]">{p.name} {p.role && `(${p.role})`}</span>
                    {p.link && <div className="text-[#3b82f6] truncate text-[10px]">{p.link}</div>}
                    <div className="text-[10px] text-stone-400 mt-1">Tech: {p.technologies}</div>
                    <p className="text-[11px] text-stone-300 font-sans mt-2">{p.description}</p>
                  </div>
                  <button onClick={() => removeProject(idx)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs p-4 bg-black/30 border border-stone-800">
                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 text-[10px] uppercase">PROJECT NAME</span>
                  <input
                    type="text"
                    value={newProj.name}
                    onChange={(e) => setNewProj({ ...newProj, name: e.target.value })}
                    placeholder="e.g. Automated Operating System Compiler"
                    className="bg-[#141414] border-2 border-black p-1.5 text-stone-300"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 text-[10px] uppercase">DEVELOPMENT ROLE</span>
                  <input
                    type="text"
                    value={newProj.role}
                    onChange={(e) => setNewProj({ ...newProj, role: e.target.value })}
                    placeholder="e.g. Lead Dev Scientist"
                    className="bg-[#141414] border-2 border-black p-1.5 text-stone-300"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 text-[10px] uppercase">LINK / GITHUB</span>
                  <input
                    type="text"
                    value={newProj.link}
                    onChange={(e) => setNewProj({ ...newProj, link: e.target.value })}
                    placeholder="e.g. github.com/user/compiler"
                    className="bg-[#141414] border-2 border-black p-1.5 text-stone-300 font-sans"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 text-[10px] uppercase">TECHNOLOGIES</span>
                  <input
                    type="text"
                    value={newProj.technologies}
                    onChange={(e) => setNewProj({ ...newProj, technologies: e.target.value })}
                    placeholder="e.g. Rust, LLVM, WebAssembly"
                    className="bg-[#141414] border-2 border-black p-1.5 text-stone-300"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <span className="text-stone-400 text-[10px] uppercase">DESCRIPTION</span>
                  <textarea
                    rows={2}
                    value={newProj.description}
                    onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
                    placeholder="Describe how this project exhibits research capacity..."
                    className="bg-[#141414] border-2 border-black p-2 font-sans text-xs focus:outline-none focus:border-[#ffff55]"
                  />
                </div>
                <div className="col-span-2 flex justify-end pb-1 pt-1.5">
                  <button
                    type="button"
                    onClick={addProject}
                    className="mc-btn px-4 py-1.5 font-press text-[8px] uppercase text-[#ffff55] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-[#ffff55]" /> ADD PROJECT
                  </button>
                </div>
              </div>
            </div>

            {/* Section 5: Skills */}
            <div className="space-y-4 pt-5 border-t-2 border-black">
              <h4 className="font-press text-[9px] text-[#ffff55] mc-text-shadow uppercase pb-2 border-b-2 border-black flex items-center gap-2">
                <Award className="w-4.5 h-4.5" /> DEVELOPER SKILL SHARDS
              </h4>

              {skillList.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {skillList.map((skill, idx) => (
                    <div key={idx} className="bg-black/40 border border-stone-850 p-2.5 flex justify-between items-center text-xs font-mono leading-tight">
                      <div>
                        <span className="font-bold text-[#ffaa00] text-[10px] uppercase block">{skill.category}</span>
                        <span className="text-stone-300 block mt-1">{skill.items}</span>
                      </div>
                      <button onClick={() => removeSkill(idx)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 font-mono text-xs p-4 bg-black/30 border border-stone-800">
                <input
                  type="text"
                  placeholder="Category: e.g. Languages"
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                  className="flex-1 bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55] text-stone-200"
                />
                <input
                  type="text"
                  placeholder="Items: e.g. Python, C++, TypeScript"
                  value={newSkill.items}
                  onChange={(e) => setNewSkill({ ...newSkill, items: e.target.value })}
                  className="flex-[2] bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55] text-stone-200"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="mc-btn py-2 px-4 text-[8px] font-press tracking-wide uppercase text-[#ffff55]"
                >
                  LINK
                </button>
              </div>
            </div>

            {/* Section 6: Certifications */}
            <div className="space-y-4 pt-5 border-t-2 border-black">
              <h4 className="font-press text-[9px] text-[#ffff55] mc-text-shadow uppercase pb-2 border-b-2 border-black flex items-center gap-2">
                🏆 CERTIFICATIONS & ACHIEVEMENTS
              </h4>

              {certificationList.length > 0 && (
                <div className="space-y-2">
                  {certificationList.map((cert, idx) => (
                    <div key={idx} className="bg-stone-900 border border-stone-800 p-2.5 flex justify-between items-center text-xs font-mono">
                      <div>
                        <span className="font-bold text-[#ffff55]">{cert.name}</span>
                        <span className="text-stone-400 block text-[10px]">{cert.authority} • {cert.issueDate}</span>
                      </div>
                      <button onClick={() => removeCert(idx)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 font-mono text-xs p-4 bg-black/30 border border-stone-800">
                <input
                  type="text"
                  placeholder="Certification Name"
                  value={newCert.name}
                  onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                  className="bg-[#141414] border-2 border-black p-2 text-stone-300"
                />
                <input
                  type="text"
                  placeholder="Issuing Authority"
                  value={newCert.authority}
                  onChange={(e) => setNewCert({ ...newCert, authority: e.target.value })}
                  className="bg-[#141414] border-2 border-black p-2 text-stone-300"
                />
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Year: 2024"
                    value={newCert.issueDate}
                    onChange={(e) => setNewCert({ ...newCert, issueDate: e.target.value })}
                    className="w-1/2 bg-[#141414] border-2 border-black p-2 text-stone-400"
                  />
                  <button
                    type="button"
                    onClick={addCert}
                    className="w-1/2 mc-btn text-[8px] font-press uppercase text-[#ffff55]"
                    id="add-education-btn"
                  >
                    ADD
                  </button>
                </div>
              </div>
            </div>

            {/* Section 7: Languages */}
            <div className="space-y-4 pt-5 border-t-2 border-black">
              <h4 className="font-press text-[9px] text-[#ffff55] mc-text-shadow uppercase pb-2 border-b-2 border-black flex items-center gap-2">
                <Languages className="w-4.5 h-4.5" /> LANGUAGE PROFICIENCIES
              </h4>

              {languageList.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {languageList.map((lang, idx) => (
                    <div key={idx} className="bg-stone-900 border border-stone-800 p-2.5 flex justify-between items-center text-xs font-mono">
                      <div>
                        <span className="font-bold text-[#55ffff]">{lang.name}</span>
                        <span className="text-stone-400 block text-[10px] italic">{lang.proficiency}</span>
                      </div>
                      <button onClick={() => removeLanguage(idx)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs p-4 bg-black/30 border border-stone-800">
                <input
                  type="text"
                  placeholder="e.g. German or English"
                  value={newLanguage.name}
                  onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                  className="bg-[#141414] border-2 border-black p-2 text-stone-300"
                />
                <select
                  value={newLanguage.proficiency}
                  onChange={(e) => setNewLanguage({ ...newLanguage, proficiency: e.target.value })}
                  className="bg-[#141414] border-2 border-black p-2 select-none"
                >
                  <option>Elementary Proficiency</option>
                  <option>Limited Working Proficiency</option>
                  <option>Professional Working Proficiency</option>
                  <option>Full Professional Proficiency</option>
                  <option>Native or Bilingual Proficiency</option>
                </select>
                <button
                  type="button"
                  onClick={addLanguage}
                  className="mc-btn font-press text-[8px] uppercase text-[#ffff55]"
                >
                  LINK LANGUAGE
                </button>
              </div>
            </div>

          </div>

          {/* Right Action panel */}
          <div className="lg:col-span-4 bg-[#211612] border-4 border-[#4d3224] p-5 shadow-inner text-stone-300 space-y-5">
            <h4 className="font-press text-[10px] text-[#ffaa00] mc-text-shadow uppercase pb-2 border-b-2 border-[#4d3224]">COMMAND CENTER</h4>
            
            <p className="text-xs font-mono leading-relaxed">
              Before compiling your blueprint, ensure you commit the credentials back to the persistent SQLite ledger matrix.
            </p>

            <button
              onClick={handleSaveCV}
              disabled={saving}
              className="w-full mc-btn py-3 px-4 text-[10px] text-[#ffff55] uppercase flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <Save className="w-4.5 h-4.5 text-[#ffff55]" />
              )}
              SAVE CV MATRIX DATABASE
            </button>

            <button
              onClick={handleDownloadPDF}
              className="w-full mc-btn py-3 px-4 text-[10px] text-[#55ff55] uppercase flex items-center justify-center gap-2 bg-stone-750"
            >
              <Download className="w-4.5 h-4.5 text-[#55ff55]" />
              COMPILE ACADEMIC PDF
            </button>

            <div className="bg-black/45 border border-stone-850 p-4 text-[10.5px] font-mono leading-normal text-stone-400 space-y-2">
              <span className="text-[#ffaa00] font-press text-[8px] block select-none">BLUEPRINT GUIDELINES:</span>
              <p>✔ Academic CV utilizes optimal letter formats suited for Erasmus Mundus, Fulbright, and DAAD panel boards.</p>
              <p>✔ Export compiles in sub-millisecond threads cleanly leveraging standard vector canvases.</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
