export interface User {
  id: number;
  username: string;
  name: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends TokenPair {
  user: User;
}

export interface LoginPayload {
  username: string;
  password: string;
}
