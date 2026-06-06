export const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};
export const validateOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};
export const validateDimensions = (
  length: number,
  width: number,
  height: number,

): boolean => {
  return length > 0 && width > 0 && height > 0;
};
