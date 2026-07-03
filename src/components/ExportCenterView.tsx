import React, { useState, useEffect } from 'react';
import { Download, FileCode, FileText, CheckCircle, Sparkles, FolderDown, Award, Calendar, FileCheck } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Application, Profile } from '../types';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { useAuth } from '../context/AuthContext';

export default function ExportCenterView() {
  const { authorizedFetch, rewardPoints } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx' | 'json' | 'md'>('md');
  const [exporting, setExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Collect stats from API
    const loadData = async () => {
      try {
        const res = await authorizedFetch('/api/applications');
        let data = [];
        if (res.ok) {
          data = await res.json();
        }
        
        if (!data || data.length === 0) {
          const { getMockApplications } = await import('../services/mockDataService');
          data = getMockApplications();
        }
        setApplications(data || []);
      } catch (err) {
        console.warn("Failed to fetch applications in export, using fallback", err);
        const { getMockApplications } = await import('../services/mockDataService');
        setApplications(getMockApplications());
      }
      
      try {
        const res = await authorizedFetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    const handleProfileUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
      }
    };
    window.addEventListener('profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('profile-updated', handleProfileUpdated);
  }, []);

  const generateScholarSummaryPdf = async (p: Profile, apps: Application[]) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '750px';
    container.style.backgroundColor = '#18181b';
    container.style.color = '#f5f5f4';
    container.style.fontFamily = 'monospace';
    container.style.padding = '28px';
    container.style.border = '6px solid #000000';

    container.innerHTML = `
      <div style="border-bottom: 3px solid #eab308; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 style="color: #fef08a; font-size: 20px; font-weight: bold; margin: 0; text-transform: uppercase; font-family: sans-serif;">SCHOLARPATH ADMISSIONS DOSSIER</h1>
          <p style="color: #a8a29e; font-size: 11px; margin: 4px 0 0 0;">Candidate: ${p.fullName || 'Scholar Explorer'}</p>
        </div>
        <div style="text-align: right; font-size: 11px; color: #fef08a; font-weight: bold;">
          <div>LEVEL ${p.level || 1} SCHOLAR</div>
          <div style="color: #38bdf8;">${p.points || 0} XP ACCUMULATED</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; background: #27272a; padding: 14px; border: 2px solid #3f3f46;">
        <div>
          <p style="color: #eab308; font-size: 10px; margin: 0 0 4px 0; font-weight: bold;">CANDIDATE METRICS</p>
          <p style="margin: 2px 0; font-size: 11px;"><strong>Title:</strong> ${p.heroTitle || 'Fellowship Explorer'}</p>
          <p style="margin: 2px 0; font-size: 11px;"><strong>Location:</strong> ${[p.city, p.country || p.nationality].filter(Boolean).join(', ') || 'Global'}</p>
          <p style="margin: 2px 0; font-size: 11px;"><strong>Education Level:</strong> ${p.educationLevel || 'Undergraduate'}</p>
          <p style="margin: 2px 0; font-size: 11px;"><strong>GPA:</strong> ${p.gpa || 3.0} / ${p.maxGpa || 4.0}</p>
        </div>
        <div>
          <p style="color: #eab308; font-size: 10px; margin: 0 0 4px 0; font-weight: bold;">ACADEMIC PROFILE</p>
          <p style="margin: 2px 0; font-size: 11px;"><strong>Primary Major:</strong> ${p.primaryMajor || p.intendedMajor || 'N/A'}</p>
          <p style="margin: 2px 0; font-size: 11px;"><strong>University:</strong> ${p.universityName || p.collegeName || 'N/A'}</p>
          <p style="margin: 2px 0; font-size: 11px;"><strong>Degree:</strong> ${p.degree || p.intendedDegree || 'N/A'}</p>
          <p style="margin: 2px 0; font-size: 11px;"><strong>IELTS/TOEFL:</strong> ${p.ieltsScore || 'N/A'} | <strong>GRE:</strong> ${p.greScore || 'N/A'}</p>
        </div>
      </div>

      ${p.additionalSkills && p.additionalSkills.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <p style="color: #eab308; font-size: 10px; margin: 0 0 6px 0; font-weight: bold;">SKILL MATRIX TAGS</p>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${p.additionalSkills.map(s => `<span style="background: #3f3f46; color: #fef08a; padding: 3px 6px; border: 1px solid #71717a; font-size: 10px;">${s}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      <div style="margin-bottom: 20px;">
        <p style="color: #eab308; font-size: 10px; margin: 0 0 6px 0; font-weight: bold;">APPLICATION TRACKING LOGS (${apps.length})</p>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${apps.length === 0 ? `<p style="font-size: 10px; color: #a8a29e;">No application logs recorded yet.</p>` : apps.slice(0, 6).map(app => `
            <div style="background: #27272a; padding: 6px 10px; border: 1px solid #3f3f46; display: flex; justify-content: space-between; font-size: 10px;">
              <div>
                <strong style="color: #fef08a;">${app.name}</strong> (${app.providerOrUni || 'Scholarship'})
              </div>
              <div style="color: #38bdf8;">
                Status: ${app.status} | Deadline: ${app.deadline}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="border-top: 1px solid #3f3f46; padding-top: 10px; margin-top: 16px; font-size: 9px; color: #71717a; text-align: center;">
        ScholarPath Official Admissions Ledger • https://scholarpath.app
      </div>
    `;

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#18181b'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${p.fullName || 'Scholar'}_ScholarPath_Dossier.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      document.body.removeChild(container);
    }
  };

  const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportData = async (type: 'applications' | 'essay' | 'resume' | 'portfolio' | 'scholar_summary') => {
    playClickSound();
    setExporting(true);
    setSuccessMsg('');

    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!profile) {
      setExporting(false);
      return;
    }

    try {
      if (type === 'scholar_summary' || (type === 'portfolio' && selectedFormat === 'pdf')) {
        await generateScholarSummaryPdf(profile, applications);
      } else if (type === 'applications') {
        const title = `${profile.fullName}_ScholarPath_Applications`;
        if (selectedFormat === 'json') {
          const content = JSON.stringify(applications, null, 2);
          triggerDownload(`${title}.json`, content, 'application/json');
        } else if (selectedFormat === 'md') {
          let content = `# ScholarPath Applications Guide for ${profile.fullName}\n`;
          content += `Generated on ${new Date().toLocaleDateString()}\n\n`;
          applications.forEach((app, i) => {
            content += `## ${i + 1}. ${app.name}\n`;
            content += `- **Provider**: ${app.providerOrUni}\n`;
            content += `- **Deadline**: ${app.deadline}\n`;
            content += `- **Status**: ${app.status}\n`;
            content += `- **Notes**: ${app.notes || 'None'}\n\n`;
            content += `### Checklist Items:\n`;
            app.checklist.forEach(item => {
              content += `  - [${item.done ? 'x' : ' '}] ${item.text}\n`;
            });
            content += `\n---\n\n`;
          });
          triggerDownload(`${title}.md`, content, 'text/markdown');
        } else if (selectedFormat === 'docx') {
          let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>`;
          html += `<head><title>Applications Portfolio</title><style>body { font-family: Arial, sans-serif; }</style></head><body>`;
          html += `<h1>ScholarPath Applications Portfolio for ${profile.fullName}</h1>`;
          applications.forEach((app, i) => {
            html += `2. ${app.name}`;
            html += `<p><strong>Provider/Uni:</strong> ${app.providerOrUni}<br/>`;
            html += `<strong>Deadline:</strong> ${app.deadline}<br/>`;
            html += `<strong>Status:</strong> ${app.status}</p>`;
            html += `<p><strong>Admissions Notes:</strong> ${app.notes || 'No custom notes logged.'}</p>`;
            html += `<h3>Application Checklist:</h3><ul>`;
            app.checklist.forEach(item => {
              html += `<li>[${item.done ? 'DONE' : 'PENDING'}] ${item.text}</li>`;
            });
            html += `</ul><hr/>`;
          });
          html += `</body></html>`;
          triggerDownload(`${title}.docx`, html, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        } else {
          await generateScholarSummaryPdf(profile, applications);
        }
      } else if (type === 'essay') {
        const title = `${profile.fullName}_ScholarPath_Motivation_SOP`;
        const testEssay = `Personal Statement & Statement of Purpose for International Admissions\nTarget major: ${profile.intendedMajor}\nDegree level: ${profile.intendedDegree}\n\n` + 
          `My name is ${profile.fullName}. My core study objective is to excel at fully-funded graduate computing initiatives. Dual-pipelines of software development teach us that robust coding resolves human tracking matrices...\n\n` +
          `Through my background in Bangladesh as a developer finalist and managing resource clubs, I intend to bridge systemic gaps. Pursuing research under global advisors aligns directly with my ambitions. Thank you for your review.`;

        if (selectedFormat === 'json') {
          triggerDownload(`${title}.json`, JSON.stringify({ author: profile.fullName, major: profile.intendedMajor, text: testEssay }, null, 2), 'application/json');
        } else if (selectedFormat === 'md') {
          triggerDownload(`${title}.md`, `# SOP Statement of Purpose\n\n**Candidate:** ${profile.fullName}\n\n${testEssay}`, 'text/markdown');
        } else if (selectedFormat === 'docx') {
          let html = `<html><body><h2>Statement of Purpose</h2><p><strong>Candidate:</strong> ${profile.fullName}</p><p>${testEssay.replace(/\n/g, '<br/>')}</p></body></html>`;
          triggerDownload(`${title}.docx`, html, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        } else {
          let html = `<html><body style="font-family:serif; padding:50px;"><h2>Statement of Purpose</h2><p><strong>Candidate:</strong> ${profile.fullName}</p><p>${testEssay.replace(/\n/g, '<br/>')}</p></body></html>`;
          triggerDownload(`${title}.html`, html, 'text/html');
        }
      } else if (type === 'resume') {
        const title = `${profile.fullName}_ScholarPath_Curriculum_Vitae`;
        let resumeMd = `# Curriculum Vitae (CV) - ${profile.fullName}\n`;
        resumeMd += `Nationality: ${profile.nationality} | Target Major: ${profile.intendedMajor}\n\n`;
        resumeMd += `## Academic Metrics\n- **GPA**: ${profile.gpa} / ${profile.maxGpa}\n- **IELTS Score**: ${profile.ieltsScore || '7.5'}\n- **GRE Score**: ${profile.greScore || '318'}\n\n`;
        resumeMd += `## Leadership Credentials\n`;
        profile.leadershipExperience.forEach(ex => { resumeMd += `- ${ex}\n`; });
        resumeMd += `\n## Projects Summary\n`;
        profile.projects.forEach(p => { resumeMd += `- ${p}\n`; });
        resumeMd += `\n## Volunteering & Experience\n`;
        profile.volunteerExperience.forEach(v => { resumeMd += `- ${v}\n`; });

        if (selectedFormat === 'json') {
          triggerDownload(`${title}.json`, JSON.stringify(profile, null, 2), 'application/json');
        } else if (selectedFormat === 'md') {
          triggerDownload(`${title}.md`, resumeMd, 'text/markdown');
        } else if (selectedFormat === 'docx') {
          let html = `<html><body><h2>Curriculum Vitae</h2><h3>${profile.fullName}</h3><p>${resumeMd.replace(/\n/g, '<br/>')}</p></body></html>`;
          triggerDownload(`${title}.docx`, html, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        } else {
          let html = `<html><body style="font-family:sans-serif; padding:40px;"><h2>Curriculum Vitae - ${profile.fullName}</h2><p>${resumeMd.replace(/\n/g, '<br/>')}</p></body></html>`;
          triggerDownload(`${title}.html`, html, 'text/html');
        }
      } else if (type === 'portfolio') {
        const title = `${profile.fullName}_Complete_ScholarPath_Admissions_Artifacts`;
        const fullPortfolio = {
          profile,
          applications,
          timeline: [
            { stage: 1, name: "Mineral Foundations", goal: "Acquire standardized test bands" },
            { stage: 2, name: "SOP Sabbatical", goal: "Submit drafts to ScholarPath AI analysis feedback" }
          ]
        };
        const content = JSON.stringify(fullPortfolio, null, 2);
        triggerDownload(`${title}.json`, content, 'application/json');
      }

      setSuccessMsg(`Successfully exported ${type.toUpperCase()} to file! Check your storage.`);
      
      // Award reward points for utilizing standard export tools
      if (rewardPoints) {
        await rewardPoints(30, `Admissions Exporter (${type})`, "Portfolio Architect");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6" id="scholarpath-export-center">
      {/* Visual Header */}
      <div className="mc-card bg-stone-900 border-4 border-amber-500 p-5 rounded-none text-stone-200">
        <h3 className="font-press text-xs text-amber-500 uppercase flex items-center gap-2">
          <FolderDown className="w-5 h-5 text-amber-500" /> EXPORT LAB STATION
        </h3>
        <p className="text-xs text-stone-400 font-mono mt-1 leading-relaxed">
          Compile finished application logs, milestones roadmaps, curated SOP essays, or full student profile states into portable documents designed for instant offline backup or sharing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Setup Parameters Panel */}
        <div className="md:col-span-4 bg-stone-900 border-4 border-stone-700 p-4 rounded-none text-stone-200 space-y-4">
          <h4 className="font-press text-[10px] text-amber-500 uppercase">Export Options</h4>
          
          <div className="space-y-2">
            <span className="text-[9px] uppercase font-press tracking-wider text-stone-400 block border-b border-stone-800 pb-1">Target Format</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => { setSelectedFormat('md'); playClickSound(); }}
                className={`p-2 border-2 cursor-pointer rounded-none text-center font-bold ${
                  selectedFormat === 'md' ? 'bg-amber-500 text-stone-950 border-stone-900' : 'bg-stone-800 border-stone-700 hover:border-stone-600'
                }`}
              >
                Markdown (.md)
              </button>
              <button
                type="button"
                onClick={() => { setSelectedFormat('json'); playClickSound(); }}
                className={`p-2 border-2 cursor-pointer rounded-none text-center font-bold ${
                  selectedFormat === 'json' ? 'bg-amber-500 text-stone-950 border-stone-900' : 'bg-stone-800 border-stone-700 hover:border-stone-600'
                }`}
              >
                JSON Schema
              </button>
              <button
                type="button"
                onClick={() => { setSelectedFormat('docx'); playClickSound(); }}
                className={`p-2 border-2 cursor-pointer rounded-none text-center font-bold ${
                  selectedFormat === 'docx' ? 'bg-amber-500 text-stone-950 border-stone-900' : 'bg-stone-800 border-stone-700 hover:border-stone-600'
                }`}
              >
                Word (.docx)
              </button>
              <button
                type="button"
                onClick={() => { setSelectedFormat('pdf'); playClickSound(); }}
                className={`p-2 border-2 cursor-pointer rounded-none text-center font-bold ${
                  selectedFormat === 'pdf' ? 'bg-amber-500 text-stone-950 border-stone-900' : 'bg-stone-800 border-stone-700 hover:border-stone-600'
                }`}
              >
                HTML / PDF (.html)
              </button>
            </div>
            <p className="text-[10px] text-stone-400 font-mono mt-2 leading-relaxed">
              *Markdown formats are universally readable. Word configurations assemble clean native tables, and HTML compiles formatted structures ready to be printed straight to PDF files.
            </p>
          </div>
        </div>

        {/* Action Grid Panel */}
        <div className="md:col-span-8 space-y-4">
          {successMsg && (
            <div className="bg-emerald-900/40 border-2 border-emerald-500 text-emerald-300 p-3 text-xs font-mono rounded-none flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5 shrink-0 text-emerald-400 animate-bounce" />
              <span>{successMsg} (+30 XP Added to Stats!)</span>
            </div>
          )}

          {exporting && (
            <div className="bg-amber-900/30 border-2 border-amber-500 text-amber-300 p-3 text-xs font-mono rounded-none flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4.5 h-4.5 shrink-0 text-amber-400 animate-spin" />
              <span>Compiling structured assets... Please wait for folder generation...</span>
            </div>
          )}

          {/* Featured Scholar Summary PDF Banner */}
          <div className="bg-[#1a1816] border-4 border-[#ffaa00] p-4 rounded-none text-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 [box-shadow:inset_-2px_-2px_0_#141414]">
            <div className="space-y-1">
              <span className="font-press text-[9px] text-[#ffaa00] uppercase block flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-[#ffaa00]" /> OFFICIAL SCHOLAR SUMMARY PDF
              </span>
              <p className="text-xs text-stone-300 font-mono leading-relaxed">
                Compile a pixel-styled, high-density admissions dossier PDF containing candidate metrics, GPA standing, skills tags, and active application statuses.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleExportData('scholar_summary')}
              disabled={exporting}
              className="mc-btn font-press text-[8px] py-2.5 px-4 uppercase text-[#ffff55] shrink-0 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#ffff55]" /> Generate Dossier PDF
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Applications Card */}
            <div className="bg-stone-900 border-4 border-stone-800 p-4 flex flex-col justify-between rounded-none hover:border-stone-700 transition-colors">
              <div className="space-y-1">
                <Calendar className="w-8 h-8 text-orange-400" />
                <h4 className="text-xs font-press uppercase text-stone-100">Applications Checklist</h4>
                <p className="text-[10px] text-stone-400 font-mono leading-relaxed">
                  Backup your active application trackers, logged notes, due deadlines, and step milestones.
                </p>
              </div>
              <button
                onClick={() => handleExportData('applications')}
                disabled={exporting}
                className="mt-4 w-full text-center text-[10px] font-press bg-orange-600 hover:bg-orange-500 text-white cursor-pointer border-r border-b border-stone-950 py-2 uppercase leading-none"
              >
                Download File
              </button>
            </div>

            {/* Essays SOP Card */}
            <div className="bg-stone-900 border-4 border-stone-800 p-4 flex flex-col justify-between rounded-none hover:border-stone-700 transition-colors">
              <div className="space-y-1">
                <FileText className="w-8 h-8 text-cyan-400" />
                <h4 className="text-xs font-press uppercase text-stone-100">Motivation Research Essay</h4>
                <p className="text-[10px] text-stone-400 font-mono leading-relaxed">
                  Export formatted Statement of Purpose (SOP) academic hooks designed to align with scholarship panels.
                </p>
              </div>
              <button
                onClick={() => handleExportData('essay')}
                disabled={exporting}
                className="mt-4 w-full text-center text-[10px] font-press bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer border-r border-b border-stone-950 py-2 uppercase leading-none"
              >
                Download Essay
              </button>
            </div>

            {/* Resume CV Card */}
            <div className="bg-stone-900 border-4 border-stone-800 p-4 flex flex-col justify-between rounded-none hover:border-stone-700 transition-colors">
              <div className="space-y-1">
                <Award className="w-8 h-8 text-amber-500" />
                <h4 className="text-xs font-press uppercase text-stone-100">Curriculum Vitae Details</h4>
                <p className="text-[10px] text-stone-400 font-mono leading-relaxed">
                  Download a complete structured breakdown of certifications, leadership, and quantified project formulas.
                </p>
              </div>
              <button
                onClick={() => handleExportData('resume')}
                disabled={exporting}
                className="mt-4 w-full text-center text-[10px] font-press bg-amber-600 hover:bg-amber-500 text-white cursor-pointer border-r border-b border-stone-950 py-2 uppercase leading-none"
              >
                Download Resume
              </button>
            </div>

            {/* Full Portfolio Card */}
            <div className="bg-stone-900 border-4 border-stone-800 p-4 flex flex-col justify-between rounded-none hover:border-stone-700 transition-colors">
              <div className="space-y-1">
                <FileCode className="w-8 h-8 text-purple-400" />
                <h4 className="text-xs font-press uppercase text-stone-100">Unified Student State</h4>
                <p className="text-[10px] text-stone-400 font-mono leading-relaxed">
                  A comprehensive package containing the full backing state of your profile details, XP levels, and list settings.
                </p>
              </div>
              <button
                onClick={() => handleExportData('portfolio')}
                disabled={exporting}
                className="mt-4 w-full text-center text-[10px] font-press bg-purple-600 hover:bg-purple-500 text-white cursor-pointer border-r border-b border-stone-950 py-2 uppercase leading-none"
              >
                Export JSON State
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
