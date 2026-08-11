// Builds a simple printable CV document from a candidate profile and
// triggers a real browser download (no backend file storage exists yet,
// so the CV is generated on the fly from the data we already have).
const escapeHtml = (value) => String(value ?? '')
  ?.replace(/&/g, '&amp;')
  ?.replace(/</g, '&lt;')
  ?.replace(/>/g, '&gt;');

const buildCvHtml = (profile) => {
  const skills = profile?.skills?.map((skill) => `<span class="tag">${escapeHtml(skill)}</span>`)?.join('') || '';
  const workHistory = profile?.workHistory?.map((work) => `
    <div class="item">
      <b>${escapeHtml(work?.position)}</b>
      <span>${escapeHtml(work?.company)}</span>
      <small>${escapeHtml(work?.period)}</small>
    </div>
  `)?.join('') || '<p>No data available.</p>';

  const education = profile?.education
    ? `<div class="item"><b>${escapeHtml(profile?.education?.degree)}</b><span>${escapeHtml(profile?.education?.institution)}</span><small>${escapeHtml(profile?.education?.year)}</small></div>`
    : '<p>No data available.</p>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CV - ${escapeHtml(profile?.name)}</title>
<style>
  body { font-family: Arial, sans-serif; color: #0B1A2C; padding: 40px; max-width: 720px; margin: 0 auto; }
  h1 { margin-bottom: 2px; }
  h2 { font-size: 16px; border-bottom: 2px solid #E6A93C; padding-bottom: 6px; margin-top: 28px; }
  .role { color: #C98A1F; font-weight: 600; margin-bottom: 16px; }
  .meta { color: #566776; font-size: 14px; margin-bottom: 4px; }
  .tags { margin-top: 8px; }
  .tag { display: inline-block; background: #E8ECF0; border-radius: 6px; padding: 4px 10px; margin: 0 6px 6px 0; font-size: 13px; }
  .item { margin-bottom: 10px; }
  .item b { display: block; }
  .item span { color: #566776; }
  .item small { color: #8693A0; }
</style>
</head>
<body>
  <h1>${escapeHtml(profile?.name)}</h1>
  <div class="role">${escapeHtml(profile?.position)} · ${escapeHtml(profile?.company)}</div>
  <div class="meta">${escapeHtml(profile?.location)} · ${escapeHtml(profile?.experience)} years of experience</div>
  <div class="meta">${escapeHtml(profile?.email)} · ${escapeHtml(profile?.phone)}</div>

  <h2>Skills</h2>
  <div class="tags">${skills}</div>

  <h2>Work Experience</h2>
  ${workHistory}

  <h2>Education</h2>
  ${education}
</body>
</html>`;
};

export const printCandidateCv = (profile) => {
  const html = buildCvHtml(profile);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};

export const downloadCandidateCv = (profile) => {
  const html = buildCvHtml(profile);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `CV_${(profile?.name || 'candidate')?.replace(/\s+/g, '_')}.html`;
  document.body?.appendChild(link);
  link.click();
  document.body?.removeChild(link);

  URL.revokeObjectURL(url);
};
