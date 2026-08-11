export const getDashboardRoute = (role: string): string => {
  return role === 'SHIPPER' ? '/shipper' : '/driver';
};
