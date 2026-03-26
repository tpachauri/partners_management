const supabase = require('../config/supabase');
const { randomUUID } = require('crypto');
// Helper: convert empty strings to null for non-text DB columns
const sanitizeValue = (val) => {
    if (val === '' || val === undefined) return null;
    return val;
};

// ═══════════════════════════════════════════════
// ── Offer Master Policy ──
// ═══════════════════════════════════════════════

const OFFER_POLICY_COLUMNS = [
    'policy_name', 'coupon_name', 'coupon_subtext', 'currency_type',
    'coupon_code', 'auto_apply', 'visible_tray', 'value_config_json',
    'funding_source_entity', 'commission_calc_basis', 'stacking_group',
    'gst_inclusive', 'max_discount', 'max_claims_per_user',
    'valid_from', 'valid_to', 'applicable_days', 'applicable_time_window',
    'blackout_days_applicable', 'is_active',
];

const getOfferPolicies = async (req, res) => {
    try {
        let data = [];
        let scData = [];

        const mainResult = await supabase
            .from('offer_master_policy')
            .select('*')
            .order('created_at', { ascending: false });

        if (mainResult.error) {
            console.warn('offer_master_policy table may not exist:', mainResult.error.message?.substring(0, 100));
        } else {
            data = mainResult.data || [];
        }

        const scResult = await supabase
            .from('sc_offer_master_policy')
            .select('*');

        if (!scResult.error) {
            scData = scResult.data || [];
        }

        res.status(200).json({ data, source_data: scData });
    } catch (error) {
        console.error('Error fetching offer policies:', error);
        res.status(500).json({ error: error.message });
    }
};

const createOfferPolicy = async (req, res) => {
    try {
        const insertData = { id: randomUUID() };
        for (const col of OFFER_POLICY_COLUMNS) {
            if (req.body[col] !== undefined) insertData[col] = sanitizeValue(req.body[col]);
        }

        const { data, error } = await supabase
            .from('offer_master_policy')
            .insert([insertData])
            .select();

        if (error) throw new Error(error.message);
        res.status(201).json({ message: 'Offer policy created', data });
    } catch (error) {
        console.error('Error creating offer policy:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateOfferPolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {};
        for (const col of OFFER_POLICY_COLUMNS) {
            if (req.body[col] !== undefined) updateData[col] = sanitizeValue(req.body[col]);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided.' });
        }

        const { data, error } = await supabase
            .from('offer_master_policy')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Updated successfully', data });
    } catch (error) {
        console.error('Error updating offer policy:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteOfferPolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('offer_master_policy').delete().eq('id', id);
        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer policy:', error);
        res.status(500).json({ error: error.message });
    }
};

// ═══════════════════════════════════════════════
// ── Opportunity Offer Ledger ──
// ═══════════════════════════════════════════════

const OFFER_LEDGER_COLUMNS = [
    'opportunity_id', 'policy_id', 'applied_source_type', 'source_ref_id',
    'frozen_discount_value', 'burn_source_entity', 'commission_impact_mode',
    'ledger_status', 'revocation_reason', 'applied_at', 'consumed_at',
];

const getOfferLedger = async (req, res) => {
    try {
        let data = [];
        let scData = [];

        const mainResult = await supabase
            .from('opportunity_offer_ledger')
            .select('*')
            .order('applied_at', { ascending: false });

        if (mainResult.error) {
            console.warn('opportunity_offer_ledger table may not exist:', mainResult.error.message?.substring(0, 100));
        } else {
            data = mainResult.data || [];
        }

        const scResult = await supabase
            .from('sc_opportunity_offer_ledger')
            .select('*');

        if (!scResult.error) {
            scData = scResult.data || [];
        }

        res.status(200).json({ data, source_data: scData });
    } catch (error) {
        console.error('Error fetching offer ledger:', error);
        res.status(500).json({ error: error.message });
    }
};

const createOfferLedgerEntry = async (req, res) => {
    try {
        const insertData = { id: randomUUID() };
        for (const col of OFFER_LEDGER_COLUMNS) {
            if (req.body[col] !== undefined) insertData[col] = sanitizeValue(req.body[col]);
        }

        const { data, error } = await supabase
            .from('opportunity_offer_ledger')
            .insert([insertData])
            .select();

        if (error) throw new Error(error.message);
        res.status(201).json({ message: 'Offer ledger entry created', data });
    } catch (error) {
        console.error('Error creating offer ledger entry:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateOfferLedgerEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {};
        for (const col of OFFER_LEDGER_COLUMNS) {
            if (req.body[col] !== undefined) updateData[col] = sanitizeValue(req.body[col]);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided.' });
        }

        const { data, error } = await supabase
            .from('opportunity_offer_ledger')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Updated successfully', data });
    } catch (error) {
        console.error('Error updating offer ledger entry:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteOfferLedgerEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('opportunity_offer_ledger').delete().eq('id', id);
        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer ledger entry:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getOfferPolicies,
    createOfferPolicy,
    updateOfferPolicy,
    deleteOfferPolicy,
    getOfferLedger,
    createOfferLedgerEntry,
    updateOfferLedgerEntry,
    deleteOfferLedgerEntry,
};
