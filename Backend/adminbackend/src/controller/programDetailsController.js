const supabase = require('../config/supabase');
const { randomUUID } = require('crypto');
// Helper: convert empty strings to null for non-text DB columns
const sanitizeValue = (val) => {
    if (val === '' || val === undefined) return null;
    return val;
};

// ═══════════════════════════════════════════════
// ── Helper: Generic CRUD for offering sub-entities ──
// ═══════════════════════════════════════════════

const createOfferingSubHandlers = (tableName, scTableName, allowedColumns) => {
    const getAll = async (req, res) => {
        try {
            const { offeringId } = req.params;
            //console.log(`[DEBUG] getAll ${tableName} for offeringId: ${offeringId}`);
            let { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('offering_id', offeringId);

            if (error) throw new Error(error.message);
            // console.log(`[DEBUG] ${tableName} main data count: ${(data || []).length}`);

            let scData = [];
            if (scTableName) {
                const { data: sc } = await supabase
                    .from(scTableName)
                    .select('*')
                    .eq('offering_id', offeringId);
                scData = sc || [];
                //console.log(`[DEBUG] ${scTableName} source data count: ${scData.length}`);
            }

            // Auto-sync: insert sc_ rows missing from main table
            if (scTableName && scData.length > 0) {
                const existingIds = new Set((data || []).map(row => row.id));
                let needsRefresh = false;

                for (const sc of scData) {
                    if (existingIds.has(sc.id)) continue;
                    const insertPayload = { id: sc.id, offering_id: offeringId };
                    for (const col of allowedColumns) {
                        if (sc[col] !== undefined && sc[col] !== null) insertPayload[col] = sc[col];
                    }
                    const { error: insertError } = await supabase.from(tableName).insert([insertPayload]);
                    if (!insertError) needsRefresh = true;
                    else console.error(`Error syncing ${scTableName}:`, insertError.message);
                }

                if (needsRefresh) {
                    const { data: refreshed } = await supabase
                        .from(tableName).select('*').eq('offering_id', offeringId);
                    if (refreshed) data = refreshed;
                }
            }

            res.status(200).json({ data: data || [], source_data: scData });
        } catch (error) {
            console.error(`Error fetching ${tableName}:`, error);
            res.status(500).json({ error: error.message });
        }
    };

    const create = async (req, res) => {
        try {
            const { offeringId } = req.params;
            const rowId = randomUUID();
            const insertData = { id: rowId, offering_id: offeringId };

            for (const col of allowedColumns) {
                if (req.body[col] !== undefined) insertData[col] = sanitizeValue(req.body[col]);
            }

            // Insert into sc_ table first (auto-sync in getAll copies to main table)
            const targetTable = scTableName || tableName;
            const { data, error } = await supabase
                .from(targetTable)
                .insert([insertData])
                .select();

            if (error) {
                // If FK constraint fails on sc_ table (e.g. offering exists only in main table),
                // retry by inserting directly into the main table
                if (scTableName && error.message.includes('foreign key constraint')) {
                    const { data: retryData, error: retryError } = await supabase
                        .from(tableName)
                        .insert([insertData])
                        .select();
                    if (retryError) throw new Error(retryError.message);
                    return res.status(201).json({ message: `${tableName} created`, data: retryData });
                }
                throw new Error(error.message);
            }
            res.status(201).json({ message: `${targetTable} created`, data });
        } catch (error) {
            console.error(`Error creating ${scTableName || tableName}:`, error);
            res.status(500).json({ error: error.message });
        }
    };

    const update = async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = {};

            for (const col of allowedColumns) {
                if (req.body[col] !== undefined) updateData[col] = sanitizeValue(req.body[col]);
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ error: 'No valid fields provided.' });
            }

            const { data, error } = await supabase
                .from(tableName)
                .update(updateData)
                .eq('id', id)
                .select();

            if (error) throw new Error(error.message);
            res.status(200).json({ message: 'Updated successfully', data });
        } catch (error) {
            console.error(`Error updating ${tableName}:`, error);
            res.status(500).json({ error: error.message });
        }
    };

    const remove = async (req, res) => {
        try {
            const { id } = req.params;
            // Delete from main table
            const { error } = await supabase.from(tableName).delete().eq('id', id);
            if (error) throw new Error(error.message);
            // Also delete from sc_ table to prevent auto-sync re-creating it
            if (scTableName) {
                await supabase.from(scTableName).delete().eq('id', id);
            }
            res.status(200).json({ message: 'Deleted successfully' });
        } catch (error) {
            console.error(`Error deleting ${tableName}:`, error);
            res.status(500).json({ error: error.message });
        }
    };

    return { getAll, create, update, remove };
};

// ═══════════════════════════════════════════════
// ── Fee Structure ──
// ═══════════════════════════════════════════════

const feeHandlers = createOfferingSubHandlers(
    'fee_structure', 'sc_fee_structure',
    ['fee_type', 'student_category', 'payment_plan_type', 'currency', 'amount', 'finance_whitelist_json', 'fee_note', 'is_eligible_for_loan']
);

// ═══════════════════════════════════════════════
// ── Program Eligibility ──
// ═══════════════════════════════════════════════

const eligibilityHandlers = createOfferingSubHandlers(
    'program_eligibility', 'sc_program_eligibility',
    [
        'student_category_json', 'academic_level_required', 'min_score_percent_gen', 'min_score_percent_reserved',
        'stream_rules_json', 'mandatory_subjects_json', 'is_lateral_entry',
        'max_backlogs_allowed', 'max_education_gap_years', 'is_provisional_allowed',
        'raw_criteria', 'qualifying_degrees', 'documents_required', 'target_audience',
    ]
);

// ═══════════════════════════════════════════════
// ── Program Curriculum ──
// ═══════════════════════════════════════════════

const curriculumHandlers = createOfferingSubHandlers(
    'program_curriculum', 'sc_program_curriculum',
    ['term_number', 'term_label', 'subject_name', 'subject_code', 'credit_points', 'is_elective', 'topics_covered_json', 'is_project_work']
);

// ═══════════════════════════════════════════════
// ── Program Addon ──
// ═══════════════════════════════════════════════

const addonHandlers = createOfferingSubHandlers(
    'program_addon', 'sc_program_addon',
    ['addon_name', 'addon_type', 'provider_name', 'price_amount', 'is_mandatory', 'description_html', 'thumbnail_url']
);

// ═══════════════════════════════════════════════
// ── Offering Faculty ──
// ═══════════════════════════════════════════════

const offeringFacultyHandlers = createOfferingSubHandlers(
    'offering_faculty', 'sc_offering_faculty',
    ['name', 'designation', 'qualification', 'industry_exp_years', 'profile_image_url', 'linkedin_url', 'video_intro_url', 'is_star_faculty']
);

module.exports = {
    feeHandlers,
    eligibilityHandlers,
    curriculumHandlers,
    addonHandlers,
    offeringFacultyHandlers,
};
