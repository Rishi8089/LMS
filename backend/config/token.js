import JWT from "jsonwebtoken";

const generateToken = async (employeeID) => {
    try {
        const token = await JWT.sign({ employeeID }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        });
        console.log(token);
    } catch (error) {
        console.log(error);
        throw new Error("Token generation failed");
    }
};

export default generateToken;
