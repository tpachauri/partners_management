const supabase = require('../config/supabase');
const { randomUUID } = require('crypto');

// Helper: convert empty strings to null so PostgreSQL doesn't reject
// "" for boolean, integer, numeric, date columns.
const sanitizeValue = (val) => {
    if (val === '' || val === undefined) return null;
    return val;
};

// ═══════════════════════════════════════════════
// ── Helper: Generic CRUD factory for sub-entities ──
// ═══════════════════════════════════════════════

/**
 * Creates standard CRUD handlers for a university sub-entity table.
 * @param {string} tableName - The main table name (e.g., 'university_ranking')
 * @param {string} scTableName - The sc_ table name (e.g., 'sc_university_ranking')
 * @param {string[]} allowedColumns - Columns allowed for create/update
 * @param {object} options - { fkColumn: 'university_id', isSingleton: false }
 */
const createSubEntityHandlers = (tableName, scTableName, allowedColumns, options = {}) => {
    const { fkColumn = 'university_id', fkParam = 'universityId', isSingleton = false } = options;

    const getAll = async (req, res) => {
        try {
            const parentId = req.params[fkParam];
            let { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq(fkColumn, parentId)
                .order('created_at', { ascending: false });

            if (error) throw new Error(error.message);

            // Fetch source data
            let scData = [];
            if (scTableName) {
                const { data: sc } = await supabase
                    .from(scTableName)
                    .select('*')
                    .eq(fkColumn, parentId);
                scData = sc || [];
            }

            // Auto-sync: insert sc_ rows missing from main table
            if (scTableName && scData.length > 0 && !isSingleton) {
                const existingIds = new Set((data || []).map(row => row.id));
                let needsRefresh = false;

                for (const sc of scData) {
                    if (existingIds.has(sc.id)) continue;
                    const insertPayload = { id: sc.id, [fkColumn]: parentId };
                    for (const col of allowedColumns) {
                        if (sc[col] !== undefined && sc[col] !== null) insertPayload[col] = sc[col];
                    }
                    const { error: insertError } = await supabase.from(tableName).insert([insertPayload]);
                    if (!insertError) needsRefresh = true;
                    else console.error(`Error syncing ${scTableName}:`, insertError.message);
                }

                if (needsRefresh) {
                    const { data: refreshed } = await supabase
                        .from(tableName).select('*').eq(fkColumn, parentId)
                        .order('created_at', { ascending: false });
                    if (refreshed) data = refreshed;
                }
            }

            if (isSingleton) {
                res.status(200).json({
                    data: data?.[0] || null,
                    source_data: scData?.[0] || null,
                });
            } else {
                res.status(200).json({ data: data || [], source_data: scData });
            }
        } catch (error) {
            console.error(`Error fetching ${tableName}:`, error);
            res.status(500).json({ error: error.message });
        }
    };

    const getById = async (req, res) => {
        try {
            const { id } = req.params;
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw new Error(error.message);
            res.status(200).json({ data });
        } catch (error) {
            console.error(`Error fetching ${tableName} by id:`, error);
            res.status(500).json({ error: error.message });
        }
    };

    const create = async (req, res) => {
        try {
            const parentId = req.params[fkParam];

            // Filter to allowed columns only
            const rowId = randomUUID();
            const insertData = { id: rowId, [fkColumn]: parentId };
            for (const col of allowedColumns) {
                if (req.body[col] !== undefined) {
                    insertData[col] = sanitizeValue(req.body[col]);
                }
            }

            if (isSingleton) {
                // For singleton tables, upsert directly into main table
                // Delete existing row first, then insert new one
                await supabase.from(tableName).delete().eq(fkColumn, parentId);
                const { data, error } = await supabase
                    .from(tableName)
                    .insert([insertData])
                    .select();
                if (error) throw new Error(error.message);
                res.status(201).json({ message: `${tableName} created successfully`, data });
            } else {
                // Insert into sc_ table only (auto-sync in getAll copies to main table)
                const targetTable = scTableName || tableName;
                const { data, error } = await supabase
                    .from(targetTable)
                    .insert([insertData])
                    .select();
                if (error) throw new Error(error.message);
                res.status(201).json({ message: `${targetTable} created successfully`, data });
            }
        } catch (error) {
            console.error(`Error creating ${scTableName || tableName}:`, error);
            res.status(500).json({ error: error.message });
        }
    };

    const update = async (req, res) => {
        try {
            const { id } = req.params;

            // Filter to allowed columns only
            const updateData = {};
            for (const col of allowedColumns) {
                if (req.body[col] !== undefined) {
                    updateData[col] = sanitizeValue(req.body[col]);
                }
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ error: 'No valid fields provided for update.' });
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
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id);

            if (error) throw new Error(error.message);
            res.status(200).json({ message: 'Deleted successfully' });
        } catch (error) {
            console.error(`Error deleting ${tableName}:`, error);
            res.status(500).json({ error: error.message });
        }
    };

    return { getAll, getById, create, update, remove };
};

