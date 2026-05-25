"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getInitials } from './UserAvatar';

const POPULAR_SKILLS = [
  // Web & App Development
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "C", "Ruby", "PHP", "Swift", "Kotlin", "Go", "Rust", "Dart",
  "HTML5", "CSS3", "SASS/SCSS", "React.js", "Angular", "Vue.js", "Node.js", "Next.js", "Nuxt.js", "Express.js", "Django", "Flask",
  "Spring Boot", "Laravel", "React Native", "Flutter", "Tailwind CSS", "Bootstrap", "Material-UI", "Webpack", "Vite", "GraphQL", "REST APIs",
  
  // Cloud, DevOps & Databases
  "AWS", "Microsoft Azure", "Google Cloud Platform (GCP)", "Docker", "Kubernetes", "Jenkins", "CI/CD", "Terraform", "Ansible",
  "Linux", "Unix", "Bash Scripting", "Git", "GitHub", "GitLab", "Bitbucket", "Agile Methodologies", "Scrum",
  "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Firebase", "Supabase", "Oracle DB", "Elasticsearch", "Cassandra",
  
  // Data Science, AI & Machine Learning
  "Data Analysis", "Data Visualization", "Machine Learning", "Deep Learning", "Artificial Intelligence", "Natural Language Processing (NLP)",
  "Computer Vision", "Pandas", "NumPy", "TensorFlow", "PyTorch", "Scikit-Learn", "Jupyter Notebook", "R Programming", "MATLAB",
  "Tableau", "Power BI", "Data Mining", "Big Data", "Hadoop", "Spark", "Apache Kafka", "Web Scraping",
  
  // Design, Multimedia & UX/UI
  "UI/UX Design", "Graphic Design", "Web Design", "Mobile App Design", "Wireframing", "Prototyping", "Figma", "Adobe XD", "Sketch",
  "Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign", "Adobe Premiere Pro", "Adobe After Effects", "Video Editing", "Animation",
  "Motion Graphics", "3D Modeling", "Blender", "AutoCAD", "Color Theory", "Typography", "User Research", "Usability Testing",
  
  // Digital Marketing, SEO & Content
  "Digital Marketing", "Search Engine Optimization (SEO)", "Search Engine Marketing (SEM)", "Social Media Marketing (SMM)",
  "Content Marketing", "Content Writing", "Copywriting", "Email Marketing", "Google Analytics", "Google Ads", "Facebook Ads",
  "Brand Management", "Market Research", "Affiliate Marketing", "Blogging", "WordPress", "Shopify", "E-commerce Management",
  
  // Business, Finance & HR
  "Business Analysis", "Financial Analysis", "Accounting", "Bookkeeping", "QuickBooks", "Microsoft Excel", "Financial Modeling",
  "Project Management", "Product Management", "Risk Management", "Supply Chain Management", "Operations Management", "Business Strategy",
  "Human Resources", "Talent Acquisition", "Employee Relations", "Payroll Management", "Performance Management",
  
  // Sales & Customer Service
  "Sales", "B2B Sales", "B2C Sales", "Lead Generation", "Customer Relationship Management (CRM)", "Salesforce", "Negotiation",
  "Customer Service", "Customer Success", "Technical Support", "Account Management", "Client Relations", "Public Relations (PR)",
  
  // Engineering & Technical
  "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "SolidWorks", "MATLAB", "PLC Programming", "IoT",
  "Cybersecurity", "Network Administration", "Penetration Testing", "Information Security", "Cryptography", "Ethical Hacking",
  
  // Soft Skills & Personal Attributes
  "Leadership", "Teamwork", "Communication", "Problem Solving", "Critical Thinking", "Time Management", "Adaptability",
  "Conflict Resolution", "Decision Making", "Emotional Intelligence", "Creativity", "Innovation", "Work Ethic", "Attention to Detail",
  "Public Speaking", "Event Management", "Multitasking", "Mentoring", "Presentation Skills", "Strategic Planning", "Networking"
];

