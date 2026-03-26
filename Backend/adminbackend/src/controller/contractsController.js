const supabase = require('../config/supabase');
const { randomUUID } = require('crypto');
// Helper: convert empty strings to null for non-text DB columns
const sanitizeValue = (val) => {
    if (val === '' || val === undefined) return null;
    return val;
};

// ═══════════════════════════════════════════════
// ── Uni Contract Master (university-scoped) ──
// ═══════════════════════════════════════════════

const CONTRACT_COLUMNS = [
    'contract_ref_code', 'contract_status', 'payout_model',
    'default_commission_value', 'calculation_basis_type', 'is_gst_exclusive',
    'invoice_trigger_event', 'credit_period_days', 'clawback_window_days',
    'retention_bonus_clause', 'effective_from', 'effective_to', 'signed_doc_url',
];

const getContracts = async (req, res) => {
    try {
        const { universityId } = req.params;

        let { data, error } = await supabase
            .from('uni_contract_master')
            .select('*')
            .eq('university_id', universityId);

        if (error) throw new Error(error.message);

        // Auto-create if none exists
        if (!data || data.length === 0) {
            const { data: created, error: createErr } = await supabase
                .from('uni_contract_master')
                .insert([{ id: randomUUID(), university_id: universityId }])
                .select();
            if (createErr) throw new Error(createErr.message);
            data = created;
        }

        const { data: scData } = await supabase
            .from('sc_uni_contract_master')
            .select('*')
            .eq('university_id', universityId);

        res.status(200).json({ data: data || [], source_data: scData || [] });
    } catch (error) {
        console.error('Error fetching contracts:', error);
        res.status(500).json({ error: error.message });
    }
};

const createContract = async (req, res) => {
    try {
        const { universityId } = req.params;
        const insertData = { id: randomUUID(), university_id: universityId };

        for (const col of CONTRACT_COLUMNS) {
            if (req.body[col] !== undefined) insertData[col] = sanitizeValue(req.body[col]);
        }

        const { data, error } = await supabase
            .from('uni_contract_master')
            .insert([insertData])
            .select();

        if (error) throw new Error(error.message);
        res.status(201).json({ message: 'Contract created', data });
    } catch (error) {
        console.error('Error creating contract:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateContract = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {};
        for (const col of CONTRACT_COLUMNS) {
            if (req.body[col] !== undefined) updateData[col] = sanitizeValue(req.body[col]);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided.' });
        }

        const { data, error } = await supabase
            .from('uni_contract_master')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Updated successfully', data });
    } catch (error) {
        console.error('Error updating contract:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteContract = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('uni_contract_master').delete().eq('id', id);
        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting contract:', error);
        res.status(500).json({ error: error.message });
    }
};

// ═══════════════════════════════════════════════
// ── Contract Addendum Versioning ──
// ═══════════════════════════════════════════════

const ADDENDUM_COLUMNS = [
    'addendum_ref_code', 'addendum_type', 'version_number',
    'change_description', 'scope_restriction_json', 'is_digitally_signed',
    'approval_workflow_id', 'effective_from', 'effective_to',
    'created_by_user_id', 'status',
];

const getAddendums = async (req, res) => {
    try {
        const { contractId } = req.params;
        const { data, error } = await supabase
            .from('contract_addendum_versioning')
            .select('*')
            .eq('master_contract_id', contractId)
            .order('version_number', { ascending: true });

        if (error) throw new Error(error.message);

        const { data: scData } = await supabase
            .from('sc_contract_addendum_versioning')
            .select('*')
            .eq('master_contract_id', contractId);

        res.status(200).json({ data: data || [], source_data: scData || [] });
    } catch (error) {
        console.error('Error fetching addendums:', error);
        res.status(500).json({ error: error.message });
    }
};

const createAddendum = async (req, res) => {
    try {
        const { contractId } = req.params;
        const insertData = { id: randomUUID(), master_contract_id: contractId };

        for (const col of ADDENDUM_COLUMNS) {
            if (req.body[col] !== undefined) insertData[col] = sanitizeValue(req.body[col]);
        }

        const { data, error } = await supabase
            .from('contract_addendum_versioning')
            .insert([insertData])
            .select();

        if (error) throw new Error(error.message);
        res.status(201).json({ message: 'Addendum created', data });
    } catch (error) {
        console.error('Error creating addendum:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateAddendum = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {};
        for (const col of ADDENDUM_COLUMNS) {
            if (req.body[col] !== undefined) updateData[col] = sanitizeValue(req.body[col]);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided.' });
        }

        const { data, error } = await supabase
            .from('contract_addendum_versioning')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Updated successfully', data });
    } catch (error) {
        console.error('Error updating addendum:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteAddendum = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('contract_addendum_versioning').delete().eq('id', id);
        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting addendum:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getContracts,
    createContract,
    updateContract,
    deleteContract,
    getAddendums,
    createAddendum,
    updateAddendum,
    deleteAddendum,
};
