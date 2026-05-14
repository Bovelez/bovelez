import { User } from '@prisma/client';

export interface IUsersRepository {
  findById(id: string): Promise<User | null>;
  deleteById(id: string): Promise<void>;
}
