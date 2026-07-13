import Proposal from './proposal.model.js';
import { formatResult } from '../../utils/formatResult.js';

// ==================== CREATE ====================
export async function createProposal(data) {
  const proposal = new Proposal(data);
  const result = await proposal.save();
  return formatResult(result, 'getOne');
}

// ==================== GET ALL ====================
export async function getAllProposals(filter = {}) {
  const result = await Proposal.find(filter)
    .populate('pemohonId', 'name email nim programStudi')
    .populate('dosenPembimbingId', 'name email')
    .populate('adminId', 'name email')
    .populate('kaprodiId', 'name email')
    .sort({ createdAt: -1 });

  return formatResult(result, 'getAll');
}

// ==================== GET BY ID ====================
export async function getProposalById(id) {
  const result = await Proposal.findById(id)
    .populate('pemohonId', 'name email nim profile.nim profile.programStudi')
    .populate('dosenPembimbingId', 'name email')
    .populate('adminId', 'name email')
    .populate('kaprodiId', 'name email');

  return formatResult(result, 'getOne');
}

// ==================== GET BY PEMOHON ====================
export async function getProposalsByPemohon(pemohonId) {
  const result = await Proposal.find({ pemohonId })
    .populate('dosenPembimbingId', 'name email')
    .populate('adminId', 'name email')
    .populate('kaprodiId', 'name email')
    .sort({ createdAt: -1 });

  return formatResult(result, 'getAll');
}

// ==================== GET PENDING DOSPEM ====================
export async function getPendingDospem() {
  const result = await Proposal.find({ status: 'menunggu' })
    .populate('pemohonId', 'name email profile.nim')
    .sort({ createdAt: 1 });

  return formatResult(result, 'getAll');
}

// ==================== GET PENDING ADMIN ====================
export async function getPendingAdmin() {
  const result = await Proposal.find({ status: 'ditandatangani', statusAdmin: 'menunggu' })
    .populate('pemohonId', 'name email profile.nim')
    .populate('dosenPembimbingId', 'name email')
    .sort({ createdAt: 1 });

  return formatResult(result, 'getAll');
}

// ==================== GET PENDING KAPRODI ====================
export async function getPendingKaprodi() {
  const result = await Proposal.find({ statusAdmin: 'terjadwal', statusKaprodi: 'menunggu' })
    .populate('pemohonId', 'name email profile.nim')
    .populate('dosenPembimbingId', 'name email')
    .populate('adminId', 'name email')
    .sort({ 'jadwal.tanggal': 1 });

  return formatResult(result, 'getAll');
}

// ==================== UPDATE ====================
export async function updateProposal(id, data) {
  const result = await Proposal.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true }
  );
  return formatResult(result, 'getOne');
}

// ==================== ADD LOG ====================
export async function addLogToProposal(id, action, userId, role, detail = '') {
  const proposal = await Proposal.findById(id);
  if (!proposal) {
    return {
      success: false,
      message: 'Proposal tidak ditemukan'
    };
  }

  proposal.addLog(action, userId, role, detail);
  const result = await proposal.save();
  return formatResult(result, 'getOne');
}