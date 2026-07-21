const express = require('express');
const router = express.Router();
const axios = require('axios');
const { isAuthenticated, isRole } = require('../middleware/auth');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

function getAxiosConfig(req) {
  return {
    headers: {
      Cookie: req.session.user?.backendCookie || ''
    }
  };
}

// ============ PEMOHON ROUTES ============

// Dashboard Pemohon
router.get('/pemohon', isAuthenticated, isRole(['pemohon', 'mahasiswa']), async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/proposal/me`, getAxiosConfig(req));
    const proposals = response.data?.data || [];
    
    res.render('dashboard/pemohon', { 
      title: 'Dashboard Pemohon',
      user: req.session.user,
      currentPath: req.path,
      proposals
    });
  } catch (error) {
    console.error('Error fetching pemohon dashboard:', error.message);
    res.render('dashboard/pemohon', { title: 'Dashboard Pemohon', user: req.session.user, currentPath: req.path, proposals: [] });
  }
});

// Data Management Pemohon
router.get('/pemohon/data-management', isAuthenticated, isRole(['pemohon', 'mahasiswa']), async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/proposal/me`, getAxiosConfig(req));
    const proposals = response.data?.data || [];

    res.render('dashboard/pemohon/data_management', {
      title: 'Data Management',
      user: req.session.user,
      currentPath: req.path,
      proposals
    });
  } catch (error) {
    res.render('dashboard/pemohon/data_management', { title: 'Data Management', user: req.session.user, currentPath: req.path, proposals: [] });
  }
});

// ============ ADMIN ROUTES ============

// Dashboard Admin
router.get('/admin', isAuthenticated, isRole(['admin']), async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/proposal/admin/pending`, getAxiosConfig(req));
    const pendingList = response.data?.data || [];
    
    res.render('dashboard/admin', { 
      title: 'Dashboard Admin',
      user: req.session.user,
      currentPath: req.path,
      pendingList
    });
  } catch (error) {
    res.render('dashboard/admin', { title: 'Dashboard Admin', user: req.session.user, currentPath: req.path, pendingList: [] });
  }
});

// Kelola Pengajuan Admin
router.get('/admin/kelola-pengajuan', isAuthenticated, isRole(['admin']), async (req, res) => {
  const backendBaseUrl = BACKEND_URL.replace('/api', '');
  try {
    const pendingRes = await axios.get(`${BACKEND_URL}/proposal/admin/pending`, getAxiosConfig(req));
    const pendingList = pendingRes.data?.data || [];

    const allRes = await axios.get(`${BACKEND_URL}/proposal`, getAxiosConfig(req));
    const riwayatList = allRes.data?.data || [];

    res.render('dashboard/admin/kelola-pengajuan', {
      title: 'Kelola Pengajuan',
      user: req.session.user,
      currentPath: req.path,
      pendingList,
      riwayatList,
      backendBaseUrl
    });
  } catch (error) {
    res.render('dashboard/admin/kelola-pengajuan', { title: 'Kelola Pengajuan', user: req.session.user, currentPath: req.path, pendingList: [], riwayatList: [], backendBaseUrl });
  }
});

// Data Management Admin
router.get('/admin/data-management', isAuthenticated, isRole(['admin']), async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/proposal`, getAxiosConfig(req));
    const allList = response.data?.data || [];

    res.render('dashboard/admin/data_management', {
      title: 'Data Management Admin',
      user: req.session.user,
      currentPath: req.path,
      allList
    });
  } catch (error) {
    res.render('dashboard/admin/data_management', { title: 'Data Management Admin', user: req.session.user, currentPath: req.path, allList: [] });
  }
});

