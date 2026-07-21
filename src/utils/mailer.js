import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendApprovalEmail = async (toEmail, studentName, proposalTitle, scheduleInfo) => {
  try {
    const info = await transporter.sendMail({
      from: `"UPPS Paramadina" <${process.env.SMTP_USER || 'no-reply@paramadina.ac.id'}>`,
      to: toEmail,
      subject: 'Persetujuan Pengajuan Sidang - UPPS Paramadina',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #1e40af; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0;">Persetujuan Pengajuan Sidang</h2>
          </div>
          <div style="padding: 20px;">
            <p>Halo, <strong>${studentName}</strong>,</p>
            <p>Selamat! Pengajuan sidang Anda dengan judul:</p>
            <blockquote style="background-color: #f9f9f9; border-left: 4px solid #1e40af; margin: 10px 0; padding: 10px; font-style: italic;">
              "${proposalTitle}"
            </blockquote>
            <p><strong>Telah disetujui secara final oleh Ketua Program Studi (Kaprodi).</strong></p>
            <br>
            <h3 style="color: #1e40af; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px;">Informasi Jadwal Sidang</h3>
            <ul style="list-style-type: none; padding: 0;">
              <li style="margin-bottom: 8px;">📅 <strong>Tanggal:</strong> ${new Date(scheduleInfo.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
              <li style="margin-bottom: 8px;">⏰ <strong>Waktu:</strong> ${scheduleInfo.jamMulai} - ${scheduleInfo.jamSelesai} WIB</li>
              <li style="margin-bottom: 8px;">📍 <strong>Media/Tempat:</strong> ${scheduleInfo.teknik === 'online' ? `Daring (Online)<br><a href="${scheduleInfo.linkMeeting || '#'}" style="display:inline-block; margin-top:4px; padding:6px 12px; background:#e0e7ff; color:#3730a3; text-decoration:none; border-radius:4px; font-size:13px; font-weight:bold;">🔗 Buka Link Meeting</a>` : `Tatap Muka (Offline) - Ruang: <strong>${scheduleInfo.ruang || 'Akan diinformasikan'}</strong>`}</li>
            </ul>

            <h3 style="color: #1e40af; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; margin-top: 20px;">Tim Penguji</h3>
            <ul style="padding-left: 20px;">
              ${(scheduleInfo.penguji || []).length > 0 
                ? scheduleInfo.penguji.map(p => `<li style="margin-bottom: 4px;"><strong>${p.nama}</strong> <span style="color:#666;">(${p.peran})</span></li>`).join('') 
                : '<li style="color:#666;">Belum ditentukan</li>'}
            </ul>
            <br>
            <p>Silakan *login* ke akun UPPS Anda untuk melihat rincian lebih lanjut.</p>
            <p style="margin-top: 30px;">Semoga sukses dalam persidangan Anda!</p>
            <p>Salam hangat,<br><strong>Tim UPPS Paramadina</strong></p>
          </div>
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            Email ini dikirim secara otomatis oleh sistem. Mohon tidak membalas email ini.
          </div>
        </div>
      `
    });

    console.log('✅ Email terkirim: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error mengirim email:', error);
    return false;
  }
};
