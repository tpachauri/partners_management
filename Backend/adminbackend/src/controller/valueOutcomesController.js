const supabase = require('../config/supabase');
const { randomUUID } = require('crypto');
// Helper: convert empty strings to null for non-text DB columns
const sanitizeValue = (val) => {
    if (val === '' || val === undefined) return null;
    return val;
};

// ═══════════════════════════════════════════════
// ── Placement Outcome Metric (offering-scoped) ──
// ═══════════════════════════════════════════════

const PLACEMENT_METRIC_COLUMNS = [
    'offering_id', 'season_id', 'metric_category', 'value_numeric',
    'value_display_text', 'currency_code', 'reporting_sample_size',
    'data_source_type', 'verification_proof_url', 'is_international_offer',
    'valid_until', 'is_marketing_approved', 'audit_verified_by_id',
];

const getPlacementMetrics = async (req, res) => {
    try {
        const { offeringId } = req.params;
        let { data, error } = await supabase
            .from('placement_outcome_metric')
            .select('*')
            .eq('offering_id', offeringId);

        if (error) throw new Error(error.message);

        const { data: scData } = await supabase
            .from('sc_placement_outcome_metric')
            .select('*')
            .eq('offering_id', offeringId);

        // Auto-sync from sc_ table
        if (scData && scData.length > 0) {
            const existingIds = new Set((data || []).map(row => row.id));
            let needsRefresh = false;
            for (const sc of scData) {
                if (existingIds.has(sc.id)) continue;
                const insertPayload = { id: sc.id, offering_id: offeringId };
                for (const col of PLACEMENT_METRIC_COLUMNS) {
                    if (sc[col] !== undefined && sc[col] !== null) insertPayload[col] = sc[col];
                }
                const { error: ie } = await supabase.from('placement_outcome_metric').insert([insertPayload]);
                if (!ie) needsRefresh = true;
                else console.error('Error syncing sc_placement_outcome_metric:', ie.message);
            }
            if (needsRefresh) {
                const { data: refreshed } = await supabase.from('placement_outcome_metric').select('*').eq('offering_id', offeringId);
                if (refreshed) data = refreshed;
            }
        }

        res.status(200).json({ data: data || [], source_data: scData || [] });
    } catch (error) {
        console.error('Error fetching placement metrics:', error);
        res.status(500).json({ error: error.message });
    }
};

const createPlacementMetric = async (req, res) => {
    try {
        const { offeringId } = req.params;
        const insertData = { id: randomUUID(), offering_id: offeringId };

        for (const col of PLACEMENT_METRIC_COLUMNS) {
            if (req.body[col] !== undefined) insertData[col] = sanitizeValue(req.body[col]);
        }

        const { data, error } = await supabase
            .from('placement_outcome_metric')
            .insert([insertData])
            .select();

        if (error) throw new Error(error.message);
        res.status(201).json({ message: 'Placement metric created', data });
    } catch (error) {
        console.error('Error creating placement metric:', error);
        res.status(500).json({ error: error.message });
    }
};

const updatePlacementMetric = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {};
        for (const col of PLACEMENT_METRIC_COLUMNS) {
            if (req.body[col] !== undefined) updateData[col] = sanitizeValue(req.body[col]);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided.' });
        }

        const { data, error } = await supabase
            .from('placement_outcome_metric')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Updated successfully', data });
    } catch (error) {
        console.error('Error updating placement metric:', error);
        res.status(500).json({ error: error.message });
    }
};

const deletePlacementMetric = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('placement_outcome_metric').delete().eq('id', id);
        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting placement metric:', error);
        res.status(500).json({ error: error.message });
    }
};

// ═══════════════════════════════════════════════
// ── Corporate Hiring Partner (standalone) ──
// ═══════════════════════════════════════════════

const CORPORATE_HIRING_COLUMNS = [
    'company_name', 'industry_domain_tag', 'logo_asset_url',
    'display_priority_tier', 'mapped_offering_ids_json',
    'hiring_intent_category', 'last_hiring_year', 'total_alumni_hired',
    'logo_usage_rights_status', 'career_portal_url', 'is_active',
];

const getCorporateHiringPartners = async (req, res) => {
    try {
        let { data, error } = await supabase
            .from('corporate_hiring_partner')
            .select('*')
            .order('display_priority_tier', { ascending: true });

        if (error) throw new Error(error.message);

        const { data: scData } = await supabase
            .from('sc_corporate_hiring_partner')
            .select('*');

        // Auto-sync from sc_ table (standalone — no FK)
        if (scData && scData.length > 0) {
            const existingIds = new Set((data || []).map(row => row.id));
            let needsRefresh = false;
            for (const sc of scData) {
                if (existingIds.has(sc.id)) continue;
                const insertPayload = { id: sc.id };
                for (const col of CORPORATE_HIRING_COLUMNS) {
                    if (sc[col] !== undefined && sc[col] !== null) insertPayload[col] = sc[col];
                }
                const { error: ie } = await supabase.from('corporate_hiring_partner').insert([insertPayload]);
                if (!ie) needsRefresh = true;
                else console.error('Error syncing sc_corporate_hiring_partner:', ie.message);
            }
            if (needsRefresh) {
                const { data: refreshed } = await supabase.from('corporate_hiring_partner').select('*').order('display_priority_tier', { ascending: true });
                if (refreshed) data = refreshed;
            }
        }

        res.status(200).json({ data: data || [], source_data: scData || [] });
    } catch (error) {
        console.error('Error fetching corporate hiring partners:', error);
        res.status(500).json({ error: error.message });
    }
};

