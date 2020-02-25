export const MutualCreditBindings = {
  MutualCreditProvider: Symbol("mutual-credit-provider")
};

export interface Transaction {
  id: string;

  sender: string;
  receiver: string;
  amount: Number;
  timestamp: Number;
}