// Submit: Jadwalkan (Admin)
router.post('/admin/kelola-pengajuan/:id/jadwalkan', isAuthenticated, isRole(['admin']), async (req, res) => {
  let { tanggal, jam_mulai, jam_selesai, teknik, ruang, link_meeting } = req.body;
  let penguji_nama = req.body['penguji_nama[]'] || req.body.penguji_nama || [];
  let penguji_peran = req.body['penguji_peran[]'] || req.body.penguji_peran || [];
  
  // Normalize to arrays (Express sends string for single values)
  if (!Array.isArray(penguji_nama)) penguji_nama = [penguji_nama];
  if (!Array.isArray(penguji_peran)) penguji_peran = [penguji_peran];

  // Format penguji
  const penguji = [];
  for (let i = 0; i < penguji_nama.length; i++) {
    if (penguji_nama[i] && penguji_nama[i].trim() !== '') {
      penguji.push({
        nama: penguji_nama[i],
        peran: penguji_peran[i] || 'Anggota'
      });
    }
  }

  const payload = {
    jadwal: {
      tanggal,
      jamMulai: jam_mulai,
      jamSelesai: jam_selesai,
      teknik,
      ruang: teknik === 'offline' ? ruang : '',
      linkMeeting: teknik === 'online' ? link_meeting : '',
      penguji
    }
  };

  try {
    await axios.put(`${BACKEND_URL}/proposal/${req.params.id}/schedule`, payload, getAxiosConfig(req));
    req.flash('success_msg', 'Sidang berhasil dijadwalkan.');
    res.redirect('/dashboard/admin/kelola-pengajuan');
  } catch (error) {
    req.flash('error_msg', error.response?.data?.error || 'Terjadi kesalahan saat menjadwalkan.');
    res.redirect('/dashboard/admin/kelola-pengajuan');
  }
});

// Submit: Tolak (Admin)
router.post('/admin/kelola-pengajuan/:id/tolak', isAuthenticated, isRole(['admin']), async (req, res) => {
  const { alasan } = req.body;
  if (!alasan) {
    req.flash('error_msg', 'Alasan penolakan wajib diisi.');
    return res.redirect('/dashboard/admin/kelola-pengajuan');
  }

  try {
    await axios.put(`${BACKEND_URL}/proposal/${req.params.id}/reject-admin`, { alasan }, getAxiosConfig(req));
    req.flash('success_msg', 'Pengajuan berhasil ditolak.');
    res.redirect('/dashboard/admin/kelola-pengajuan');
  } catch (error) {
    req.flash('error_msg', error.response?.data?.error || 'Terjadi kesalahan');
    res.redirect('/dashboard/admin/kelola-pengajuan');
  }
});

// Delete Pengajuan (Admin)
router.delete('/admin/kelola-pengajuan/:id', isAuthenticated, isRole(['admin']), async (req, res) => {
  try {
    await axios.delete(`${BACKEND_URL}/proposal/${req.params.id}`, getAxiosConfig(req));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.error || 'Terjadi kesalahan' });
  }
});

// ============ DOSEN PEMBIMBING ROUTES ============

// Dashboard Dosen Pembimbing
router.get('/dosen', isAuthenticated, isRole(['dosen_pembimbing']), (req, res) => {
  res.render('dashboard/dosen', {
    title: 'Dashboard Dosen Pembimbing',
    user: req.session.user,
    currentPath: req.path
  });
});

// Pengajuan Menunggu Tanda Tangan (daftar)
router.get('/dosen/pengajuan', isAuthenticated, isRole(['dosen_pembimbing']), async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/proposal/dospem/pending`, getAxiosConfig(req));
    const pengajuanList = response.data?.data || [];

    res.render('dashboard/dosen/pengajuan', {
      title: 'Pengajuan Menunggu Tanda Tangan',
      user: req.session.user,
      currentPath: req.path,
      pengajuanList,
    });
  } catch (error) {
    res.render('dashboard/dosen/pengajuan', { title: 'Pengajuan Menunggu Tanda Tangan', user: req.session.user, currentPath: req.path, pengajuanList: [] });
  }
});

// Detail Pengajuan -> halaman tanda tangan
router.get('/dosen/pengajuan/:id/detail', isAuthenticated, isRole(['dosen_pembimbing']), async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/proposal/${req.params.id}`, getAxiosConfig(req));
    const pengajuan = response.data?.data;

    if (!pengajuan) return res.status(404).render('404', { title: 'Page Not Found' });

    res.render('dashboard/dosen/pengajuan_detail', {
      title: 'Tanda Tangani Pengajuan',
      user: req.session.user,
      currentPath: req.path,
      pengajuan,
    });
  } catch (error) {
    return res.status(404).render('404', { title: 'Page Not Found' });
  }
});

