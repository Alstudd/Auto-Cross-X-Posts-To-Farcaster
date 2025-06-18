export interface User {
  connected: boolean;
  timestamp: number;
}

export interface Message {
  type: string;
  payload?: any;
}

export interface WalletConnection {
  address: string;
  chainId: number;
} 