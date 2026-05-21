import { Position } from '@prisma/client';

export class PositionDto {
  id: string;
  ticker: string;
  quantity: number;
  buyPrice: number;
  buyDate: Date;

  constructor(position: Position) {
    this.id = position.id;
    this.ticker = position.ticker;
    this.quantity = position.quantity;
    this.buyPrice = position.buyPrice;
    this.buyDate = position.buyDate;
  }
}
