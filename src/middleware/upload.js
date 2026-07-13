import { upload } from '../config/passport.config.js';

export const uploadProposalFiles = upload.fields([
  { name: 'file_form_ttd', maxCount: 1 },
  { name: 'file_draft_karya_akhir', maxCount: 1 }
]);