// ═══════════════════════════════════════════════
// ── Core University CRUD ──
// ═══════════════════════════════════════════════

const addUniversity = async (req, res) => {
    try {
        const { name, url } = req.body;
        const files = req.files;
        const uploadedDocs = [];

        // Upload files to Supabase Storage
        if (files && files.length > 0) {
            for (const file of files) {
                const fileName = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
                try {
                    const { data, error } = await supabase
                        .storage
                        .from('university-docs')
                        .upload(fileName, file.buffer, { contentType: file.mimetype });

                    if (error) {
                        console.error('Error uploading file:', error.message);
                        uploadedDocs.push({
                            name: file.originalname,
                            type: file.mimetype,
                            uploaded_at: new Date().toISOString(),
                            upload_error: error.message,
                        });
                        continue;
                    }

                    const { data: publicUrlData } = supabase
                        .storage
                        .from('university-docs')
                        .getPublicUrl(fileName);

                    if (publicUrlData) {
                        uploadedDocs.push({
                            name: file.originalname,
                            url: publicUrlData.publicUrl,
                            type: file.mimetype,
                            uploaded_at: new Date().toISOString(),
                        });
                    }
                } catch (uploadErr) {
                    console.error('File upload failed:', uploadErr.message);
                    uploadedDocs.push({
                        name: file.originalname,
                        type: file.mimetype,
                        uploaded_at: new Date().toISOString(),
                        upload_error: uploadErr.message,
                    });
                }
            }
        }

        const universityId = randomUUID();

        // Insert into university table with new flat columns
        const { data, error } = await supabase
            .from('university')
            .insert([{
                id: universityId,
                short_name: name,
                full_legal_name: name,
                university_main_link: url,
                is_active: true,
            }])
            .select();

        if (error) throw new Error(error.message);

        // Also insert into sc_university for scraper
        const { error: scError } = await supabase
            .from('sc_university')
            .insert([{
                id: randomUUID(),
                university_id: universityId,
                short_name: name,
                university_main_link: url,
            }]);
        if (scError) {
            console.error('Error inserting into sc_university:', scError.message);
        }

        res.status(201).json({ message: 'University added successfully', data });
    } catch (error) {
        console.error('Error adding university:', error);
        res.status(500).json({ error: error.message });
    }
};

const getUniversities = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('university')
            .select('id, short_name, full_legal_name, university_main_link, is_active, created_at, updated_at')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching universities:', error);
        res.status(500).json({ error: error.message });
    }
};

