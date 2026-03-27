const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

/**
 * GET /api/partners
 * Fetch all partners from onboarding_data with their verification status.
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('onboarding_data')
            .select('id, auth_user_id, pan_number, pan_completed, entity_completed, bank_completed, agreement_completed, aadhar_status, bank_verify_status, onboarding_flag, entity_name, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching partners:', error.message);
            return res.status(400).json({ success: false, message: error.message });
        }

        // Map each row to a partner with a computed status
        const partners = (data || []).map((row) => {
            let status = 'Pending';
            if (row.onboarding_flag === 1) {
                status = 'Completed';
            } else if (row.agreement_completed) {
                status = 'Agreement Done';
            } else if (row.bank_completed) {
                status = 'Bank Verified';
            } else if (row.entity_completed) {
                status = 'Entity Verified';
            } else if (row.pan_completed) {
                status = 'PAN Verified';
            } else if (row.aadhar_status === 'blocked') {
                status = 'Blocked';
            } else if (row.bank_verify_status === 'blocked') {
                status = 'Blocked';
            }

            return {
                id: row.id,
                auth_user_id: row.auth_user_id,
                partner_name: row.entity_name || '-',
                pan_number: row.pan_number || '-',
                pan_completed: !!row.pan_completed,
                entity_completed: !!row.entity_completed,
                bank_completed: !!row.bank_completed,
                agreement_completed: !!row.agreement_completed,
                aadhar_status: row.aadhar_status || 'pending',
                bank_verify_status: row.bank_verify_status || 'pending',
                onboarding_flag: row.onboarding_flag || 0,
                status,
                created_at: row.created_at,
            };
        });

        return res.json({ success: true, data: partners });
    } catch (err) {
        console.error('Error in /api/partners:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

/**
 * GET /api/partners/archived
 * Fetch all archived (rejected) partner entries from onboarding_data_archive.
 */