export default function CVBuilder({ user, onClose }) {
  const [mounted, setMounted] = useState(false);
  const storageKey = `nss_cv_data_${user?.id}`;

  const [cvData, setCvData] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    const initial = saved ? JSON.parse(saved) : {};
    return {
      themeColor: initial.themeColor || '#1e3a8a', // Default deep blue
      personal: {
        fullName: user?.full_name || '',
        jobTarget: '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.current_address || '',
        dob: user?.dob || '',
        bio: user?.bio || '',
        ...initial.personal
      },
      education: initial.education || [
        {
          id: 'edu-1',
          institution: 'Banwarilal Bhalotia College',
          address: 'Asansol, West Bengal',
          degree: `Bachelor's Degree - ${user?.department || 'Department'}`,
          year: 'Present',
          details: `Semester: ${user?.semester || 'N/A'}`
        }
      ],
      experience: initial.experience || [
        {
          id: 'exp-1',
          role: 'Active Volunteer',
          organization: 'National Service Scheme (NSS)',
          duration: 'Present',
          description: 'Participated in community service, social awareness campaigns, and sustainable development initiatives.'
        }
      ],
      projects: initial.projects || [
        {
          id: 'proj-1',
          name: 'Community Impact Project',
          link: 'GitHub / Link',
          description: 'Organized and managed a local blood donation drive.'
        }
      ],
      skills: initial.skills || ['Leadership', 'Community Service', 'Event Management', 'Public Speaking'],
      languages: initial.languages || [
        { id: 'lang-1', language: 'Bengali', proficiency: 'Native' },
        { id: 'lang-2', language: 'English', proficiency: 'Professional Working Proficiency' },
        { id: 'lang-3', language: 'Hindi', proficiency: 'Conversational' }
      ]
    };
  });

  const [activeTab, setActiveTab] = useState('personal');
  const [newSkill, setNewSkill] = useState('');
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Auto-filter skills based on input
  useEffect(() => {
    if (newSkill.trim()) {
      const filtered = POPULAR_SKILLS.filter(skill => 
        skill.toLowerCase().includes(newSkill.trim().toLowerCase()) && 
        !cvData.skills.includes(skill)
      );
      setFilteredSkills(filtered.slice(0, 6)); // Show top 6 suggestions
    } else {
      setFilteredSkills([]);
    }
  }, [newSkill, cvData.skills]);

  // Auto-adjust zoom for mobile screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setZoomLevel(0.42); // Perfect fit for standard mobile widths (around 360px-400px)
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(storageKey, JSON.stringify(cvData));
    }
  }, [cvData, storageKey, mounted]);

  if (!mounted) return null;

  const updatePersonal = (field, value) => {
    setCvData(prev => ({ ...prev, personal: { ...prev.personal, [field]: value } }));
  };

  const addEducation = () => {
    setCvData(prev => ({
      ...prev,
      education: [...prev.education, { id: `edu-${Date.now()}`, institution: '', degree: '', year: '', details: '' }]
    }));
  };

  const updateEducation = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
    }));
  };

  const removeEducation = (id) => {
    setCvData(prev => ({ ...prev, education: prev.education.filter(edu => edu.id !== id) }));
  };

  const addExperience = () => {
    setCvData(prev => ({
      ...prev,
      experience: [...prev.experience, { id: `exp-${Date.now()}`, role: '', organization: '', duration: '', description: '' }]
    }));
  };

  const updateExperience = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    }));
  };

  const removeExperience = (id) => {
    setCvData(prev => ({ ...prev, experience: prev.experience.filter(exp => exp.id !== id) }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !cvData.skills.includes(newSkill.trim())) {
      setCvData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setCvData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
  };

  const addProject = () => {
    setCvData(prev => ({ ...prev, projects: [...prev.projects, { id: `proj-${Date.now()}`, name: '', link: '', description: '' }] }));
  };

  const updateProject = (id, field, value) => {
    setCvData(prev => ({ ...prev, projects: prev.projects.map(p => p.id === id ? { ...p, [field]: value } : p) }));
  };

  const removeProject = (id) => {
    setCvData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  };

  const addLanguage = () => {
    setCvData(prev => ({ ...prev, languages: [...prev.languages, { id: `lang-${Date.now()}`, language: '', proficiency: '' }] }));
  };

  const updateLanguage = (id, field, value) => {
    setCvData(prev => ({ ...prev, languages: prev.languages.map(l => l.id === id ? { ...l, [field]: value } : l) }));
  };

  const removeLanguage = (id) => {
    setCvData(prev => ({ ...prev, languages: prev.languages.filter(l => l.id !== id) }));
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { id: 'education', label: 'Education', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg> },
    { id: 'experience', label: 'Volunteering', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    { id: 'skills', label: 'Skills', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
    { id: 'projects', label: 'Projects', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg> },
    { id: 'languages', label: 'Languages', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg> },
  ];

  const renderForm = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-4 animate-fade-in-up">
            <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Personal Information</h3>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Full Name</label><input type="text" value={cvData.personal.fullName} onChange={e => updatePersonal('fullName', e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-lg mt-1 outline-none focus:border-blue-500" /></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Target Job Title</label><input type="text" value={cvData.personal.jobTarget || ''} onChange={e => updatePersonal('jobTarget', e.target.value)} placeholder="e.g. Software Engineer, Management Trainee" className="w-full p-2.5 bg-slate-50 border rounded-lg mt-1 outline-none focus:border-blue-500" /></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Email</label><input type="email" value={cvData.personal.email} onChange={e => updatePersonal('email', e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-lg mt-1 outline-none focus:border-blue-500" /></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Phone</label><input type="text" value={cvData.personal.phone} onChange={e => updatePersonal('phone', e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-lg mt-1 outline-none focus:border-blue-500" /></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Address</label><input type="text" value={cvData.personal.address} onChange={e => updatePersonal('address', e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-lg mt-1 outline-none focus:border-blue-500" /></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Professional Summary (Bio)</label><textarea value={cvData.personal.bio} onChange={e => updatePersonal('bio', e.target.value)} rows={4} className="w-full p-2.5 bg-slate-50 border rounded-lg mt-1 outline-none focus:border-blue-500"></textarea></div>
          </div>
        );
      case 'education':
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="font-bold text-slate-800">Education History</h3>
              <button onClick={addEducation} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold hover:bg-blue-200">+ Add New</button>
            </div>
            {cvData.education.map((edu, index) => (
              <div key={edu.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 relative">
                <button onClick={() => removeEducation(edu.id)} className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">Institution Name</label><input type="text" value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)} className="w-full p-2 bg-white border rounded mt-1" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">Institution Address</label><input type="text" value={edu.address || ''} onChange={e => updateEducation(edu.id, 'address', e.target.value)} placeholder="e.g. Asansol, West Bengal" className="w-full p-2 bg-white border rounded mt-1" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">Degree / Course</label><input type="text" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} className="w-full p-2 bg-white border rounded mt-1" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase">Year / Duration</label><input type="text" value={edu.year} onChange={e => updateEducation(edu.id, 'year', e.target.value)} className="w-full p-2 bg-white border rounded mt-1" /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase">Grade / Details</label><input type="text" value={edu.details} onChange={e => updateEducation(edu.id, 'details', e.target.value)} className="w-full p-2 bg-white border rounded mt-1" /></div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'experience':
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="font-bold text-slate-800">Volunteering Experience</h3>
              <button onClick={addExperience} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold hover:bg-blue-200">+ Add New</button>
            </div>
            {cvData.experience.map((exp) => (
              <div key={exp.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 relative">
                <button onClick={() => removeExperience(exp.id)} className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">Role</label><input type="text" value={exp.role} onChange={e => updateExperience(exp.id, 'role', e.target.value)} className="w-full p-2 bg-white border rounded mt-1" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">Organization</label><input type="text" value={exp.organization} onChange={e => updateExperience(exp.id, 'organization', e.target.value)} className="w-full p-2 bg-white border rounded mt-1" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">Duration (e.g. 2022 - 2024)</label><input type="text" value={exp.duration} onChange={e => updateExperience(exp.id, 'duration', e.target.value)} className="w-full p-2 bg-white border rounded mt-1" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">Description</label><textarea value={exp.description} onChange={e => updateExperience(exp.id, 'description', e.target.value)} rows={3} className="w-full p-2 bg-white border rounded mt-1"></textarea></div>
              </div>
            ))}
          </div>
        );
      case 'skills':
        return (
          <div className="space-y-4 animate-fade-in-up">
            <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Skills</h3>
            <div className="relative">
              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input 
                  type="text" 
                  value={newSkill} 
                  onChange={e => { setNewSkill(e.target.value); setShowSkillSuggestions(true); }} 
                  onFocus={() => setShowSkillSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 200)}
                  placeholder="e.g. Graphic Design" 
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm" 
                />
                <button type="submit" className="bg-blue-600 text-white px-5 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm">Add</button>
              </form>
              
              {/* Suggestions Dropdown */}
              {showSkillSuggestions && filteredSkills.length > 0 && (
                <div className="absolute z-20 w-[calc(100%-80px)] mt-1.5 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden animate-fade-in-up">
                  {filteredSkills.map(skill => (
                    <div 
                      key={skill} 
                      className="px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 cursor-pointer text-sm text-slate-700 font-medium border-b border-slate-100 last:border-0 transition-colors flex items-center gap-2"
                      onClick={() => {
                        setCvData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
                        setNewSkill('');
                        setShowSkillSuggestions(false);
                      }}
                    >
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      {skill}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {cvData.skills.map(skill => (
                <div key={skill} className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium text-slate-700">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'projects':
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="font-bold text-slate-800">Projects</h3>
              <button onClick={addProject} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold hover:bg-blue-200">+ Add New</button>
            </div>
            {cvData.projects.map((proj) => (
              <div key={proj.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 relative">
                <button onClick={() => removeProject(proj.id)} className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">Project Name</label><input type="text" value={proj.name} onChange={e => updateProject(proj.id, 'name', e.target.value)} className="w-full p-2 bg-white border rounded mt-1" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">Link / Status</label><input type="text" value={proj.link} onChange={e => updateProject(proj.id, 'link', e.target.value)} className="w-full p-2 bg-white border rounded mt-1" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">Description (Bullet points)</label><textarea value={proj.description} onChange={e => updateProject(proj.id, 'description', e.target.value)} rows={3} className="w-full p-2 bg-white border rounded mt-1"></textarea></div>
              </div>
            ))}
          </div>
        );
      case 'languages':
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="font-bold text-slate-800">Languages</h3>
              <button onClick={addLanguage} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold hover:bg-blue-200">+ Add New</button>
            </div>
            {cvData.languages.map((lang) => (
              <div key={lang.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex-1 space-y-2">
                  <select value={lang.language} onChange={e => updateLanguage(lang.id, 'language', e.target.value)} className="w-full p-2 bg-white border rounded text-sm outline-none focus:border-blue-500">
                    <option value="">Select Language</option>
                    <option value="Bengali">Bengali</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Sanskrit">Sanskrit</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Santali">Santali</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                  <select value={lang.proficiency} onChange={e => updateLanguage(lang.id, 'proficiency', e.target.value)} className="w-full p-2 bg-white border rounded text-sm outline-none focus:border-blue-500">
                    <option value="">Select Proficiency</option>
                    <option value="Native">Native</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Professional Working Proficiency">Professional Working Proficiency</option>
                    <option value="Conversational">Conversational</option>
                    <option value="Beginner">Beginner</option>
                  </select>
                </div>
                <button onClick={() => removeLanguage(lang.id)} className="text-red-500 hover:text-red-700 font-bold px-2">&times;</button>
              </div>
            ))}
          </div>
        );
      default: return null;
    }
  };

  return createPortal(
    <>
      <style type="text/css">{`
        @media print {
          body > *:not(.cv-portal-root) {
            display: none !important;
          }
          .cv-portal-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        @page {
          margin: 0;
          size: A4;
        }
      `}</style>
      <div className="cv-portal-root fixed inset-0 z-[9999] bg-white flex flex-col print:bg-white print:block print:!static">
      {/* Top Navbar */}
      <div className="h-16 bg-slate-900 text-white flex items-center justify-between px-3 sm:px-6 shrink-0 print:hidden shadow-md z-20">
        <div className="flex items-center gap-2 sm:gap-3 truncate">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <h2 className="font-black text-[15px] sm:text-lg tracking-wide truncate">CV Builder</h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          
          {/* Mobile Preview Toggle */}
          <button 
            onClick={() => setShowPreviewMobile(!showPreviewMobile)} 
            className="md:hidden bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow flex items-center gap-1.5"
          >
            {showPreviewMobile ? (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Edit</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Preview</>
            )}
          </button>

          {/* Download PDF Button */}
          <button 
            onClick={() => window.print()} 
            className={`${showPreviewMobile ? 'flex' : 'hidden'} md:flex bg-blue-600 hover:bg-blue-500 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-lg items-center gap-1.5`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
          
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 shrink-0">
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
        {/* Left Sidebar (Editor) */}
        <div className={`w-full md:w-[400px] bg-white border-r border-slate-200 flex-col z-10 print:hidden shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${showPreviewMobile ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex md:flex-col overflow-x-auto border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 p-2 md:p-4 gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <span className="text-base sm:text-lg shrink-0">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white custom-scrollbar pb-24 md:pb-6">
            {renderForm()}
          </div>
        </div>

        {/* Right Area (Live Preview) */}
        <div className={`flex-1 bg-slate-200/80 overflow-auto p-4 md:p-8 flex-col print:p-0 print:bg-white print:block relative ${showPreviewMobile ? 'flex' : 'hidden md:flex'}`}>
          
          {/* Zoom Controls (Sticky Top) */}
          <div className="flex items-center mx-auto gap-3 mb-6 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] px-5 py-2 rounded-full sticky top-0 z-20 print:hidden shrink-0 border border-slate-100 transition-all hover:shadow-md w-max">
            <button onClick={() => setZoomLevel(z => Math.max(0.2, z - 0.1))} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg transition-colors">-</button>
            <span className="text-sm font-bold text-slate-700 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg transition-colors">+</button>
          </div>

          {/* Scale Wrapper to fix whitespace and scrolling */}
          <div className="w-full print:block print:!min-h-0 print:!h-auto print:!w-auto print:m-0 print:p-0 overflow-x-auto">
            <div style={{ width: `calc(210mm * ${zoomLevel})`, minHeight: `calc(297mm * ${zoomLevel})` }} className="relative shrink-0 mx-auto print:!w-full print:!min-h-0 print:!h-auto print:!mx-0">
              <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', transition: 'transform 0.15s ease-out' }} className="absolute top-0 left-0 print:!transform-none print:!relative print:!transition-none print:w-full print:flex print:justify-center">
              
              {/* A4 Paper */}
              <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl rounded-sm p-[12mm] md:p-[15mm] shrink-0 print:shadow-none print:w-full print:max-w-none print:m-0 print:min-h-0 print:h-auto print:p-[12mm] font-[Times_New_Roman,Times,serif] text-slate-900">
            
            {/* Header (Centered) */}
            <div className="flex flex-col items-center mb-6 text-center">
              {user?.photo_url ? (
                <div className="w-[65px] h-[65px] sm:w-[75px] sm:h-[75px] rounded-full border-[1.5px] border-slate-500 overflow-hidden mb-3">
                  <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-[65px] h-[65px] sm:w-[75px] sm:h-[75px] rounded-full border-[1.5px] border-slate-500 flex items-center justify-center mb-3">
                  <span className="text-2xl sm:text-3xl font-bold font-serif text-slate-800">
                    {cvData.personal.fullName ? cvData.personal.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'JB'}
                  </span>
                </div>
              )}
              <h1 className="text-[28px] sm:text-[32px] font-bold uppercase mb-1 text-slate-900" style={{ letterSpacing: '0.02em' }}>{cvData.personal.fullName || 'YOUR NAME'}</h1>
              {cvData.personal.jobTarget && (
                <h2 className="text-[14px] sm:text-[15px] text-slate-800 mb-1">{cvData.personal.jobTarget}</h2>
              )}
              <p className="text-[12px] sm:text-[13px] text-slate-700">
                {cvData.personal.email} {cvData.personal.phone ? ` | ${cvData.personal.phone}` : ''} {cvData.personal.address ? ` | ${cvData.personal.address}` : ''}
              </p>
            </div>

            {/* Professional Summary */}
            {cvData.personal.bio && (
              <div className="mb-5">
                <h2 className="text-[15px] sm:text-[17px] font-bold text-slate-900 border-b-[1.5px] border-slate-800 pb-0.5 mb-2">Professional Summary</h2>
                <p className="text-[12px] sm:text-[13px] text-slate-800 leading-relaxed text-justify">
                  {cvData.personal.bio}
                </p>
              </div>
            )}


            {/* Education */}
            {cvData.education.length > 0 && (
              <div className="mb-5">
                <h2 className="text-[15px] sm:text-[17px] font-bold text-slate-900 border-b-[1.5px] border-slate-800 pb-0.5 mb-2">Education</h2>
                <div className="space-y-3">
                  {cvData.education.map(edu => (
                    <div key={edu.id} className="text-[12px] sm:text-[13px] text-slate-800">
                      <div className="flex justify-between items-start">
                        <div className="font-bold">{edu.institution}</div>
                        <div className="text-right">{edu.address}</div>
                      </div>
                      <div className="flex justify-between items-start">
                        <div className="italic">{edu.degree}</div>
                        <div className="text-right">{edu.year}</div>
                      </div>
                      {edu.details && (
                        <ul className="list-disc list-outside ml-4 mt-1">
                          <li>{edu.details}</li>
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {cvData.skills.length > 0 && (
              <div className="mb-5">
                <h2 className="text-[15px] sm:text-[17px] font-bold text-slate-900 border-b-[1.5px] border-slate-800 pb-0.5 mb-2">Skills</h2>
                <ul className="list-disc list-outside ml-4 text-[12px] sm:text-[13px] text-slate-800 space-y-0.5">
                  <li><span className="font-bold">Core Competencies:</span> {cvData.skills.join(', ')}</li>
                </ul>
              </div>
            )}



            {/* Volunteering Experience / Experience */}
            {cvData.experience.length > 0 && (
              <div className="mb-5">
                <h2 className="text-[15px] sm:text-[17px] font-bold text-slate-900 border-b-[1.5px] border-slate-800 pb-0.5 mb-2">Experience</h2>
                <div className="space-y-3">
                  {cvData.experience.map(exp => (
                    <div key={exp.id} className="text-[12px] sm:text-[13px] text-slate-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold">{exp.organization}</span> | <span className="italic">{exp.role}</span>
                        </div>
                        <div className="text-right">{exp.duration}</div>
                      </div>
                      {exp.description && (
                        <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5">
                          {exp.description.split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                            <li key={idx}>{line}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {cvData.projects.length > 0 && (
              <div className="mb-5">
                <h2 className="text-[15px] sm:text-[17px] font-bold text-slate-900 border-b-[1.5px] border-slate-800 pb-0.5 mb-2">Projects</h2>
                <div className="space-y-3">
                  {cvData.projects.map(proj => (
                    <div key={proj.id} className="text-[12px] sm:text-[13px] text-slate-800">
                      <div className="flex justify-between items-start">
                        <div className="font-bold">{proj.name}</div>
                        {proj.link && (
                          <div className="text-right">
                            <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-800">
                              Link to Project
                            </a>
                          </div>
                        )}
                      </div>
                      {proj.description && (
                        <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5">
                          {proj.description.split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                            <li key={idx}>{line}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {cvData.languages.length > 0 && (
              <div className="mb-5">
                <h2 className="text-[15px] sm:text-[17px] font-bold text-slate-900 border-b-[1.5px] border-slate-800 pb-0.5 mb-2">Languages</h2>
                <ul className="list-disc list-outside ml-4 text-[12px] sm:text-[13px] text-slate-800 space-y-0.5">
                  {cvData.languages.map(lang => (
                    <li key={lang.id}><span className="font-bold">{lang.language}:</span> {lang.proficiency}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</div>
</>,
    document.body
  );
}
