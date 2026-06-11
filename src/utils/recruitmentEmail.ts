const WHATSAPP_LINKS: Record<string, string> = {
  'Content Team': 'https://chat.whatsapp.com/JeCUs8HzOc6L9anGKr3f6I',
  'Collaboration and Outreach Team':
    'https://chat.whatsapp.com/Dc8Pexw1yhCFEeoZh3ZHEn',
  'Curation X Startup Team': 'https://chat.whatsapp.com/JTxF7HNShWXBRv6Al4hXAa',
  'Marketing Team': 'https://chat.whatsapp.com/LW1DR3Weep5CYhqojcj9N7',
  'Publicity Team': 'https://chat.whatsapp.com/C4r6RglmohoEZpQf16ZdPY',
  'Design Team': 'https://chat.whatsapp.com/CyaYm2AcUVcLKzPJvQ8iao',
  'Event Management Team': 'https://chat.whatsapp.com/LjQiecGgYSy7YYGn0PrVFB',
  'Videography Team': 'https://chat.whatsapp.com/D8GT8YkKvKaFvHo6cvx5Dc',
  Tech: 'https://chat.whatsapp.com/DD2XXKBK1jLKbD4zfwNpfM?s=cl&p=i&ilr=2',
};

const ECELL_LOGO =
  'https://res.cloudinary.com/ecell/image/upload/v1762102444/ecell-logo-bw2_sayvqp_htrv0f.png';

interface RecruitmentEmailData {
  name: string;
  type: 'TECH' | 'OTHER';
  techDomain?: string;
  taskSelection?: string;
  teamSelection?: string[];
  scholarId: string;
  email: string;
}

export const getRecruitmentEmailHtml = (data: RecruitmentEmailData): string => {
  const typeLabel =
    data.type === 'TECH'
      ? `Tech Team — ${data.techDomain || 'Web'} Domain`
      : 'Management & Creatives';

  const teamDetails =
    data.type === 'OTHER' && data.teamSelection?.length
      ? `<tr><td style="padding:12px 16px;color:#888888;font-size:13px;border-bottom:1px solid #222222;">Teams Applied</td><td style="padding:12px 16px;color:#ffffff;font-size:13px;border-bottom:1px solid #222222;text-align:right;">${data.teamSelection.join(', ')}</td></tr>`
      : '';

  const taskDetails =
    data.type === 'TECH' && data.taskSelection
      ? `<tr><td style="padding:12px 16px;color:#888888;font-size:13px;border-bottom:1px solid #222222;">Task Selected</td><td style="padding:12px 16px;color:#ffffff;font-size:13px;border-bottom:1px solid #222222;text-align:right;">${data.taskSelection.replace(/_/g, ' ')}</td></tr>`
      : '';

  let whatsappButtons = '';
  if (data.type === 'TECH') {
    whatsappButtons = `
      <div style="margin:16px 0;text-align:center;">
        <a href="${WHATSAPP_LINKS['Tech']}"
          style="background-color:#ffffff;color:#000000;text-decoration:none;padding:16px 32px;border-radius:12px;display:inline-block;font-weight:500;font-size:15px;letter-spacing:0.3px;">
          Join Tech WhatsApp Group
        </a>
      </div>
    `;
  } else if (data.teamSelection && data.teamSelection.length > 0) {
    whatsappButtons = data.teamSelection
      .map(team => {
        const link = WHATSAPP_LINKS[team] || WHATSAPP_LINKS['Tech'];
        return `
        <div style="margin:16px 0;text-align:center;">
          <a href="${link}"
            style="background-color:#ffffff;color:#000000;text-decoration:none;padding:16px 32px;border-radius:12px;display:inline-block;font-weight:500;font-size:15px;letter-spacing:0.3px;">
            Join ${team} Group
          </a>
        </div>
      `;
      })
      .join('');
  }

  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>E-Cell Recruitment</title>
  </head>
  <body style="margin:0;padding:0;background-color:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="max-width:600px;margin:40px auto;background-color:#111111;border-radius:16px;overflow:hidden;border:1px solid #222222;">

      <!-- HEADER -->
      <tr>
        <td style="text-align:center;padding:48px 24px 32px 24px;border-bottom:1px solid #222222;">
          <img src="${ECELL_LOGO}" alt="E-Cell NIT Silchar" width="48" style="margin-bottom:16px;" />
          <h2 style="color:#ffffff;margin:0;font-size:20px;font-weight:500;letter-spacing:0.5px;">E-Cell NIT Silchar</h2>
          <p style="color:#888888;margin:8px 0 0;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Recruitment 2026</p>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:40px 32px;color:#e5e5e5;">
          <h3 style="color:#ffffff;margin:0 0 24px 0;font-size:24px;font-weight:400;">Application Received</h3>
          <p style="margin:0 0 16px 0;line-height:1.6;color:#a3a3a3;font-size:15px;">
            Dear <strong style="color:#ffffff;font-weight:500;">${data.name}</strong>,
          </p>
          <p style="margin:0 0 32px 0;line-height:1.6;color:#a3a3a3;font-size:15px;">
            Thank you for applying to E-Cell NIT Silchar. We have successfully received your application. We will review your profile and get back to you soon.
          </p>

          <!-- APPLICATION SUMMARY -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;background-color:#171717;border-radius:12px;border:1px solid #282828;">
            <tr>
              <td style="padding:12px 16px;color:#888888;font-size:13px;border-bottom:1px solid #222222;">Name</td>
              <td style="padding:12px 16px;color:#ffffff;font-size:13px;border-bottom:1px solid #222222;text-align:right;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#888888;font-size:13px;border-bottom:1px solid #222222;">Email</td>
              <td style="padding:12px 16px;color:#ffffff;font-size:13px;border-bottom:1px solid #222222;text-align:right;">${data.email}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#888888;font-size:13px;border-bottom:1px solid #222222;">Scholar ID</td>
              <td style="padding:12px 16px;color:#ffffff;font-size:13px;border-bottom:1px solid #222222;text-align:right;">${data.scholarId}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#888888;font-size:13px;border-bottom:1px solid #222222;">Applied For</td>
              <td style="padding:12px 16px;color:#ffffff;font-size:13px;border-bottom:1px solid #222222;text-align:right;">${typeLabel}</td>
            </tr>
            ${taskDetails}
            ${teamDetails}
          </table>

          <p style="margin:0 0 24px 0;line-height:1.6;color:#a3a3a3;font-size:15px;">
            In the meanwhile, please join the WhatsApp group(s) for your selected domains for further updates and announcements.
          </p>

          <!-- WHATSAPP CTAs -->
          <div style="margin:32px 0 16px 0;text-align:center;">
            ${whatsappButtons}
          </div>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background-color:#0a0a0a;padding:32px;text-align:center;border-top:1px solid #222222;">
          <p style="margin:0 0 16px 0;color:#666666;font-size:13px;">E-Cell NIT Silchar. All rights reserved.</p>
          <div>
            <a href="https://www.instagram.com/ecell.nitsilchar" style="margin:0 12px;text-decoration:none;color:#888888;font-size:13px;">Instagram</a>
            <a href="https://www.linkedin.com/company/ecell-nit-silchar" style="margin:0 12px;text-decoration:none;color:#888888;font-size:13px;">LinkedIn</a>
            <a href="https://www.facebook.com/ecell.nit.silchar/" style="margin:0 12px;text-decoration:none;color:#888888;font-size:13px;">Facebook</a>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export const RECRUITMENT_EMAIL_SUBJECT =
  'Application for joining E-cell NIT Silchar';
