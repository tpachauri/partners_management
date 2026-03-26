const supabase = require('../config/supabase');
const { randomUUID } = require('crypto');
// Helper: convert empty strings to null for non-text DB columns
const sanitizeValue = (val) => {
    if (val === '' || val === undefined) return null;
    return val;
};

// ═══════════════════════════════════════════════
// ── Partner Payout Config Rule ──
// ═══════════════════════════════════════════════

const PAYOUT_RULE_COLUMNS = [
    'partner_contract_id', 'rule_name', 'payout_component',
    'calculation_mode', 'payout_value', 'stacking_strategy',
    'slab_min_qty', 'slab_max_qty', 'is_retroactive',
    'applicable_product_ids', 'valid_from', 'valid_to', 'priority_score',
];

const getPayoutRules = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('partner_payout_config_rule')
            .select('*')
            .order('priority_score', { ascending: true });

        if (error) throw new Error(error.message);

        const { data: scData } = await supabase
            .from('sc_partner_payout_config_rule')
            .select('*');

        res.status(200).json({ data: data || [], source_data: scData || [] });
    } catch (error) {
        console.error('Error fetching payout rules:', error);
        res.status(500).json({ error: error.message });
    }
};

const getPayoutRulesByContract = async (req, res) => {
    try {
        const { contractId } = req.params;
        const { data, error } = await supabase
            .from('partner_payout_config_rule')
            .select('*')
            .eq('partner_contract_id', contractId)
            .order('priority_score', { ascending: true });

        if (error) throw new Error(error.message);

        const { data: scData } = await supabase
            .from('sc_partner_payout_config_rule')
            .select('*')
            .eq('partner_contract_id', contractId);

        res.status(200).json({ data: data || [], source_data: scData || [] });
    } catch (error) {
        console.error('Error fetching payout rules by contract:', error);
        res.status(500).json({ error: error.message });
    }
};

const createPayoutRule = async (req, res) => {
    try {
        const insertData = { id: randomUUID() };
        for (const col of PAYOUT_RULE_COLUMNS) {
            if (req.body[col] !== undefined) insertData[col] = sanitizeValue(req.body[col]);
        }

        const { data, error } = await supabase
            .from('partner_payout_config_rule')
            .insert([insertData])
            .select();

        if (error) throw new Error(error.message);
        res.status(201).json({ message: 'Payout rule created', data });
    } catch (error) {
        console.error('Error creating payout rule:', error);
        res.status(500).json({ error: error.message });
    }
};

const updatePayoutRule = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {};
        for (const col of PAYOUT_RULE_COLUMNS) {
            if (req.body[col] !== undefined) updateData[col] = sanitizeValue(req.body[col]);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided.' });
        }

        const { data, error } = await supabase
            .from('partner_payout_config_rule')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Updated successfully', data });
    } catch (error) {
        console.error('Error updating payout rule:', error);
        res.status(500).json({ error: error.message });
    }
};

const deletePayoutRule = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('partner_payout_config_rule').delete().eq('id', id);
        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting payout rule:', error);
        res.status(500).json({ error: error.message });
    }
};

// ═══════════════════════════════════════════════
// ── Partner Wallet ──
// ═══════════════════════════════════════════════

const WALLET_COLUMNS = [
    'partner_id', 'currency', 'accrued_balance', 'withdrawable_balance',
    'held_balance', 'total_lifetime_earnings', 'total_lifetime_withdrawn',
    'last_ledger_entry_id', 'wallet_version', 'is_frozen',
];

const getPartnerWallets = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('partner_wallet')
            .select('*');

        if (error) throw new Error(error.message);

        const { data: scData } = await supabase
            .from('sc_partner_wallet')
            .select('*');

        res.status(200).json({ data: data || [], source_data: scData || [] });
    } catch (error) {
        console.error('Error fetching partner wallets:', error);
        res.status(500).json({ error: error.message });
    }
};

const getWalletByPartner = async (req, res) => {
    try {
        const { partnerId } = req.params;
        const { data, error } = await supabase
            .from('partner_wallet')
            .select('*')
            .eq('partner_id', partnerId)
            .single();

        if (error && error.code !== 'PGRST116') throw new Error(error.message);

        const { data: scData } = await supabase
            .from('sc_partner_wallet')
            .select('*')
            .eq('partner_id', partnerId)
            .single();

        res.status(200).json({ data: data || null, source_data: scData || null });
    } catch (error) {
        console.error('Error fetching partner wallet:', error);
        res.status(500).json({ error: error.message });
    }
};

const createWallet = async (req, res) => {
    try {
        const insertData = { id: randomUUID() };
        for (const col of WALLET_COLUMNS) {
            if (req.body[col] !== undefined) insertData[col] = sanitizeValue(req.body[col]);
        }

        const { data, error } = await supabase
            .from('partner_wallet')
            .insert([insertData])
            .select();

        if (error) throw new Error(error.message);
        res.status(201).json({ message: 'Wallet created', data });
    } catch (error) {
        console.error('Error creating wallet:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {};
        for (const col of WALLET_COLUMNS) {
            if (req.body[col] !== undefined) updateData[col] = sanitizeValue(req.body[col]);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided.' });
        }

        const { data, error } = await supabase
            .from('partner_wallet')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Updated successfully', data });
    } catch (error) {
        console.error('Error updating wallet:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getPayoutRules,
    getPayoutRulesByContract,
    createPayoutRule,
    updatePayoutRule,
    deletePayoutRule,
    getPartnerWallets,
    getWalletByPartner,
    createWallet,
    updateWallet,
};
