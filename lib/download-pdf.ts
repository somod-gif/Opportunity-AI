import type { DocumentType } from "@/lib/ai/prompts";

const typeLabels: Record<DocumentType, string> = {
  "cover-letter": "Cover Letter",
  "personal-statement": "Personal Statement",
  "checklist": "Application Checklist",
  "resume": "Resume",
};

export async function downloadPdf(content: string, title: string, type: DocumentType) {
  const { default: html2pdf } = await import("html2pdf.js");

  const styled = `
    <div style="
      font-family: 'Times New Roman', Times, serif;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm 25mm;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
    ">
      ${markdownToHtml(content)}
    </div>
  `;

  const el = document.createElement("div");
  el.innerHTML = styled;
  el.style.position = "absolute";
  el.style.left = "-9999px";
  el.style.top = "0";
  document.body.appendChild(el);

  const filename = `${title.replace(/\s+/g, "-")}-${typeLabels[type]}.pdf`;

  try {
    await html2pdf()
      .set({
        margin: 0,
        filename,
        image: { type: "jpeg", quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
      })
      .from(el)
      .save();
  } finally {
    document.body.removeChild(el);
  }
}

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let inList = false;

  for (const line of lines) {
    const h1 = line.match(/^# (.+)/);
    if (h1) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h1 style="font-size:18pt;font-weight:700;margin:0 0 12pt;text-align:center;">${escapeHtml(h1[1])}</h1>`);
      continue;
    }

    const h2 = line.match(/^## (.+)/);
    if (h2) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h2 style="font-size:14pt;font-weight:600;margin:16pt 0 8pt;border-bottom:1px solid #ccc;padding-bottom:4pt;">${escapeHtml(h2[1])}</h2>`);
      continue;
    }

    const h3 = line.match(/^### (.+)/);
    if (h3) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h3 style="font-size:12pt;font-weight:600;margin:12pt 0 6pt;">${escapeHtml(h3[1])}</h3>`);
      continue;
    }

    const checklist = line.match(/^- \[( |x)\] (.+)/);
    if (checklist) {
      if (!inList) { html.push('<ul style="padding-left:20pt;margin:6pt 0;">'); inList = true; }
      const checked = checklist[1] === "x";
      html.push(`<li style="margin-bottom:4pt;list-style:none;">
        <span style="margin-right:6pt;">${checked ? "☑" : "☐"}</span>
        <span style="${checked ? "text-decoration:line-through;color:#888;" : ""}">${escapeHtml(checklist[2])}</span>
      </li>`);
      continue;
    }

    const bullet = line.match(/^- (.+)/);
    if (bullet) {
      if (!inList) { html.push('<ul style="padding-left:20pt;margin:6pt 0;">'); inList = true; }
      html.push(`<li style="margin-bottom:4pt;">${escapeHtml(bullet[1])}</li>`);
      continue;
    }

    const numbered = line.match(/^\d+\. (.+)/);
    if (numbered) {
      if (!inList) { html.push('<ol style="padding-left:20pt;margin:6pt 0;">'); inList = true; }
      html.push(`<li style="margin-bottom:4pt;">${escapeHtml(numbered[1])}</li>`);
      continue;
    }

    if (inList) {
      if (line.match(/^(<\/?ul|<\/?ol)/)) continue;
      const listEnd = line.trim() === "";
      if (listEnd) {
        if (html[html.length - 1]?.startsWith("<ul")) { html.push("</ul>"); }
        else if (html[html.length - 1]?.startsWith("<ol")) { html.push("</ol>"); }
        inList = false;
        continue;
      }
    }

    if (line.trim() === "") {
      html.push('<div style="height:8pt;"></div>');
      continue;
    }

    html.push(`<p style="margin:0 0 6pt;text-align:justify;">${escapeHtml(line)}</p>`);
  }

  if (inList) {
    html.push("</ul>");
  }

  return html.join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}