router.get('/archived', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('onboarding_data_archive')
            .select('id, original_id, auth_user_id, snapshot, archived_at, rejection_reason')
            .order('archived_at', { ascending: false });

        if (error) {
            console.error('Error fetching archived partners:', error.message);
            return res.status(400).json({ success: false, message: error.message });
        }

        const partners = (data || []).map(row => {
            const snap = row.snapshot || {};
            return {
                id: row.id,
                original_id: row.original_id,
                auth_user_id: row.auth_user_id,
                partner_name: snap.entity_name || '-',
                pan_number: snap.pan_number || '-',
                archived_at: row.archived_at,
                rejection_reason: row.rejection_reason || '',
                pan_completed: !!snap.pan_completed,
                entity_completed: !!snap.entity_completed,
                bank_completed: !!snap.bank_completed,
                agreement_completed: !!snap.agreement_completed,
                status: 'Rejected',
            };
        });

        return res.json({ success: true, data: partners });
    } catch (err) {
        console.error('Error in GET /api/partners/archived:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

/**
 * GET /api/partners/:id
 * Fetch full partner details including user profile from Supabase auth.
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('onboarding_data')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        // Fetch user metadata from Supabase auth
        let userProfile = null;
        if (data.auth_user_id) {
            try {
                const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(data.auth_user_id);
                if (!authError && authData?.user) {
                    userProfile = {
                        email: authData.user.email || null,
                        phone: authData.user.phone || null,
                        full_name: authData.user.user_metadata?.full_name || null,
                    };
                }
            } catch (e) {
                console.error('Could not fetch auth user:', e.message);
            }
        }

        return res.json({ success: true, data: { ...data, userProfile } });
    } catch (err) {
        console.error('Error in GET /api/partners/:id:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

/**
 * PUT /api/partners/:id/approve
 * Admin approves the application — sets all step flags to true so user can proceed to agreement.
 */
router.put('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('onboarding_data')
            .update({
                pan_completed: true,
                entity_completed: true,
                bank_completed: true,
                gst_verified: true,
                udyam_verified: true,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error approving partner:', error.message);
            return res.status(400).json({ success: false, message: error.message });
        }

        return res.json({ success: true, data });
    } catch (err) {
        console.error('Error in PUT /api/partners/:id/approve:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

/**
 * PUT /api/partners/:id/reject
 * Admin rejects the application:
 *   1. Copies the full onboarding_data row to onboarding_data_archive
 *   2. Deletes the row from onboarding_data (admin_onboarding_reviews cascade-deletes)
 * The user then starts fresh — their next onboarding action creates a new onboarding_data row.
 */
router.put('/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = '' } = req.body;

        // 1. Fetch the live row
        const { data: live, error: fetchErr } = await supabaseAdmin
            .from('onboarding_data')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchErr || !live) {
            return res.status(404).json({ success: false, message: 'Partner not found.' });
        }

        // 2. Insert into archive — store full row as snapshot JSONB
        const archiveRow = {
            original_id:      live.id,
            auth_user_id:     live.auth_user_id,
            snapshot:         live,
            archived_at:      new Date().toISOString(),
            rejection_reason: reason || null,
            archive_reason:   'admin_rejection',
        };
        const { error: archiveErr } = await supabaseAdmin
            .from('onboarding_data_archive')
            .insert(archiveRow);

        if (archiveErr) {
            console.error('Error archiving onboarding_data:', archiveErr.message);
            return res.status(400).json({ success: false, message: `Archive failed: ${archiveErr.message}` });
        }

        // 3. Delete live row (admin_onboarding_reviews cascade-deletes automatically)
        const { error: deleteErr } = await supabaseAdmin
            .from('onboarding_data')
            .delete()
            .eq('id', id);

        if (deleteErr) {
            console.error('Error deleting onboarding_data:', deleteErr.message);
            return res.status(400).json({ success: false, message: `Delete failed: ${deleteErr.message}` });
        }

        return res.json({ success: true, message: 'Partner rejected and archived. They will start onboarding fresh.' });
    } catch (err) {
        console.error('Error in PUT /api/partners/:id/reject:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

/**
 * PATCH /api/partners/:id/verify-gst
 * Admin marks GST as verified for the partner.
 * Body: { value: boolean }  — true to verify, false to revoke.
 * Auto-set true when GST is verified during onboarding; admin sets it when API was down.
 * Required before a Pvt Ltd / LLP / Partnership partner can sign the agreement.
 */
router.patch('/:id/verify-gst', async (req, res) => {
    try {
        const { id } = req.params;
        const value = req.body?.value ?? true; // default to true if not provided

        const { data, error } = await supabaseAdmin
            .from('onboarding_data')
            .update({ gst_verified: value })
            .eq('id', id)
            .select('id, gst_verified, udyam_verified')
            .single();

        if (error) {
            console.error('Error updating gst_available:', error.message);
            return res.status(400).json({ success: false, message: error.message });
        }

        return res.json({ success: true, data });
    } catch (err) {
        console.error('Error in PATCH /api/partners/:id/verify-gst:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

/**
 * PATCH /api/partners/:id/verify-udyam
 * Admin marks Udyam URN as verified for the partner.
 * Body: { value: boolean }  — true to verify, false to revoke.
 * Required before a Pvt Ltd / LLP / Partnership partner can sign the agreement.
 */
router.patch('/:id/verify-udyam', async (req, res) => {
    try {
        const { id } = req.params;
        const value = req.body?.value ?? true;

        const { data, error } = await supabaseAdmin
            .from('onboarding_data')
            .update({ udyam_verified: value })
            .eq('id', id)
            .select('id, gst_verified, udyam_verified')
            .single();

        if (error) {
            console.error('Error updating udyam_verified:', error.message);
            return res.status(400).json({ success: false, message: error.message });
        }

        return res.json({ success: true, data });
    } catch (err) {
        console.error('Error in PATCH /api/partners/:id/verify-udyam:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

/**
 * PATCH /api/partners/:id/verify-aadhar
 * Admin approves (verified) or rejects (blocked) Aadhaar for a partner.
 * Body: { value: boolean } — true = verified, false = blocked
 */
router.patch('/:id/verify-aadhar', async (req, res) => {
    try {
        const { id } = req.params;
        const value = req.body?.value ?? true;
        const aadhar_status = value ? 'verified' : 'blocked';

        const { data, error } = await supabaseAdmin
            .from('onboarding_data')
            .update({ aadhar_status })
            .eq('id', id)
            .select('id, aadhar_status')
            .single();

        if (error) {
            console.error('Error updating aadhar_status:', error.message);
            return res.status(400).json({ success: false, message: error.message });
        }

        return res.json({ success: true, data });
    } catch (err) {
        console.error('Error in PATCH /api/partners/:id/verify-aadhar:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

/**
 * PUT /api/partners/:id/unblock
 * Manually unblock a partner by updating their aadhar_status or bank_verify_status.
 */
router.put('/:id/unblock', async (req, res) => {
    try {
        const { id } = req.params;
        const { field } = req.body; // 'aadhar_status' or 'bank_verify_status'

        const validFields = ['aadhar_status', 'bank_verify_status'];
        if (!field || !validFields.includes(field)) {
            return res.status(400).json({ success: false, message: 'Invalid field. Use aadhar_status or bank_verify_status.' });
        }

        const { data, error } = await supabaseAdmin
            .from('onboarding_data')
            .update({ [field]: 'verified' })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error unblocking partner:', error.message);
            return res.status(400).json({ success: false, message: error.message });
        }

        return res.json({ success: true, data });
    } catch (err) {
        console.error('Error in /api/partners/:id/unblock:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

/**
 * GET /api/partners/:id/review
 * Fetch saved admin review notes for a partner (field notes + final comment).
 */
router.get('/:id/review', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('admin_onboarding_reviews')
            .select('*')
            .eq('onboarding_id', id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching review:', error.message);
            return res.status(400).json({ success: false, message: error.message });
        }

        // Return empty defaults if no review saved yet
        return res.json({
            success: true,
            data: data || { field_notes: [], final_comment: '' },
        });
    } catch (err) {
        console.error('Error in GET /api/partners/:id/review:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

/**
 * PUT /api/partners/:id/review
 * Upsert admin review notes for a partner.
 * Body: { field_notes: [{ field_key, admin_value, admin_comment, admin_upload_url }], final_comment }
 */
router.put('/:id/review', async (req, res) => {
    try {
        const { id } = req.params;
        const { field_notes = [], final_comment = '' } = req.body;

        const { data, error } = await supabaseAdmin
            .from('admin_onboarding_reviews')
            .upsert(
                {
                    onboarding_id: id,
                    field_notes,
                    final_comment,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'onboarding_id' }
            )
            .select()
            .single();

        if (error) {
            console.error('Error saving review:', error.message);
            return res.status(400).json({ success: false, message: error.message });
        }

        return res.json({ success: true, data });
    } catch (err) {
        console.error('Error in PUT /api/partners/:id/review:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

module.exports = router;