// Submit tanda tangan dosen
router.post('/dosen/pengajuan/:id/tanda-tangan', isAuthenticated, isRole(['dosen_pembimbing']), async (req, res) => {
  const { ttd_dosen } = req.body;

  if (!ttd_dosen) {
    req.flash('error_msg', 'Tanda tangan wajib diisi.');
    return res.redirect(`/dashboard/dosen/pengajuan/${req.params.id}/detail`);
  }

  try {
    await axios.put(`${BACKEND_URL}/proposal/${req.params.id}/approve-dospem`, { ttd_dosen }, getAxiosConfig(req));
    res.redirect('/dashboard/dosen/pengajuan');
  } catch (error) {
    req.flash('error_msg', error.response?.data?.error || 'Terjadi kesalahan');
    return res.redirect(`/dashboard/dosen/pengajuan/${req.params.id}/detail`);
  }
});

// Tolak oleh Dosen
router.post('/dosen/pengajuan/:id/tolak', isAuthenticated, isRole(['dosen_pembimbing']), async (req, res) => {
  const { catatanDospem } = req.body;
  try {
    await axios.put(`${BACKEND_URL}/proposal/${req.params.id}/reject-dospem`, { catatan: catatanDospem }, getAxiosConfig(req));
    req.flash('success_msg', 'Pengajuan berhasil ditolak.');
    res.redirect('/dashboard/dosen/riwayat');
  } catch (error) {
    req.flash('error_msg', error.response?.data?.error || 'Terjadi kesalahan saat menolak pengajuan.');
    return res.redirect('/dashboard/dosen/pengajuan');
  }
});

