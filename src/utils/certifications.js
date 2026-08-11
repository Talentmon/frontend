// Normalized certification catalog: every entry carries its issuing
// organization and a category ("family") so search can filter by any of
// issuer / family / specific certification, per the candidate-search
// filter and candidate-profile/edit certificate form.
export const CERTIFICATION_CATALOG = [
  // Cloud
  { family: 'Cloud', issuer: 'Amazon Web Services', name: 'AWS Cloud Practitioner' },
  { family: 'Cloud', issuer: 'Amazon Web Services', name: 'AWS Solutions Architect Associate' },
  { family: 'Cloud', issuer: 'Amazon Web Services', name: 'AWS Developer Associate' },
  { family: 'Cloud', issuer: 'Amazon Web Services', name: 'AWS DevOps Engineer Professional' },
  { family: 'Cloud', issuer: 'Microsoft', name: 'Azure Fundamentals (AZ-900)' },
  { family: 'Cloud', issuer: 'Microsoft', name: 'Azure Administrator (AZ-104)' },
  { family: 'Cloud', issuer: 'Microsoft', name: 'Azure Developer (AZ-204)' },
  { family: 'Cloud', issuer: 'Microsoft', name: 'Azure Solutions Architect Expert' },
  { family: 'Cloud', issuer: 'Google', name: 'Google Associate Cloud Engineer' },
  { family: 'Cloud', issuer: 'Google', name: 'Google Professional Cloud Architect' },

  // Cyber Security
  { family: 'Cyber Security', issuer: 'CompTIA', name: 'CompTIA Network+' },
  { family: 'Cyber Security', issuer: 'CompTIA', name: 'CompTIA Linux+' },
  { family: 'Cyber Security', issuer: 'CompTIA', name: 'CompTIA CySA+' },
  { family: 'Cyber Security', issuer: 'CompTIA', name: 'CompTIA PenTest+' },
  { family: 'Cyber Security', issuer: 'CompTIA', name: 'CompTIA CASP+' },
  { family: 'Cyber Security', issuer: 'ISC2', name: 'CISSP' },
  { family: 'Cyber Security', issuer: 'ISC2', name: 'SSCP' },
  { family: 'Cyber Security', issuer: 'ISACA', name: 'CISM' },
  { family: 'Cyber Security', issuer: 'ISACA', name: 'CISA' },
  { family: 'Cyber Security', issuer: 'Offensive Security', name: 'OSCP' },
  { family: 'Cyber Security', issuer: 'Offensive Security', name: 'OSWE' },
  { family: 'Cyber Security', issuer: 'GIAC', name: 'GSEC' },
  { family: 'Cyber Security', issuer: 'GIAC', name: 'GIAC GPEN' },
  { family: 'Cyber Security', issuer: 'EC-Council', name: 'CEH' },

  // Networking
  { family: 'Networking', issuer: 'Cisco', name: 'Cisco CCST' },
  { family: 'Networking', issuer: 'Cisco', name: 'Cisco CCNA' },
  { family: 'Networking', issuer: 'Cisco', name: 'Cisco CCNP' },
  { family: 'Networking', issuer: 'Cisco', name: 'Cisco CCIE' },
  { family: 'Networking', issuer: 'Juniper Networks', name: 'Juniper JNCIA' },
  { family: 'Networking', issuer: 'Juniper Networks', name: 'Juniper JNCIS' },
  { family: 'Networking', issuer: 'Fortinet', name: 'Fortinet NSE' },
  { family: 'Networking', issuer: 'Palo Alto Networks', name: 'Palo Alto PCCET' },
  { family: 'Networking', issuer: 'Palo Alto Networks', name: 'Palo Alto PCNSE' },

  // Linux / DevOps
  { family: 'Linux / DevOps', issuer: 'Red Hat', name: 'Red Hat RHCSA' },
  { family: 'Linux / DevOps', issuer: 'Red Hat', name: 'Red Hat RHCE' },
  { family: 'Linux / DevOps', issuer: 'Linux Foundation', name: 'Linux Foundation LFCS' },
  { family: 'Linux / DevOps', issuer: 'Linux Foundation', name: 'Linux Foundation LFCE' },
  { family: 'Linux / DevOps', issuer: 'CNCF', name: 'Kubernetes CKA' },
  { family: 'Linux / DevOps', issuer: 'CNCF', name: 'Kubernetes CKAD' },
  { family: 'Linux / DevOps', issuer: 'CNCF', name: 'Kubernetes CKS' },
  { family: 'Linux / DevOps', issuer: 'Docker', name: 'Docker Certified Associate' },

  // Databases
  { family: 'Databases', issuer: 'Oracle', name: 'Oracle Database Administrator' },
  { family: 'Databases', issuer: 'Microsoft', name: 'Microsoft Azure Database Administrator' },
  { family: 'Databases', issuer: 'MongoDB', name: 'MongoDB Associate DBA' },
  { family: 'Databases', issuer: 'PostgreSQL', name: 'PostgreSQL Professional' },

  // Programming
  { family: 'Programming', issuer: 'Oracle', name: 'Oracle Certified Java Professional (OCP Java)' },
  { family: 'Programming', issuer: 'Oracle', name: 'Oracle Certified Java Associate' },
  { family: 'Programming', issuer: 'Microsoft', name: 'Microsoft Certified .NET Developer' },
  { family: 'Programming', issuer: 'Python Institute', name: 'Python Institute PCEP' },
  { family: 'Programming', issuer: 'Python Institute', name: 'Python Institute PCAP' },
  { family: 'Programming', issuer: 'Python Institute', name: 'Python Institute PCPP' },
  { family: 'Programming', issuer: 'Salesforce', name: 'Salesforce Developer' },
  { family: 'Programming', issuer: 'Salesforce', name: 'Salesforce Administrator' },

  // SAP
  { family: 'SAP', issuer: 'SAP', name: 'SAP S/4HANA' },
  { family: 'SAP', issuer: 'SAP', name: 'SAP MM' },
  { family: 'SAP', issuer: 'SAP', name: 'SAP SD' },
  { family: 'SAP', issuer: 'SAP', name: 'SAP FI' },
  { family: 'SAP', issuer: 'SAP', name: 'SAP ABAP' },
  { family: 'SAP', issuer: 'SAP', name: 'SAP SuccessFactors' },

  // Data & AI
  { family: 'Data & AI', issuer: 'Microsoft', name: 'Microsoft Power BI Data Analyst' },
  { family: 'Data & AI', issuer: 'Microsoft', name: 'Microsoft Fabric Analytics Engineer' },
  { family: 'Data & AI', issuer: 'Google', name: 'Google Data Analytics' },
  { family: 'Data & AI', issuer: 'Amazon Web Services', name: 'AWS Machine Learning Specialty' },
  { family: 'Data & AI', issuer: 'Microsoft', name: 'Microsoft Azure AI Engineer' },
  { family: 'Data & AI', issuer: 'Google', name: 'Google Professional Machine Learning Engineer' },
  { family: 'Data & AI', issuer: 'Databricks', name: 'Databricks Certified Associate Developer' },
  { family: 'Data & AI', issuer: 'Google', name: 'TensorFlow Developer' },

  // Project Management
  { family: 'Project Management', issuer: 'PMI', name: 'PMP' },
  { family: 'Project Management', issuer: 'PMI', name: 'CAPM' },
  { family: 'Project Management', issuer: 'PMI', name: 'PMI-ACP' },
  { family: 'Project Management', issuer: 'AXELOS', name: 'PRINCE2 Foundation' },
  { family: 'Project Management', issuer: 'AXELOS', name: 'PRINCE2 Practitioner' },
  { family: 'Project Management', issuer: 'Scrum.org', name: 'Scrum Master (PSM I, II, III)' },
  { family: 'Project Management', issuer: 'Scrum Alliance', name: 'Certified ScrumMaster (CSM)' },
  { family: 'Project Management', issuer: 'Scrum.org', name: 'Professional Scrum Product Owner (PSPO)' },
  { family: 'Project Management', issuer: 'Scaled Agile', name: 'SAFe Agilist' },
  { family: 'Project Management', issuer: 'Scaled Agile', name: 'SAFe Scrum Master' },
  { family: 'Project Management', issuer: 'APMG International', name: 'AgilePM' },
  { family: 'Project Management', issuer: 'Six Sigma', name: 'Lean Six Sigma Yellow Belt' },
  { family: 'Project Management', issuer: 'Six Sigma', name: 'Lean Six Sigma Green Belt' },
  { family: 'Project Management', issuer: 'Six Sigma', name: 'Lean Six Sigma Black Belt' },

  // Finance
  { family: 'Finance', issuer: 'CFA Institute', name: 'CFA' },
  { family: 'Finance', issuer: 'ACCA', name: 'ACCA' },
  { family: 'Finance', issuer: 'AICPA', name: 'CPA' },
  { family: 'Finance', issuer: 'CIMA', name: 'CIMA' },
  { family: 'Finance', issuer: 'IMA', name: 'CMA' },
  { family: 'Finance', issuer: 'GARP', name: 'FRM' },
  { family: 'Finance', issuer: 'IIA', name: 'CIA (Internal Auditor)' },
  { family: 'Finance', issuer: 'CFP Board', name: 'CFP' },
  { family: 'Finance', issuer: 'IRS', name: 'EA (Enrolled Agent)' },

  // HR
  { family: 'HR', issuer: 'SHRM', name: 'SHRM-CP' },
  { family: 'HR', issuer: 'SHRM', name: 'SHRM-SCP' },
  { family: 'HR', issuer: 'HRCI', name: 'HRCI PHR' },
  { family: 'HR', issuer: 'HRCI', name: 'HRCI SPHR' },

  // Marketing
  { family: 'Marketing', issuer: 'Google', name: 'Google Ads' },
  { family: 'Marketing', issuer: 'Google', name: 'Google Analytics' },
  { family: 'Marketing', issuer: 'Google', name: 'Google Digital Marketing' },
  { family: 'Marketing', issuer: 'HubSpot', name: 'HubSpot Inbound Marketing' },
  { family: 'Marketing', issuer: 'HubSpot', name: 'HubSpot Content Marketing' },
  { family: 'Marketing', issuer: 'HubSpot', name: 'HubSpot Email Marketing' },
  { family: 'Marketing', issuer: 'Meta', name: 'Meta Blueprint' },
  { family: 'Marketing', issuer: 'LinkedIn', name: 'LinkedIn Marketing Labs' },
  { family: 'Marketing', issuer: 'Semrush', name: 'Semrush SEO' },
  { family: 'Marketing', issuer: 'Ahrefs', name: 'Ahrefs SEO' },
  { family: 'Marketing', issuer: 'Hootsuite', name: 'Hootsuite Social Marketing' },

  // Design
  { family: 'Design', issuer: 'Adobe', name: 'Adobe Certified Professional' },
  { family: 'Design', issuer: 'Adobe', name: 'Adobe Photoshop' },
  { family: 'Design', issuer: 'Adobe', name: 'Adobe Illustrator' },
  { family: 'Design', issuer: 'Adobe', name: 'Adobe InDesign' },
  { family: 'Design', issuer: 'Adobe', name: 'Adobe Premiere Pro' },
  { family: 'Design', issuer: 'Adobe', name: 'Adobe After Effects' },
  { family: 'Design', issuer: 'Figma', name: 'Figma Certification' },
  { family: 'Design', issuer: 'Autodesk', name: 'Autodesk AutoCAD' },
  { family: 'Design', issuer: 'Autodesk', name: 'Autodesk Revit' },
  { family: 'Design', issuer: 'Autodesk', name: 'Autodesk Fusion 360' },

  // QA / Testing
  { family: 'QA / Testing', issuer: 'ISTQB', name: 'ISTQB Foundation Level' },
  { family: 'QA / Testing', issuer: 'ISTQB', name: 'ISTQB Advanced Level' },
  { family: 'QA / Testing', issuer: 'ISTQB', name: 'ISTQB Test Manager' },
  { family: 'QA / Testing', issuer: 'Selenium', name: 'Certified Selenium Tester' },

  // Sales
  { family: 'Sales', issuer: 'Salesforce', name: 'Salesforce Sales Cloud' },
  { family: 'Sales', issuer: 'Salesforce', name: 'Salesforce Administrator' },
  { family: 'Sales', issuer: 'HubSpot', name: 'HubSpot Sales Software' },
  { family: 'Sales', issuer: 'Microsoft', name: 'Microsoft Dynamics 365 Sales' },

  // Healthcare
  { family: 'Healthcare', issuer: 'American Heart Association', name: 'Basic Life Support (BLS)' },
  { family: 'Healthcare', issuer: 'American Heart Association', name: 'Advanced Cardiac Life Support (ACLS)' },
  { family: 'Healthcare', issuer: 'American Heart Association', name: 'Pediatric Advanced Life Support (PALS)' },
  { family: 'Healthcare', issuer: 'AAMA', name: 'Certified Medical Assistant (CMA)' },
  { family: 'Healthcare', issuer: 'State Board of Nursing', name: 'Registered Nurse (RN)' },

  // Language
  { family: 'Language', issuer: 'British Council', name: 'IELTS' },
  { family: 'Language', issuer: 'ETS', name: 'TOEFL' },
  { family: 'Language', issuer: 'Cambridge Assessment English', name: 'Cambridge English (B2 First, C1 Advanced, C2 Proficiency)' },
  { family: 'Language', issuer: 'ETS', name: 'TOEIC' },
  { family: 'Language', issuer: 'Duolingo', name: 'Duolingo English Test' },
  { family: 'Language', issuer: 'Goethe-Institut', name: 'Goethe-Zertifikat' },
  { family: 'Language', issuer: 'France Education International', name: 'DELF' },
  { family: 'Language', issuer: 'France Education International', name: 'DALF' },
  { family: 'Language', issuer: 'Instituto Cervantes', name: 'DELE' },
  { family: 'Language', issuer: 'Japan Foundation', name: 'JLPT' },
  { family: 'Language', issuer: 'Hanban / Confucius Institute', name: 'HSK' },

  // Office & Business
  { family: 'Office & Business', issuer: 'Microsoft', name: 'Microsoft Office Specialist (MOS)' },
  { family: 'Office & Business', issuer: 'Microsoft', name: 'Microsoft Excel Expert' },
  { family: 'Office & Business', issuer: 'Microsoft', name: 'Microsoft Power Platform Fundamentals' },
  { family: 'Office & Business', issuer: 'Microsoft', name: 'Microsoft Power Platform Developer' },
  { family: 'Office & Business', issuer: 'Microsoft', name: 'Microsoft Dynamics 365' },
  { family: 'Office & Business', issuer: 'ICDL Foundation', name: 'ECDL / ICDL' },
];

