import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  IEdgarRepository,
  EdgarCompanyRecord,
} from './edgar.repository.interface';
import { IEdgarCompany } from '../interfaces/edgar.interface';

@Injectable()
export class EdgarRepository implements IEdgarRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertCompany(company: IEdgarCompany): Promise<EdgarCompanyRecord> {
    return this.prisma.edgarCompany.upsert({
      where: { cik: company.cik },
      update: { ticker: company.ticker.toUpperCase(), name: company.name },
      create: {
        cik: company.cik,
        ticker: company.ticker.toUpperCase(),
        name: company.name,
      },
    });
  }

  async findByTicker(ticker: string): Promise<EdgarCompanyRecord | null> {
    return this.prisma.edgarCompany.findUnique({
      where: { ticker: ticker.toUpperCase() },
    });
  }

  async findAll(): Promise<EdgarCompanyRecord[]> {
    return this.prisma.edgarCompany.findMany({
      orderBy: { ticker: 'asc' },
    });
  }
}