// Riwayat Persetujuan Dosen Pembimbing
router.get('/dosen/riwayat', isAuthenticated, isRole(['dosen_pembimbing']), async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/proposal`, getAxiosConfig(req));
    let riwayatList = response.data?.data || [];
    
    // Filter out waiting ones locally in case API returns all assigned
    riwayatList = riwayatList.filter(p => p.status !== 'menunggu');

    res.render('dashboard/dosen/riwayat', {
      title: 'Riwayat Persetujuan',
      user: req.session.user,
      currentPath: req.path,
      riwayatList,
    });
  } catch (error) {
    res.render('dashboard/dosen/riwayat', { title: 'Riwayat Persetujuan', user: req.session.user, currentPath: req.path, riwayatList: [] });
  }
});

// ============ KAPRODI ROUTES ============

router.get('/kaprodi', isAuthenticated, isRole(['kaprodi']), async (req, res) => {
  const { tab, status } = req.query;
  const activeTab = tab === 'riwayat' ? 'riwayat' : 'menunggu';

  try {
    const [menungguRes, allRes] = await Promise.all([
      axios.get(`${BACKEND_URL}/proposal/kaprodi/pending`, getAxiosConfig(req)),
      axios.get(`${BACKEND_URL}/proposal`, getAxiosConfig(req))
    ]);

    const daftarMenunggu = menungguRes.data?.data || [];
    let riwayatList = allRes.data?.data || [];

    // Filter status for riwayat
    riwayatList = riwayatList.filter((p) => p.statusKaprodi === 'disetujui' || p.statusKaprodi === 'ditolak');

    if (status === 'disetujui' || status === 'ditolak') {
      riwayatList = riwayatList.filter((p) => p.statusKaprodi === status);
    }

    riwayatList = riwayatList.map((p) => ({
      ...p,
      tanggalKeputusanFormatted: p.signedAtKaprodi
        ? new Date(p.signedAtKaprodi).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
        : '-',
    }));

    res.render('dashboard/kaprodi', {
      title: 'Dashboard Kaprodi',
      user: req.session.user,
      currentPath: req.path,
      activeTab,
      daftarMenunggu,
      riwayatList,
      filterStatus: status,
    });
  } catch (error) {
    res.render('dashboard/kaprodi', { title: 'Dashboard Kaprodi', user: req.session.user, currentPath: req.path, activeTab, daftarMenunggu: [], riwayatList: [], filterStatus: status });
  }
});

// Riwayat Persetujuan (Kaprodi)
router.get('/kaprodi/riwayat', isAuthenticated, isRole(['kaprodi']), async (req, res) => {
  const { tab = 'riwayat', status } = req.query;
  const activeTab = tab === 'menunggu' ? 'menunggu' : 'riwayat';

  try {
    const [menungguRes, allRes] = await Promise.all([
      axios.get(`${BACKEND_URL}/proposal/kaprodi/pending`, getAxiosConfig(req)),
      axios.get(`${BACKEND_URL}/proposal`, getAxiosConfig(req))
    ]);

    // Format daftarMenunggu
    const daftarMenungguRaw = menungguRes.data?.data || [];
    const daftarMenunggu = daftarMenungguRaw.map(p => ({
      ...p,
      nama: p.nama || (p.pemohonId ? p.pemohonId.name : '-'),
      nim: p.nim || (p.pemohonId && p.pemohonId.profile ? p.pemohonId.profile.nim : '-'),
      program_studi: p.program_studi || (p.pemohonId && p.pemohonId.profile ? p.pemohonId.profile.programStudi : '-'),
      dosenPembimbing: p.dosenPembimbingId ? p.dosenPembimbingId.name : (p.dosenPembimbing || '-'),
      jenisSidangLabel: p.jenis_sidang === 'seminar_proposal' ? 'Seminar Proposal' : (p.jenis_sidang === 'kolokium' ? 'Kolokium' : (p.jenis_karya || '-')),
    }));

    // Format riwayatList
    let riwayatList = allRes.data?.data || [];
    riwayatList = riwayatList.filter(p => p.statusKaprodi === 'disetujui' || p.statusKaprodi === 'ditolak');
    riwayatList = riwayatList.map(p => ({
      ...p,
      nama: p.nama || (p.pemohonId ? p.pemohonId.name : '-'),
      nim: p.nim || (p.pemohonId && p.pemohonId.profile ? p.pemohonId.profile.nim : '-'),
      program_studi: p.program_studi || (p.pemohonId && p.pemohonId.profile ? p.pemohonId.profile.programStudi : '-'),
      dosenPembimbing: p.dosenPembimbingId ? p.dosenPembimbingId.name : (p.dosenPembimbing || '-'),
      jenisSidangLabel: p.jenis_sidang === 'seminar_proposal' ? 'Seminar Proposal' : (p.jenis_sidang === 'kolokium' ? 'Kolokium' : (p.jenis_karya || '-')),
      tanggalKeputusanFormatted: p.signedAtKaprodi
        ? new Date(p.signedAtKaprodi).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
        : '-',
    }));

    res.render('dashboard/kaprodi/riwayat', {
      title: 'Riwayat Persetujuan Kaprodi',
      user: req.session.user,
      currentPath: req.path,
      activeTab,
      daftarMenunggu,
      riwayatList,
      filterStatus: status,
    });
  } catch (error) {
    res.render('dashboard/kaprodi/riwayat', {
      title: 'Riwayat Persetujuan Kaprodi',
      user: req.session.user,
      currentPath: req.path,
      activeTab,
      daftarMenunggu: [],
      riwayatList: [],
      filterStatus: status,
    });
  }
});

// Daftar Pengajuan Menunggu Persetujuan (Kaprodi)
router.get('/kaprodi/persetujuan', isAuthenticated, isRole(['kaprodi']), async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/proposal/kaprodi/pending`, getAxiosConfig(req));
    const daftarMenunggu = response.data?.data || [];

    // Format data untuk tampilan
    const daftarFormatted = daftarMenunggu.map(p => ({
      ...p,
      nama: p.nama || (p.pemohonId ? p.pemohonId.name : '-'),
      nim: p.nim || (p.pemohonId && p.pemohonId.profile ? p.pemohonId.profile.nim : '-'),
      program_studi: p.program_studi || (p.pemohonId && p.pemohonId.profile ? p.pemohonId.profile.programStudi : '-'),
      dosenPembimbing: p.dosenPembimbingId ? p.dosenPembimbingId.name : (p.dosenPembimbing || '-'),
      jenisSidangLabel: p.jenis_sidang === 'seminar_proposal' ? 'Seminar Proposal' : (p.jenis_sidang === 'kolokium' ? 'Kolokium' : (p.jenis_karya || '-')),
    }));

    res.render('dashboard/kaprodi/persetujuan', {
      title: 'Pengajuan Menunggu Persetujuan',
      user: req.session.user,
      currentPath: req.path,
      daftarMenunggu: daftarFormatted,
    });
  } catch (error) {
    res.render('dashboard/kaprodi/persetujuan', {
      title: 'Pengajuan Menunggu Persetujuan',
      user: req.session.user,
      currentPath: req.path,
      daftarMenunggu: [],
    });
  }
});