export const FAMILY_NAMES = [...new Set(CERTIFICATION_CATALOG.map((c) => c.family))];
export const ISSUER_NAMES = [...new Set(CERTIFICATION_CATALOG.map((c) => c.issuer))].sort((a, b) => a.localeCompare(b));
// A few certifications (e.g. "Salesforce Administrator") are cross-listed
// under more than one family, so dedupe the flat name list.
export const CERTIFICATION_NAMES = [...new Set(CERTIFICATION_CATALOG.map((c) => c.name))];

export function getCertificationsFor({ issuer, family } = {}) {
  return CERTIFICATION_CATALOG.filter(
    (c) => (!issuer || c.issuer === issuer) && (!family || c.family === family)
  );
}

// Multi-value variant used by the search filter, where several issuers
// and/or families can be checked at once.
export function getCertificationNamesFor({ issuers = [], families = [] } = {}) {
  const names = CERTIFICATION_CATALOG.filter(
    (c) => (issuers.length === 0 || issuers.includes(c.issuer)) && (families.length === 0 || families.includes(c.family))
  ).map((c) => c.name);
  return [...new Set(names)];
}

export function findIssuer(issuerName) {
  return ISSUER_NAMES.find((i) => i.toLowerCase() === String(issuerName || '').trim().toLowerCase());
}

export function findCertificationFamily(certificationName) {
  return CERTIFICATION_CATALOG.find(
    (c) => c.name.toLowerCase() === String(certificationName || '').trim().toLowerCase()
  )?.family;
}

export function findCertificationIssuer(certificationName) {
  return CERTIFICATION_CATALOG.find(
    (c) => c.name.toLowerCase() === String(certificationName || '').trim().toLowerCase()
  )?.issuer;
}
