const supabase = require('../config/supabase');

/**
 * GET /api/universities/lsq/latest
 * Query params: university_id (required), target_table (required),
 *               program_id (optional), offering_id (optional)
 * Returns the most recent lsq entry for a given university + target_table,
 * optionally scoped to a program or offering.
 */
const getLatest = async (req, res) => {
    try {
        const { university_id, target_table, program_id, offering_id } = req.query;
        if (!university_id || !target_table) {
            return res.status(400).json({ error: 'university_id and target_table are required' });
        }

        let query = supabase
            .from('lsq')
            .select('*')
            .eq('university_id', university_id)
            .eq('target_table', target_table);

        if (program_id) query = query.eq('program_id', program_id);
        if (offering_id) query = query.eq('offering_id', offering_id);

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw new Error(error.message);

        res.json({ data: data || null });
    } catch (err) {
        console.error('lsqController.getLatest error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/universities/lsq/all
 * Query params: university_id (required), status (optional)
 * Returns all lsq entries for a university, optionally filtered by status.
 */
const getAll = async (req, res) => {
    try {
        const { university_id, status } = req.query;
        if (!university_id) {
            return res.status(400).json({ error: 'university_id is required' });
        }

        let query = supabase
            .from('lsq')
            .select('*')
            .eq('university_id', university_id)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw new Error(error.message);

        res.json({ data: data || [] });
    } catch (err) {
        console.error('lsqController.getAll error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/universities/lsq/offering-latest
 * Query params: university_id (required), offering_id (required)
 * Returns the latest LSQ entry for each offering sub-entity table.
 */
const getOfferingLatest = async (req, res) => {
    try {
        const { university_id, offering_id } = req.query;
        if (!university_id || !offering_id) {
            return res.status(400).json({ error: 'university_id and offering_id are required' });
        }

        const targetTables = [
            'program_curriculum', 'program_eligibility',
            'fee_structure', 'program_addon', 'offering_faculty',
        ];

        const results = {};
        for (const tt of targetTables) {
            const { data } = await supabase
                .from('lsq')
                .select('*')
                .eq('university_id', university_id)
                .eq('offering_id', offering_id)
                .eq('target_table', tt)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (data) results[tt] = data;
        }

        res.json({ data: results });
    } catch (err) {
        console.error('lsqController.getOfferingLatest error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getLatest, getAll, getOfferingLatest };
