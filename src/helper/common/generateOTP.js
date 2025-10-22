import crypto from "crypto";

function generateOTP() {
    return crypto.randomInt(100000, 999999);
};
export default generateOTP;