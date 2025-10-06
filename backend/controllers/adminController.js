const dashboard = (req, res) => {
    res.status(200).json({ message: "Welcome to the Admin Dashboard" });
}


const adminLogin = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    // For demonstration, using hardcoded admin credentials
    if (email === "process.env.ADMIN_EMAIL" && password === "process.env.ADMIN_PASSWORD") {
        return res.status(200).json({ message: "Admin login successful" });
    }
    return res.status(401).json({ message: "Invalid admin credentials" });
}

export {dashboard, adminLogin};