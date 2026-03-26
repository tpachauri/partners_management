const supabase = require('../config/supabase');
const { randomUUID } = require('crypto');

// Helper: convert empty strings to null for non-text DB columns
const sanitizeValue = (val) => {
    if (val === '' || val === undefined) return null;
    return val;
};

// ═══════════════════════════════════════════════
// ── Program Master CRUD ──
// ═══════════════════════════════════════════════

const PROGRAM_MASTER_COLUMNS = [
    'program_name', 'global_degree_type', 'program_level', 'mode',
    'total_credits', 'duration_months', 'max_duration_months',
    'is_wes_recognized', 'is_nep_compliant', 'exit_pathways_json',
    'sample_certificate_url', 'brochure_pdf_url',
];

const createProgram = async (req, res) => {
    try {
        const { universityId } = req.params;
        const insertData = { id: randomUUID(), university_id: universityId };

        for (const col of PROGRAM_MASTER_COLUMNS) {
            if (req.body[col] !== undefined) insertData[col] = sanitizeValue(req.body[col]);
        }
        // Support legacy field name
        if (req.body.programName) insertData.program_name = req.body.programName;

        const { data, error } = await supabase
            .from('program_master')
            .insert([insertData])
            .select();

        if (error) throw new Error(error.message);
        res.status(201).json({ message: 'Program created successfully', data });
    } catch (error) {
        console.error('Error creating program:', error);
        res.status(500).json({ error: error.message });
    }
};

