import * as service from './proposal.service.js';
import * as userService from '../user/user.service.js';
import { handleResult } from '../../utils/handleResponse.js';
import { sendApprovalEmail } from '../../utils/mailer.js';
import fs from 'fs';
import path from 'path';

// ============================================
// 1. MAHASISWA: Buat Pengajuan
// ============================================
export async function createProposal(req, res, next) {
  try {
    const {
      jenis_sidang,
      nama,
      nim,
      program_studi,
      alamat,
      no_hp,
      email,
      judul_karya_akhir,
      ttd_pemohon
    } = req.body;

    if (!req.files || !req.files.file_draft_karya_akhir) {
      return res.status(400).json({
        success: false,
        error: 'Draft Karya Akhir wajib diupload'
      });
    }

    const data = {
      pemohonId: req.user.id,
      jenis_sidang,
      nama,
      nim,
      program_studi,
      alamat,
      no_hp,
      email,
      judul_karya_akhir,
      file_draft_karya_akhir: req.files.file_draft_karya_akhir[0].path,
      ttd_pemohon,
      status: 'menunggu',
      statusAdmin: 'menunggu',
      statusKaprodi: 'menunggu'
    };

    const result = await service.createProposal(data);

    await service.addLogToProposal(
      result.data._id,
      'Pemohon mengajukan sidang',
      req.user.id,
      'pemohon',
      `Judul: ${judul_karya_akhir}`
    );

    handleResult(res, result, 201);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 2. MAHASISWA: Lihat Proposal Saya
// ============================================
export async function getMyProposals(req, res, next) {
  try {
    const result = await service.getProposalsByPemohon(req.user.id);
    handleResult(res, result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 3. DOSEN PEMBIMBING: Lihat Pending
// ============================================
export async function getPendingDospem(req, res, next) {
  try {
    const result = await service.getPendingDospem();
    handleResult(res, result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 4. DOSEN PEMBIMBING: Approve
// ============================================
export async function approveDospem(req, res, next) {
  try {
    const { id } = req.params;
    const { ttd_dosen, catatan } = req.body;

    if (!ttd_dosen) {
      return res.status(400).json({
        success: false,
        error: 'Tanda tangan Dosen Pembimbing wajib diisi'
      });
    }

    const proposalResult = await service.getProposalById(id);
    if (!proposalResult.success) {
      return res.status(404).json(proposalResult);
    }

    const proposal = proposalResult.data;

    if (proposal.status !== 'menunggu') {
      return res.status(400).json({
        success: false,
        error: `Status saat ini ${proposal.status}, tidak bisa disetujui`
      });
    }

    const updateData = {
      dosenPembimbingId: req.user.id,
      dosenPembimbing: req.user.name,
      ttd_dosen,
      tanggalTandatangan: new Date(),
      catatanDospem: catatan || 'Disetujui oleh Dosen Pembimbing',
      status: 'ditandatangani'
    };

    const result = await service.updateProposal(id, updateData);

    await service.addLogToProposal(
      id,
      'Dosen Pembimbing menyetujui proposal',
      req.user.id,
      'dosen_pembimbing',
      catatan || 'Disetujui'
    );

    handleResult(res, result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 5. DOSEN PEMBIMBING: Reject
// ============================================
export async function rejectDospem(req, res, next) {
  try {
    const { id } = req.params;
    const { catatan } = req.body;

    if (!catatan) {
      return res.status(400).json({
        success: false,
        error: 'Catatan penolakan wajib diisi'
      });
    }

    const proposalResult = await service.getProposalById(id);
    if (!proposalResult.success) {
      return res.status(404).json(proposalResult);
    }

    const proposal = proposalResult.data;

    if (proposal.status !== 'menunggu') {
      return res.status(400).json({
        success: false,
        error: `Status saat ini ${proposal.status}, tidak bisa ditolak`
      });
    }

    const updateData = {
      dosenPembimbingId: req.user.id,
      dosenPembimbing: req.user.name,
      status: 'ditolak',
      catatanDospem: catatan
    };

    const result = await service.updateProposal(id, updateData);

    await service.addLogToProposal(
      id,
      'Dosen Pembimbing menolak proposal',
      req.user.id,
      'dosen_pembimbing',
      catatan
    );

    handleResult(res, result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 6. ADMIN: Lihat Pending
// ============================================
export async function getPendingAdmin(req, res, next) {
  try {
    const result = await service.getPendingAdmin();
    handleResult(res, result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 7. ADMIN: Jadwalkan Sidang
// ============================================
export async function scheduleByAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const { jadwal } = req.body;

    if (!jadwal || !jadwal.tanggal || !jadwal.jamMulai || !jadwal.jamSelesai || !jadwal.teknik || !jadwal.penguji) {
      return res.status(400).json({
        success: false,
        error: 'Jadwal sidang tidak lengkap'
      });
    }

    const proposalResult = await service.getProposalById(id);
    if (!proposalResult.success) {
      return res.status(404).json(proposalResult);
    }

    const proposal = proposalResult.data;

    const updateData = {
      adminId: req.user.id,
      jadwal: {
        ...jadwal,
        tanggal: new Date(jadwal.tanggal)
      },
      statusAdmin: 'terjadwal',
      statusKaprodi: 'menunggu',
      alasanTolakKaprodi: '',
      ttd_kaprodi: null,
      signedAtKaprodi: null
    };

    const result = await service.updateProposal(id, updateData);

    await service.addLogToProposal(
      id,
      'Admin menjadwalkan sidang',
      req.user.id,
      'admin',
      `Tanggal: ${jadwal.tanggal}`
    );

    handleResult(res, result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 7.5. ADMIN: Tolak Sidang
// ============================================
export async function rejectByAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const { alasan } = req.body;

    if (!alasan) {
      return res.status(400).json({
        success: false,
        error: 'Alasan penolakan wajib diisi'
      });
    }

    const proposalResult = await service.getProposalById(id);
    if (!proposalResult.success) {
      return res.status(404).json(proposalResult);
    }

    const proposal = proposalResult.data;

    if (proposal.statusAdmin !== 'menunggu') {
      return res.status(400).json({
        success: false,
        error: `Status admin saat ini ${proposal.statusAdmin}, tidak bisa ditolak`
      });
    }

    const updateData = {
      adminId: req.user.id,
      statusAdmin: 'ditolak',
      alasanTolak: alasan
    };

    const result = await service.updateProposal(id, updateData);

    await service.addLogToProposal(
      id,
      'Admin menolak pengajuan',
      req.user.id,
      'admin',
      alasan
    );

    handleResult(res, result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 8. KAPRODI: Lihat Pending
// ============================================
export async function getPendingKaprodi(req, res, next) {
  try {
    const result = await service.getPendingKaprodi();
    handleResult(res, result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 9. KAPRODI: Approve Final
// ============================================
export async function approveKaprodi(req, res, next) {
  try {
    const { id } = req.params;
    const { ttd_kaprodi } = req.body;

    if (!ttd_kaprodi) {
      return res.status(400).json({
        success: false,
        error: 'Tanda tangan Kaprodi wajib diisi'
      });
    }

    const proposalResult = await service.getProposalById(id);
    if (!proposalResult.success) {
      return res.status(404).json(proposalResult);
    }

    const proposal = proposalResult.data;

    if (proposal.statusKaprodi !== 'menunggu') {
      return res.status(400).json({
        success: false,
        error: `Status Kaprodi saat ini ${proposal.statusKaprodi}, tidak bisa disetujui`
      });
    }

    const updateData = {
      kaprodiId: req.user.id,
      ttd_kaprodi,
      signedAtKaprodi: new Date(),
      statusKaprodi: 'disetujui'
    };

    const result = await service.updateProposal(id, updateData);

    await service.addLogToProposal(
      id,
      'Kaprodi menyetujui final',
      req.user.id,
      'kaprodi',
      'Disetujui'
    );

    // Kirim notifikasi email secara asinkron
    if (proposal.email && proposal.jadwal) {
      sendApprovalEmail(
        proposal.email,
        proposal.nama,
        proposal.judul_karya_akhir,
        proposal.jadwal
      );
    }

    handleResult(res, result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 10. KAPRODI: Reject
// ============================================
export async function rejectKaprodi(req, res, next) {
  try {
    const { id } = req.params;
    const { alasan } = req.body;

    if (!alasan) {
      return res.status(400).json({
        success: false,
        error: 'Alasan penolakan wajib diisi'
      });
    }

    const proposalResult = await service.getProposalById(id);
    if (!proposalResult.success) {
      return res.status(404).json(proposalResult);
    }

    const proposal = proposalResult.data;

    if (proposal.statusKaprodi !== 'menunggu') {
      return res.status(400).json({
        success: false,
        error: `Status Kaprodi saat ini ${proposal.statusKaprodi}, tidak bisa ditolak`
      });
    }

    const updateData = {
      kaprodiId: req.user.id,
      statusKaprodi: 'ditolak',
      alasanTolakKaprodi: alasan,
      signedAtKaprodi: new Date()
    };

    const result = await service.updateProposal(id, updateData);

    await service.addLogToProposal(
      id,
      'Kaprodi menolak proposal',
      req.user.id,
      'kaprodi',
      alasan
    );

    handleResult(res, result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 11. DETAIL PROPOSAL
// ============================================
export async function getProposalDetail(req, res, next) {
  try {
    const { id } = req.params;
    const result = await service.getProposalById(id);
    handleResult(res, result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 12. SEMUA PROPOSAL
// ============================================
export async function getAllProposals(req, res, next) {
  try {
    const { statusKaprodi, nim, nama } = req.query;
    const filter = {};

    if (req.user.role === 'dosen_pembimbing') {
      filter.dosenPembimbingId = req.user.id;
    }

    if (statusKaprodi) filter.statusKaprodi = statusKaprodi;
    if (nim) filter.nim = nim;
    if (nama) filter.nama = { $regex: nama, $options: 'i' };

    const result = await service.getAllProposals(filter);
    handleResult(res, result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 13. ADMIN: Delete Proposal
// ============================================
export async function deleteProposalByAdmin(req, res, next) {
  try {
    const { id } = req.params;

    // Ambil data dulu untuk dapatkan path file
    const proposalResult = await service.getProposalById(id);
    if (!proposalResult.success) {
      return res.status(404).json(proposalResult);
    }
    const proposal = proposalResult.data;

    // Hapus dari database
    const deleteResult = await service.deleteProposal(id);
    if (!deleteResult.success) {
      return res.status(400).json(deleteResult);
    }

    // Hapus file draft PDF jika ada
    if (proposal.file_draft_karya_akhir) {
      const fileUrl = proposal.file_draft_karya_akhir;
      try {
        if (fileUrl.includes('cloudinary.com')) {
          // Ekstrak public_id dari URL Cloudinary
          // Contoh URL: https://res.cloudinary.com/cloud_name/image/upload/v123456/upps_drafts/draft-12345.pdf
          const parts = fileUrl.split('/');
          const filenameWithExt = parts.pop();
          const folder = parts.pop();
          const public_id = `${folder}/${filenameWithExt.split('.')[0]}`;

          if (process.env.CLOUDINARY_CLOUD_NAME) {
            const { v2: cloudinary } = await import('cloudinary');
            cloudinary.config({
              cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
              api_key: process.env.CLOUDINARY_API_KEY,
              api_secret: process.env.CLOUDINARY_API_SECRET
            });
            // Hapus dari Cloudinary
            await cloudinary.uploader.destroy(public_id, { resource_type: 'image' });
          }
        } else {
          // File lokal
          const fullPath = path.resolve(fileUrl);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }
      } catch (fileErr) {
        console.error('Gagal menghapus file draft:', fileErr);
        // Tetap lanjut meskipun file gagal dihapus
      }
    }

    res.json({
      success: true,
      message: 'Data pengajuan dan file terkait berhasil dihapus permanen'
    });
  } catch (error) {
    next(error);
  }
}