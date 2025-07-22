export const getTransactionId = () => {
  return `TrxID_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};