const getPrograms = async (req, res) => {
    try {
        const { universityId } = req.params;

        // Fetch from main table
        let { data, error } = await supabase
            .from('program_master')
            .select('*')
            .eq('university_id', universityId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        // Auto-sync from sc_program_master
        const { data: scPrograms } = await supabase
            .from('sc_program_master')
            .select('*')
            .eq('university_id', universityId);

        if (scPrograms && scPrograms.length > 0) {
            const existingIds = new Set(data.map(p => p.id));
            const existingByName = {};
            data.forEach(p => { if (p.program_name) existingByName[p.program_name] = p; });

            let needsRefresh = false;

            for (const sc of scPrograms) {
                if (existingIds.has(sc.id)) continue;

                const matchByName = sc.program_name ? existingByName[sc.program_name] : null;

                if (!matchByName) {
                    // New program from scraper — insert with same ID
                    const { error: insertError } = await supabase
                        .from('program_master')
                        .insert([{
                            id: sc.id,
                            university_id: universityId,
                            program_name: sc.program_name || null,
                            global_degree_type: sc.global_degree_type || null,
                            program_level: sc.program_level || null,
                            mode: sc.mode || null,
                            total_credits: sc.total_credits || null,
                            duration_months: sc.duration_months || null,
                            max_duration_months: sc.max_duration_months || null,
                        }]);

                    if (!insertError) needsRefresh = true;
                    else console.error('Error syncing sc_ program:', insertError.message);
                } else if (matchByName.id !== sc.id) {
                    // ID mismatch — old sync used randomUUID(). Fix by
                    // deleting old record + dependents and re-inserting with sc.id
                    const oldId = matchByName.id;
                    console.log(`Fixing ID mismatch for program "${sc.program_name}": ${oldId} → ${sc.id}`);

                    // Remove dependents that reference the old program ID
                    await supabase.from('program_offering').delete().eq('program_id', oldId);
                    await supabase.from('program_specialization').delete().eq('program_id', oldId);
                    // Remove the old program entry
                    await supabase.from('program_master').delete().eq('id', oldId);

                    // Re-insert with correct sc_ ID
                    const { error: reInsertError } = await supabase
                        .from('program_master')
                        .insert([{
                            id: sc.id,
                            university_id: universityId,
                            program_name: sc.program_name || null,
                            global_degree_type: sc.global_degree_type || null,
                            program_level: sc.program_level || null,
                            mode: sc.mode || null,
                            total_credits: sc.total_credits || null,
                            duration_months: sc.duration_months || null,
                            max_duration_months: sc.max_duration_months || null,
                        }]);

                    if (!reInsertError) needsRefresh = true;
                    else console.error('Error re-inserting program with correct ID:', reInsertError.message);
                }
            }

            if (needsRefresh) {
                const { data: refreshed, error: refreshError } = await supabase
                    .from('program_master')
                    .select('*')
                    .eq('university_id', universityId)
                    .order('created_at', { ascending: false });

                if (!refreshError) data = refreshed;
            }
        }

        // Fetch source data
        const { data: scData } = await supabase
            .from('sc_program_master')
            .select('*')
            .eq('university_id', universityId);

        res.status(200).json({ data: data || [], source_data: scData || [] });
    } catch (error) {
        console.error('Error fetching programs:', error);
        res.status(500).json({ error: error.message });
    }
};

const getProgramById = async (req, res) => {
    try {
        const { programId } = req.params;

        const { data, error } = await supabase
            .from('program_master')
            .select('*')
            .eq('id', programId)
            .single();

        if (error) throw new Error(error.message);

        // Fetch source data by program_name match
        let scData = null;
        if (data.program_name) {
            const { data: sc } = await supabase
                .from('sc_program_master')
                .select('*')
                .eq('university_id', data.university_id)
                .eq('program_name', data.program_name)
                .single();
            scData = sc;
        }

        res.status(200).json({ data, source_data: scData || null });
    } catch (error) {
        console.error('Error fetching program:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateProgram = async (req, res) => {
    try {
        const { programId } = req.params;
        const updateData = {};

        for (const col of PROGRAM_MASTER_COLUMNS) {
            if (req.body[col] !== undefined) updateData[col] = sanitizeValue(req.body[col]);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided for update.' });
        }

        const { data, error } = await supabase
            .from('program_master')
            .update(updateData)
            .eq('id', programId)
            .select();

        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Updated successfully', data });
    } catch (error) {
        console.error('Error updating program:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteProgram = async (req, res) => {
    try {
        const { programId } = req.params;
        const { error } = await supabase.from('program_master').delete().eq('id', programId);
        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Program deleted successfully' });
    } catch (error) {
        console.error('Error deleting program:', error);
        res.status(500).json({ error: error.message });
    }
};

// ═══════════════════════════════════════════════
// ── Program Specialization CRUD ──
// ═══════════════════════════════════════════════

const SPECIALIZATION_COLUMNS = [
    'specialization_name', 'slug', 'description_html',
    'career_roles_json', 'category_tag', 'thumbnail_image_url',
    'specialization_brochure_url',
];

const getSpecializations = async (req, res) => {
    try {
        const { programId } = req.params;
        let { data, error } = await supabase
            .from('program_specialization')
            .select('*')
            .eq('program_id', programId);

        if (error) throw new Error(error.message);

        const { data: scData } = await supabase
            .from('sc_program_specialization')
            .select('*')
            .eq('program_id', programId);

        // Auto-sync from sc_program_specialization
        if (scData && scData.length > 0) {
            const existingIds = new Set((data || []).map(s => s.id));
            let needsRefresh = false;

            for (const sc of scData) {
                if (existingIds.has(sc.id)) continue;

                const { error: insertError } = await supabase
                    .from('program_specialization')
                    .insert([{
                        id: sc.id,
                        program_id: programId,
                        specialization_name: sc.specialization_name || null,
                        slug: sc.slug || null,
                        description_html: sc.description_html || null,
                        category_tag: sc.category_tag || null,
                    }]);

                if (!insertError) needsRefresh = true;
                else console.error('Error syncing sc_ specialization:', insertError.message);
            }

            if (needsRefresh) {
                const { data: refreshed } = await supabase
                    .from('program_specialization')
                    .select('*')
                    .eq('program_id', programId);
                if (refreshed) data = refreshed;
            }
        }

        res.status(200).json({ data: data || [], source_data: scData || [] });
    } catch (error) {
        console.error('Error fetching specializations:', error);
        res.status(500).json({ error: error.message });
    }
};

const createSpecialization = async (req, res) => {
    try {
        const { programId } = req.params;
        const insertData = { id: randomUUID(), program_id: programId };

        for (const col of SPECIALIZATION_COLUMNS) {
            if (req.body[col] !== undefined) insertData[col] = sanitizeValue(req.body[col]);
        }

        const { data, error } = await supabase
            .from('program_specialization')
            .insert([insertData])
            .select();

        if (error) throw new Error(error.message);
        res.status(201).json({ message: 'Specialization created', data });
    } catch (error) {
        console.error('Error creating specialization:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateSpecialization = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {};
        for (const col of SPECIALIZATION_COLUMNS) {
            if (req.body[col] !== undefined) updateData[col] = sanitizeValue(req.body[col]);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided.' });
        }

        const { data, error } = await supabase
            .from('program_specialization')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Updated successfully', data });
    } catch (error) {
        console.error('Error updating specialization:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteSpecialization = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('program_specialization').delete().eq('id', id);
        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting specialization:', error);
        res.status(500).json({ error: error.message });
    }
};

// ═══════════════════════════════════════════════
// ── Program Offering CRUD ──
// ═══════════════════════════════════════════════

const OFFERING_COLUMNS = [
    'program_id', 'specialization_id', 'season_id', 'sku_code',
    'industry_partner_id', 'co_brand_label', 'is_dual_degree',
    'exam_center_states_json', 'seat_capacity', 'application_deadline', 'is_active',
];

const getOfferings = async (req, res) => {
    try {
        const { programId } = req.params;
        let { data, error } = await supabase
            .from('program_offering')
            .select('*')
            .eq('program_id', programId);

        if (error) throw new Error(error.message);

        const { data: scData } = await supabase
            .from('sc_program_offering')
            .select('*')
            .eq('program_id', programId);

        // Auto-sync from sc_program_offering
        if (scData && scData.length > 0) {
            const existingIds = new Set((data || []).map(o => o.id));
            let needsRefresh = false;

            for (const sc of scData) {
                if (existingIds.has(sc.id)) continue;

                const insertRow = {
                    id: sc.id,
                    program_id: programId,
                    specialization_id: sc.specialization_id || null,
                    season_id: sc.season_id || null,
                    sku_code: sc.sku_code || null,
                    co_brand_label: sc.co_brand_label || null,
                    is_dual_degree: sc.is_dual_degree || null,
                    seat_capacity: sc.seat_capacity || null,
                    application_deadline: sc.application_deadline || null,
                    is_active: sc.is_active ?? true,
                };

                let { error: insertError } = await supabase
                    .from('program_offering')
                    .insert([insertRow]);

                // If FK constraint fails, retry without specialization_id
                if (insertError && insertError.message.includes('specialization_id_fkey')) {
                    insertRow.specialization_id = null;
                    const retry = await supabase
                        .from('program_offering')
                        .insert([insertRow]);
                    insertError = retry.error;
                }

                if (!insertError) needsRefresh = true;
                else console.error('Error syncing sc_ offering:', insertError.message);
            }

            if (needsRefresh) {
                const { data: refreshed } = await supabase
                    .from('program_offering')
                    .select('*')
                    .eq('program_id', programId);
                if (refreshed) data = refreshed;
            }
        }

        res.status(200).json({ data: data || [], source_data: scData || [] });
    } catch (error) {
        console.error('Error fetching offerings:', error);
        res.status(500).json({ error: error.message });
    }
};

const createOffering = async (req, res) => {
    try {
        const { programId } = req.params;
        const insertData = { id: randomUUID(), program_id: programId };

        for (const col of OFFERING_COLUMNS) {
            if (req.body[col] !== undefined) insertData[col] = sanitizeValue(req.body[col]);
        }

        const { data, error } = await supabase
            .from('program_offering')
            .insert([insertData])
            .select();

        if (error) throw new Error(error.message);
        res.status(201).json({ message: 'Offering created', data });
    } catch (error) {
        console.error('Error creating offering:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateOffering = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {};
        for (const col of OFFERING_COLUMNS) {
            if (req.body[col] !== undefined) updateData[col] = sanitizeValue(req.body[col]);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided.' });
        }

        const { data, error } = await supabase
            .from('program_offering')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Updated successfully', data });
    } catch (error) {
        console.error('Error updating offering:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteOffering = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('program_offering').delete().eq('id', id);
        if (error) throw new Error(error.message);
        // Also delete from sc_ table to prevent auto-sync re-creating it
        await supabase.from('sc_program_offering').delete().eq('id', id);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting offering:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createProgram,
    getPrograms,
    getProgramById,
    updateProgram,
    deleteProgram,
    getSpecializations,
    createSpecialization,
    updateSpecialization,
    deleteSpecialization,
    getOfferings,
    createOffering,
    updateOffering,
    deleteOffering,
};
