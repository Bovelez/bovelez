import { User } from '@prisma/client';
import { CreateUserInput } from '../input/create-user.input';
export interface IAuthRepository {
  findById(id: string): Promise<User | null>;
  create(user: CreateUserInput): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
}