const createCorporateHiringPartner = async (req, res) => {
    try {
        const insertData = { id: randomUUID() };
        for (const col of CORPORATE_HIRING_COLUMNS) {
            if (req.body[col] !== undefined) insertData[col] = sanitizeValue(req.body[col]);
        }

        const { data, error } = await supabase
            .from('corporate_hiring_partner')
            .insert([insertData])
            .select();

        if (error) throw new Error(error.message);
        res.status(201).json({ message: 'Corporate hiring partner created', data });
    } catch (error) {
        console.error('Error creating corporate hiring partner:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateCorporateHiringPartner = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {};
        for (const col of CORPORATE_HIRING_COLUMNS) {
            if (req.body[col] !== undefined) updateData[col] = sanitizeValue(req.body[col]);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided.' });
        }

        const { data, error } = await supabase
            .from('corporate_hiring_partner')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Updated successfully', data });
    } catch (error) {
        console.error('Error updating corporate hiring partner:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteCorporateHiringPartner = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('corporate_hiring_partner').delete().eq('id', id);
        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting corporate hiring partner:', error);
        res.status(500).json({ error: error.message });
    }
};

// ═══════════════════════════════════════════════
// ── Alumni Success Story (offering-scoped) ──
// ═══════════════════════════════════════════════

const ALUMNI_STORY_COLUMNS = [
    'student_user_id', 'offering_id', 'display_name',
    'pre_course_designation', 'post_course_designation',
    'pre_course_company', 'post_course_company',
    'salary_hike_percentage', 'transition_tag',
    'testimonial_video_url', 'linkedin_profile_url',
    'consent_status', 'is_featured', 'admission_season_id',
];

const getAlumniStories = async (req, res) => {
    try {
        const { universityId } = req.params;

        // Alumni stories are linked via offering_id, but we fetch by university
        // First get all offerings for this university's programs
        const { data: programs } = await supabase
            .from('program_master')
            .select('id')
            .eq('university_id', universityId);

        if (!programs || programs.length === 0) {
            return res.status(200).json({ data: [], source_data: [] });
        }

        const programIds = programs.map(p => p.id);

        const { data: offerings } = await supabase
            .from('program_offering')
            .select('id')
            .in('program_id', programIds);

        if (!offerings || offerings.length === 0) {
            return res.status(200).json({ data: [], source_data: [] });
        }

        const offeringIds = offerings.map(o => o.id);

        let { data, error } = await supabase
            .from('alumni_success_story')
            .select('*')
            .in('offering_id', offeringIds);

        if (error) throw new Error(error.message);

        const { data: scData } = await supabase
            .from('sc_alumni_success_story')
            .select('*')
            .in('offering_id', offeringIds);

        // Auto-sync from sc_ table
        if (scData && scData.length > 0) {
            const existingIds = new Set((data || []).map(row => row.id));
            let needsRefresh = false;
            for (const sc of scData) {
                if (existingIds.has(sc.id)) continue;
                const insertPayload = { id: sc.id };
                for (const col of ALUMNI_STORY_COLUMNS) {
                    if (sc[col] !== undefined && sc[col] !== null) insertPayload[col] = sc[col];
                }
                const { error: ie } = await supabase.from('alumni_success_story').insert([insertPayload]);
                if (!ie) needsRefresh = true;
                else console.error('Error syncing sc_alumni_success_story:', ie.message);
            }
            if (needsRefresh) {
                const { data: refreshed } = await supabase.from('alumni_success_story').select('*').in('offering_id', offeringIds);
                if (refreshed) data = refreshed;
            }
        }

        res.status(200).json({ data: data || [], source_data: scData || [] });
    } catch (error) {
        console.error('Error fetching alumni stories:', error);
        res.status(500).json({ error: error.message });
    }
};

const createAlumniStory = async (req, res) => {
    try {
        const insertData = { id: randomUUID() };
        for (const col of ALUMNI_STORY_COLUMNS) {
            if (req.body[col] !== undefined) insertData[col] = sanitizeValue(req.body[col]);
        }

        const { data, error } = await supabase
            .from('alumni_success_story')
            .insert([insertData])
            .select();

        if (error) throw new Error(error.message);
        res.status(201).json({ message: 'Alumni story created', data });
    } catch (error) {
        console.error('Error creating alumni story:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateAlumniStory = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {};
        for (const col of ALUMNI_STORY_COLUMNS) {
            if (req.body[col] !== undefined) updateData[col] = sanitizeValue(req.body[col]);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided.' });
        }

        const { data, error } = await supabase
            .from('alumni_success_story')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Updated successfully', data });
    } catch (error) {
        console.error('Error updating alumni story:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteAlumniStory = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('alumni_success_story').delete().eq('id', id);
        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting alumni story:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getPlacementMetrics,
    createPlacementMetric,
    updatePlacementMetric,
    deletePlacementMetric,
    getCorporateHiringPartners,
    createCorporateHiringPartner,
    updateCorporateHiringPartner,
    deleteCorporateHiringPartner,
    getAlumniStories,
    createAlumniStory,
    updateAlumniStory,
    deleteAlumniStory,
};
