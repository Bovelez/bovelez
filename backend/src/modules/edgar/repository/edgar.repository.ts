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
    const client = this.prisma as any;
    return client.edgarCompany.upsert({
      where: { cik: company.cik },
      update: { ticker: company.ticker.toUpperCase(), name: company.name },
      create: { cik: company.cik, ticker: company.ticker.toUpperCase(), name: company.name },
    }) as Promise<EdgarCompanyRecord>;
  }

  async findByTicker(ticker: string): Promise<EdgarCompanyRecord | null> {
    const client = this.prisma as any;
    return client.edgarCompany.findUnique({
      where: { ticker: ticker.toUpperCase() },
    }) as Promise<EdgarCompanyRecord | null>;
  }

  async findAll(): Promise<EdgarCompanyRecord[]> {
    const client = this.prisma as any;
    return client.edgarCompany.findMany({
      orderBy: { ticker: 'asc' },
    }) as Promise<EdgarCompanyRecord[]>;
  }
}