// Detail Pengajuan (Kaprodi)
router.get('/kaprodi/persetujuan/:id/detail', isAuthenticated, isRole(['kaprodi']), async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/proposal/${req.params.id}`, getAxiosConfig(req));
    const raw = response.data?.data;

    if (!raw) return res.status(404).render('404', { title: 'Page Not Found' });

    // Format pengajuan fields untuk tampilan
    const pengajuan = {
      ...raw,
      nama: raw.nama || (raw.pemohonId ? raw.pemohonId.name : '-'),
      nim: raw.nim || (raw.pemohonId && raw.pemohonId.profile ? raw.pemohonId.profile.nim : '-'),
      program_studi: raw.program_studi || (raw.pemohonId && raw.pemohonId.profile ? raw.pemohonId.profile.programStudi : '-'),
      dosenPembimbing: raw.dosenPembimbingId ? raw.dosenPembimbingId.name : (raw.dosenPembimbing || '-'),
      jenisSidangLabel: raw.jenis_sidang === 'seminar_proposal' ? 'Seminar Proposal' : (raw.jenis_sidang === 'kolokium' ? 'Kolokium' : (raw.jenis_karya || '-')),
    };

    const backendBaseUrl = process.env.BACKEND_URL ? process.env.BACKEND_URL.replace('/api', '') : 'http://localhost:5000';

    res.render('dashboard/kaprodi/persetujuan_detail', {
      title: 'Detail Persetujuan Kaprodi',
      user: req.session.user,
      currentPath: req.path,
      pengajuan,
      backendBaseUrl,
    });
  } catch (error) {
    return res.status(404).render('404', { title: 'Page Not Found' });
  }
});

// Submit: Setujui (Kaprodi)
router.post('/kaprodi/persetujuan/:id/setujui', isAuthenticated, isRole(['kaprodi']), async (req, res) => {
  const { ttd_kaprodi } = req.body;
  if (!ttd_kaprodi) {
    req.flash('error_msg', 'Tanda tangan wajib diisi sebelum menyetujui.');
    return res.redirect(`/dashboard/kaprodi/persetujuan/${req.params.id}/detail`);
  }

  try {
    await axios.put(`${BACKEND_URL}/proposal/${req.params.id}/approve-kaprodi`, { ttd_kaprodi }, getAxiosConfig(req));
    req.flash('success_msg', 'Pengajuan berhasil disetujui dan ditandatangani.');
    res.redirect('/dashboard/kaprodi?tab=menunggu');
  } catch (error) {
    req.flash('error_msg', error.response?.data?.error || 'Terjadi kesalahan');
    res.redirect(`/dashboard/kaprodi/persetujuan/${req.params.id}/detail`);
  }
});

// Submit: Tolak (Kaprodi)
router.post('/kaprodi/persetujuan/:id/tolak', isAuthenticated, isRole(['kaprodi']), async (req, res) => {
  const { alasan } = req.body;
  if (!alasan) {
    req.flash('error_msg', 'Alasan penolakan wajib diisi.');
    return res.redirect(`/dashboard/kaprodi/persetujuan/${req.params.id}/detail`);
  }

  try {
    await axios.put(`${BACKEND_URL}/proposal/${req.params.id}/reject-kaprodi`, { alasan }, getAxiosConfig(req));
    req.flash('success_msg', 'Pengajuan telah ditolak.');
    res.redirect('/dashboard/kaprodi?tab=menunggu');
  } catch (error) {
    req.flash('error_msg', error.response?.data?.error || 'Terjadi kesalahan');
    res.redirect(`/dashboard/kaprodi/persetujuan/${req.params.id}/detail`);
  }
});

module.exports = router;