const supabase = require('../config/supabase');

const signup = async (req, res) => {
    try {
        const { email, password } = req.body;
        const domain = email.split('@')[1];
        if (domain !== 'herovired.com') {
            res.status(403).json({ error: "You are not authorized to create the account." });
            return;
        }
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        if (error) {
            throw new Error(error.message);
        }

        // Create profile row linked to auth user
        if (data.user) {
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert([{ id: data.user.id, email }]);

            if (profileError) {
                console.error('Error creating user profile:', profileError.message);
            }
        }

        res.status(200).json({ "User created successfully": data });

    } catch (error) {
        res.status(500).json(error.message);
    }
}

const signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const domain = email.split('@')[1];
        if (domain !== 'herovired.com') {
            res.status(403).json({ error: "You are not authorized to login." });
            return;
        }
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) {
            throw new Error(error.message);
        }
        res.status(200).json({ "User logged in Successfully": data });
    }
    catch (error) {
        res.status(500).json(error.message);
    }
}
const signout = async (req, res) => {
    try {
        const { data, error } = await supabase.auth.signOut();
        if (error) {
            throw new Error(error.message);
        }
        res.status(200).json({ message: "User logged out successfully" });
    }
    catch (error) {
        res.status(500).json(error.message);
    }
}
const getUser = async (req, res) => {
    try {
        // Fetch profile data from user_profiles table
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching user profile:', error.message);
        }

        res.status(200).json({
            User: {
                ...req.user,
                profile: data || null,
            }
        });
    } catch (error) {
        res.status(500).json(error.message);
    }
}
const enrollMFA = async (req, res) => {
    try {
        const { data, error } = await supabase.auth.mfa.enroll({
            factorType: 'phone',
            phone: req.body.phone
        });
        if (error) {
            throw new Error(error.message);
        }
        res.status(200).json({ "MFA enrolled successfully": data });
    }
    catch (error) {
        res.status(500).json(error.message);
    }
}
const challengeMFA = async (req, res) => {
    try {
        const { data, error } = await supabase.auth.mfa.challenge({
            factorId: req.body.factorId,
        });
        if (error) {
            throw new Error(error.message);
        }
        res.status(200).json({ "MFA challenged successfully": data });
    }
    catch (error) {
        res.status(500).json(error.message);
    }
}
const verifyMFA = async (req, res) => {
    try {
        const { data, error } = await supabase.auth.mfa.verify({
            factorId: req.body.factorId,
            challengeId: req.body.challengeId,
            code: req.body.code
        });
        if (error) {
            throw new Error(error.message);
        }
        res.status(200).json({ "MFA verified successfully": data });
    }
    catch (error) {
        res.status(500).json(error.message);
    }
}

const unenrollMFA = async (req, res) => {
    try {
        const { data, error } = await supabase.auth.mfa.unenroll({
            factorId: req.body.factorId
        });
        if (error) {
            throw new Error(error.message);
        }
        res.status(200).json({ "MFA unenrolled successfully": data });
    }
    catch (error) {
        res.status(500).json(error.message);
    }
}
module.exports = { signup, signin, signout, getUser, enrollMFA, challengeMFA, verifyMFA, unenrollMFA };