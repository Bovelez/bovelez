import { Position } from '@prisma/client';
import { UpdatePositionInput } from '../input/update-position.input';
import { CreatePositionInput } from '../input/create-position.input';

export interface IPortfolioRepository {
  create(userId: string, data:CreatePositionInput): Promise<Position>;
  findById(id: string): Promise<Position | null>;
  findAllByUser(userId: string): Promise<Position[]>;
  update(id: string, data: UpdatePositionInput): Promise<Position>;
  delete(id: string): Promise<void>;
}
