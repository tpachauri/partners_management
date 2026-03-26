const supabase = require("../config/supabase");
const authMiddleware = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        console.log('Auth header received:', header);  // Debug
        if (!header) {
            res.status(401).json({ error: "Authorization Error not found" });
            return;
        }
        const token = header.split(" ")[1];
        console.log('Token extracted (first 50 chars):', token ? token.substring(0, 50) : 'NONE');
        console.log('Token length:', token ? token.length : 0);
        if (!token) {
            res.status(401).json({ error: "Token not found" });
            return;
        }
        const { data, error } = await supabase.auth.getUser(token);
        console.log('Supabase getUser response - error:', error);
        console.log('Supabase getUser response - data:', data);
        if (error || !data.user) {
            res.status(401).json({ error: "Invalid or expired token", details: error?.message });
            return;
        }
        req.user = data.user;
        next();

    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = authMiddleware;