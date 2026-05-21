export const generateOTP = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};
export const verifyOTP = (inputOTP: string, storedOTP: string | null):
    boolean => {
    if (!storedOTP) return false;
    return inputOTP === storedOTP;
};