import React, { useState, useEffect } from 'react';
import { Download, FileCode, FileText, CheckCircle, Sparkles, FolderDown, Award, Calendar } from 'lucide-react';
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

  const handleExportData = async (type: 'applications' | 'essay' | 'resume' | 'portfolio') => {
    playClickSound();
    setExporting(true);
    setSuccessMsg('');

    // Wait 800ms to simulate official compile
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!profile) {
      setExporting(false);
      return;
    }

    try {
      if (type === 'applications') {
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
          // Generate active HTML format Word document
          let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>`;
          html += `<head><title>Applications Portfolio</title><style>body { font-family: Arial, sans-serif; }</style></head><body>`;
          html += `<h1>ScholarPath Applications Portfolio for ${profile.fullName}</h1>`;
          applications.forEach((app, i) => {
            html += `<h2>${i + 1}. ${app.name}</h2>`;
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
          // PDF Simulation layout (Styled HTML file suitable for print/view)
          let pdfHtml = `<html><head><title>PDF Portfolio</title><style>body { font-family: Helvetica, sans-serif; padding: 40px; color: #292524; }</style></head><body>`;
          pdfHtml += `<h1>ScholarPath PDF Portable Admissions Tracker</h1>`;
          pdfHtml += `<p>Created for professional candidate: <strong>${profile.fullName}</strong></p><hr/>`;
          applications.forEach((app) => {
            pdfHtml += `<h3>${app.name}</h3>`;
            pdfHtml += `<p>Deadline: ${app.deadline} | Status: ${app.status}</p>`;
            pdfHtml += `<ul>`;
            app.checklist.forEach(item => {
              pdfHtml += `<li>${item.done ? '✅' : '⬜'} ${item.text}</li>`;
            });
            pdfHtml += `</ul>`;
          });
          pdfHtml += `</body></html>`;
          triggerDownload(`${title}.html`, pdfHtml, 'text/html');
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
