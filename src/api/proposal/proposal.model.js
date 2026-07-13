import mongoose from 'mongoose';

const ProposalSchema = new mongoose.Schema(
  {
    // ===== BAGIAN 1: DIISI MAHASISWA =====
    pemohonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    jenis_sidang: {
      type: String,
      enum: ['seminar_proposal', 'kolokium'],
      required: true
    },
    nama: {
      type: String,
      required: [true, 'Nama wajib diisi']
    },
    nim: {
      type: String,
      required: [true, 'NIM wajib diisi']
    },
    program_studi: {
      type: String,
      required: [true, 'Program Studi wajib diisi']
    },
    alamat: {
      type: String,
      required: [true, 'Alamat wajib diisi']
    },
    no_hp: {
      type: String,
      required: [true, 'No. HP wajib diisi']
    },
    email: {
      type: String,
      required: [true, 'Email wajib diisi']
    },
    judul_karya_akhir: {
      type: String,
      required: [true, 'Judul Karya Akhir wajib diisi']
    },
    file_draft_karya_akhir: {
      type: String,
      required: [true, 'Draft Karya Akhir wajib diupload']
    },
    ttd_pemohon: {
      type: String,
      required: true
    },
    tanggalDiajukan: {
      type: Date,
      default: Date.now
    },

    // ===== BAGIAN 2: DIISI DOSEN PEMBIMBING =====
    dosenPembimbingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    dosenPembimbing: {
      type: String, // Nama dosen pembimbing untuk history jika perlu
      default: null
    },
    ttd_dosen: {
      type: String,
      default: null
    },
    tanggalTandatangan: {
      type: Date,
      default: null
    },
    catatanDospem: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['menunggu', 'ditolak', 'ditandatangani'],
      default: 'menunggu'
    },

    // ===== BAGIAN 3: DIISI ADMIN (UPPS) =====
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    statusAdmin: {
      type: String,
      enum: ['menunggu', 'terjadwal', 'selesai', 'ditolak'],
      default: 'menunggu'
    },
    jadwal: {
      tanggal: { type: Date, default: null },
      jamMulai: { type: String, default: '' },
      jamSelesai: { type: String, default: '' },
      teknik: { type: String, enum: ['online', 'offline'], default: 'offline' },
      ruang: { type: String, default: '' },
      linkMeeting: { type: String, default: '' },
      penguji: [
        {
          nama: String,
          peran: String
        }
      ]
    },
    alasanTolak: {
      type: String,
      default: ''
    },

    // ===== BAGIAN 4: DIISI KAPRODI =====
    kaprodiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    statusKaprodi: {
      type: String,
      enum: ['menunggu', 'disetujui', 'ditolak'],
      default: 'menunggu'
    },
    ttd_kaprodi: {
      type: String,
      default: null
    },
    alasanTolakKaprodi: {
      type: String,
      default: ''
    },
    signedAtKaprodi: {
      type: Date,
      default: null
    },

    // ===== LOGS =====
    logs: [
      {
        action: {
          type: String,
          required: true
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        role: {
          type: String
        },
        detail: {
          type: String,
          default: ''
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Index untuk query cepat
ProposalSchema.index({ pemohonId: 1, status: 1 });
ProposalSchema.index({ nim: 1, status: 1 });
ProposalSchema.index({ status: 1, createdAt: -1 });

// Method tambah log
ProposalSchema.methods.addLog = function (action, userId, role, detail = '') {
  this.logs.push({
    action,
    userId,
    role,
    detail,
    timestamp: new Date()
  });
};

const Proposal = mongoose.model('Proposal', ProposalSchema);
export default Proposal;