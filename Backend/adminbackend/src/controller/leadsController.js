const supabase = require('../config/supabase');
const { randomUUID } = require('crypto');
// Helper: convert empty strings to null for non-text DB columns
const sanitizeValue = (val) => {
    if (val === '' || val === undefined) return null;
    return val;
};

// ═══════════════════════════════════════════════
// ── Lead Config (university-scoped, singleton) ──
// ═══════════════════════════════════════════════

const LEAD_CONFIG_COLUMNS = [
    'crm_provider', 'lead_post_url', 'auth_token', 'webhook_secret',
    'success_redirect_url', 'failure_redirect_url', 'lead_priority_score',
];

const getLeadConfig = async (req, res) => {
    try {
        const { universityId } = req.params;

        let { data, error } = await supabase
            .from('lead_config')
            .select('*')
            .eq('university_id', universityId)
            .single();

        // Auto-create if not exists
        if (error && error.code === 'PGRST116') {
            const { data: created, error: createErr } = await supabase
                .from('lead_config')
                .insert([{ id: randomUUID(), university_id: universityId }])
                .select()
                .single();
            if (createErr) throw new Error(createErr.message);
            data = created;
        } else if (error) {
            throw new Error(error.message);
        }

        const { data: scData } = await supabase
            .from('sc_lead_config')
            .select('*')
            .eq('university_id', universityId)
            .single();

        res.status(200).json({ data, source_data: scData || null });
    } catch (error) {
        console.error('Error fetching lead config:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateLeadConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {};
        for (const col of LEAD_CONFIG_COLUMNS) {
            if (req.body[col] !== undefined) updateData[col] = sanitizeValue(req.body[col]);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided.' });
        }

        const { data, error } = await supabase
            .from('lead_config')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Updated successfully', data });
    } catch (error) {
        console.error('Error updating lead config:', error);
        res.status(500).json({ error: error.message });
    }
};

// ═══════════════════════════════════════════════
// ── Academic Season (university-scoped, 1:many) ──
// ═══════════════════════════════════════════════

const SEASON_COLUMNS = [
    'season_name', 'batch_code', 'is_active',
    'application_open_date', 'early_bird_deadline',
    'hard_close_deadline', 'cycle_start_date', 'cycle_end_date',
];

const getAcademicSeasons = async (req, res) => {
    try {
        const { universityId } = req.params;
        const { data, error } = await supabase
            .from('academic_season')
            .select('*')
            .eq('university_id', universityId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        const { data: scData } = await supabase
            .from('sc_academic_season')
            .select('*')
            .eq('university_id', universityId);

        res.status(200).json({ data: data || [], source_data: scData || [] });
    } catch (error) {
        console.error('Error fetching academic seasons:', error);
        res.status(500).json({ error: error.message });
    }
};

const createAcademicSeason = async (req, res) => {
    try {
        const { universityId } = req.params;
        const insertData = { id: randomUUID(), university_id: universityId };

        for (const col of SEASON_COLUMNS) {
            if (req.body[col] !== undefined) insertData[col] = sanitizeValue(req.body[col]);
        }

        const { data, error } = await supabase
            .from('academic_season')
            .insert([insertData])
            .select();

        if (error) throw new Error(error.message);
        res.status(201).json({ message: 'Academic season created', data });
    } catch (error) {
        console.error('Error creating academic season:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateAcademicSeason = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {};
        for (const col of SEASON_COLUMNS) {
            if (req.body[col] !== undefined) updateData[col] = sanitizeValue(req.body[col]);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided.' });
        }

        const { data, error } = await supabase
            .from('academic_season')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Updated successfully', data });
    } catch (error) {
        console.error('Error updating academic season:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteAcademicSeason = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('academic_season').delete().eq('id', id);
        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting academic season:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getLeadConfig,
    updateLeadConfig,
    getAcademicSeasons,
    createAcademicSeason,
    updateAcademicSeason,
    deleteAcademicSeason,
};
