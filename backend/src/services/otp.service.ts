import crypto from 'crypto';
export const generateOTP = (): string => {
    return crypto.randomInt(100000, 999999).toString();
};
export const verifyOTP = (inputOTP: string, storedOTP: string | null):
    boolean => {
    if (!storedOTP) return false;
    return inputOTP === storedOTP;
};