const getUniversityById = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch core university data + all sub-entities in parallel
        const [
            uniResult,
            addressResult,
            metadataResult,
            rankingResult,
            accreditationResult,
            highlightResult,
            galleryResult,
            faqResult,
            facultyResult,
            hiringPartnerResult,
            alumniResult,
            placementStatsResult,
            financingResult,
            supportChannelsResult,
            // Source data (sc_ tables)
            scUniResult,
            scAddressResult,
            scMetadataResult,
            scRankingResult,
            scAccreditationResult,
            scGalleryResult,
            scFaqResult,
            scFacultyResult,
            scHiringPartnerResult,
            scAlumniResult,
            scPlacementStatsResult,
            scFinancingResult,
            scholarshipResult,
            scScholarshipResult,
        ] = await Promise.all([
            // Main tables
            supabase.from('university').select('*').eq('id', id).single(),
            supabase.from('university_address').select('*').eq('university_id', id),
            supabase.from('uni_metadata').select('*').eq('university_id', id),
            supabase.from('university_ranking').select('*').eq('university_id', id),
            supabase.from('university_accreditation').select('*').eq('university_id', id),
            supabase.from('university_highlight').select('*').eq('university_id', id),
            supabase.from('university_gallery').select('*').eq('university_id', id),
            supabase.from('university_faq').select('*').eq('university_id', id),
            supabase.from('university_faculty').select('*').eq('university_id', id),
            supabase.from('hiring_partner').select('*').eq('university_id', id),
            supabase.from('alumni_success').select('*').eq('university_id', id),
            supabase.from('placement_stats').select('*').eq('university_id', id),
            supabase.from('financing_options').select('*').eq('university_id', id),
            supabase.from('support_channels').select('*').eq('university_id', id),
            // Source (sc_) tables
            supabase.from('sc_university').select('*').eq('university_id', id).single(),
            supabase.from('sc_university_address').select('*').eq('university_id', id),
            supabase.from('sc_uni_metadata').select('*').eq('university_id', id),
            supabase.from('sc_university_ranking').select('*').eq('university_id', id),
            supabase.from('sc_university_accreditation').select('*').eq('university_id', id),
            supabase.from('sc_university_gallery').select('*').eq('university_id', id),
            supabase.from('sc_university_faq').select('*').eq('university_id', id),
            supabase.from('sc_university_faculty').select('*').eq('university_id', id),
            supabase.from('sc_hiring_partner').select('*').eq('university_id', id),
            supabase.from('sc_alumni_success').select('*').eq('university_id', id),
            supabase.from('sc_placement_stats').select('*').eq('university_id', id),
            supabase.from('sc_financing_options').select('*').eq('university_id', id),
            supabase.from('university_scholarship').select('*').eq('university_id', id),
            supabase.from('sc_university_scholarship').select('*').eq('university_id', id),
        ]);

        if (uniResult.error) throw new Error(uniResult.error.message);

        res.status(200).json({
            ...uniResult.data,
            addresses: addressResult.data || [],
            metadata: metadataResult.data || [],
            rankings: rankingResult.data || [],
            accreditations: accreditationResult.data || [],
            highlights: highlightResult.data || [],
            gallery: galleryResult.data || [],
            faqs: faqResult.data || [],
            faculty: facultyResult.data || [],
            hiring_partners: hiringPartnerResult.data || [],
            alumni: alumniResult.data || [],
            placement_stats: placementStatsResult.data || [],
            financing_options: financingResult.data || [],
            support_channels: supportChannelsResult.data || [],
            scholarships: scholarshipResult.data || [],
            source_data: {
                university: scUniResult.data || null,
                addresses: scAddressResult.data || [],
                metadata: scMetadataResult.data || [],
                rankings: scRankingResult.data || [],
                accreditations: scAccreditationResult.data || [],
                gallery: scGalleryResult.data || [],
                faqs: scFaqResult.data || [],
                faculty: scFacultyResult.data || [],
                hiring_partners: scHiringPartnerResult.data || [],
                alumni: scAlumniResult.data || [],
                placement_stats: scPlacementStatsResult.data || [],
                financing_options: scFinancingResult.data || [],
                scholarships: scScholarshipResult.data || [],
            },
        });
    } catch (error) {
        console.error('Error fetching university:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateUniversity = async (req, res) => {
    try {
        const { id } = req.params;
        const allowedColumns = [
            'short_name', 'full_legal_name', 'slug', 'establishment_year',
            'logo_url', 'banner_image_url', 'brochure_url', 'brand_primary_hex',
            'is_wes_approved', 'has_campus_access', 'partner_code', 'is_active',
            'university_main_link',
        ];

        const updateData = {};
        for (const col of allowedColumns) {
            if (req.body[col] !== undefined) {
                updateData[col] = sanitizeValue(req.body[col]);
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided for update.' });
        }

        const { data, error } = await supabase
            .from('university')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Updated successfully', data });
    } catch (error) {
        console.error('Error updating university:', error);
        res.status(500).json({ error: error.message });
    }
};

// ═══════════════════════════════════════════════
// ── Sub-Entity CRUD Handlers (University-scoped) ──
// ═══════════════════════════════════════════════

const addressHandlers = createSubEntityHandlers(
    'university_address', 'sc_university_address',
    ['campus_type', 'address_line', 'city', 'state', 'pincode', 'latitude', 'longitude', 'maps_embed_url', 'nearest_transport_hub']
);

const metadataHandlers = createSubEntityHandlers(
    'uni_metadata', 'sc_uni_metadata',
    ['meta_title', 'meta_description', 'canonical_url', 'og_image_url', 'schema_markup', 'keywords_vector'],
    { isSingleton: true }
);

const rankingHandlers = createSubEntityHandlers(
    'university_ranking', 'sc_university_ranking',
    ['agency', 'ranking_year', 'rank_value', 'rank_band', 'category', 'rank_display_text', 'verification_url', 'is_primary_highlight']
);

const accreditationHandlers = createSubEntityHandlers(
    'university_accreditation', 'sc_university_accreditation',
    ['accreditation_body', 'grade', 'score', 'accreditation_year', 'proof_doc_url', 'is_international']
);

const highlightHandlers = createSubEntityHandlers(
    'university_highlight', 'sc_university_highlight',
    ['highlight_type', 'title', 'description', 'icon_svg_code', 'display_order', 'is_featured']
);

const galleryHandlers = createSubEntityHandlers(
    'university_gallery', 'sc_university_gallery',
    ['media_type', 'category', 'url', 'thumbnail_url', 'caption', 'is_featured', 'is_360_virtual_tour']
);

const faqHandlers = createSubEntityHandlers(
    'university_faq', 'sc_university_faq',
    ['category', 'question', 'answer_html', 'display_order', 'search_vector', 'is_active']
);

const facultyHandlers = createSubEntityHandlers(
    'university_faculty', 'sc_university_faculty',
    ['name', 'designation', 'qualification', 'industry_exp_years', 'profile_image_url', 'linkedin_url', 'video_intro_url', 'is_star_faculty']
);

const hiringPartnerHandlers = createSubEntityHandlers(
    'hiring_partner', 'sc_hiring_partner',
    ['company_name', 'logo_url', 'industry_sector', 'is_key_recruiter', 'is_active_hiring']
);

const alumniHandlers = createSubEntityHandlers(
    'alumni_success', 'sc_alumni_success',
    ['name', 'current_company', 'designation', 'hike_percentage', 'testimonial_text', 'video_url', 'image_url', 'linkedin_profile_url']
);

const placementStatsHandlers = createSubEntityHandlers(
    'placement_stats', 'sc_placement_stats',
    ['academic_year', 'highest_package_lpa', 'avg_package_lpa', 'placement_percentage', 'total_recruiters', 'report_pdf_url']
);

const financingHandlers = createSubEntityHandlers(
    'financing_options', 'sc_financing_options',
    ['finance_type', 'provider_name', 'interest_rate_pct', 'approval_tat_hours', 'tenure_months', 'min_loan_amount', 'is_paperless']
);

const supportChannelsHandlers = createSubEntityHandlers(
    'support_channels', 'sc_support_channels',
    ['channel_type', 'contact_value', 'availability_hours', 'response_sla_hours', 'is_bot_enabled', 'is_emergency_contact']
);

// ── Progress calculation: count how many sections have data ──
const PROGRESS_TABLES = [
    'university_address',
    'uni_metadata',
    'university_ranking',
    'university_accreditation',
    'university_highlight',
    'university_gallery',
    'university_faq',
    'university_faculty',
    'hiring_partner',
    'placement_stats',
    'program_master',
    'financing_options',
    'support_channels',
];

const scholarshipHandlers = createSubEntityHandlers(
    'university_scholarship', 'sc_university_scholarship',
    ['provider_name', 'scholarship_name', 'scholarship_type', 'degree_level', 'field_of_study', 'scholarship_value', 'eligibility_criteria']
);

const TOTAL_SECTIONS = PROGRESS_TABLES.length; // 13

const getUniversitiesWithProgress = async (req, res) => {
    try {
        // 1. Fetch all universities
        const { data: universities, error } = await supabase
            .from('university')
            .select('id, short_name, full_legal_name, university_main_link, is_active, created_at, updated_at')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        if (!universities || universities.length === 0) return res.status(200).json([]);

        // 2. For each table, fetch all university_ids that have data (one query per table)
        const sectionSets = await Promise.all(
            PROGRESS_TABLES.map(async (table) => {
                try {
                    const { data: rows, error: tErr } = await supabase
                        .from(table)
                        .select('university_id');
                    if (tErr || !rows) return new Set();
                    return new Set(rows.map(r => r.university_id));
                } catch {
                    return new Set();
                }
            })
        );

        // 3. Compute progress per university in JS
        const results = universities.map(uni => {
            const filledSections = sectionSets.filter(s => s.has(uni.id)).length;
            return {
                ...uni,
                progress: Math.round((filledSections / TOTAL_SECTIONS) * 100),
            };
        });

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching universities with progress:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    // Core university
    addUniversity,
    getUniversities,
    getUniversitiesWithProgress,
    getUniversityById,
    updateUniversity,
    // Sub-entity handlers
    addressHandlers,
    metadataHandlers,
    rankingHandlers,
    accreditationHandlers,
    highlightHandlers,
    galleryHandlers,
    faqHandlers,
    facultyHandlers,
    hiringPartnerHandlers,
    alumniHandlers,
    placementStatsHandlers,
    financingHandlers,
    supportChannelsHandlers,
    scholarshipHandlers,
};
