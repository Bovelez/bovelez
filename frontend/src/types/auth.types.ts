export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  name: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};
