import { and, asc, eq, ilike, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { reservists, type Reservist } from '../../../infrastructure/db/schema/reservists.js';
import type { ListReservistsQuery, ListReservistsResponse } from './dto.js';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export class ReservistRepository {
  constructor(private readonly db: NodePgDatabase) {}
  async list(query: ListReservistsQuery): Promise<ListReservistsResponse> {
    const filters = [
      query.q
        ? or(ilike(reservists.name, `%${query.q}%`), ilike(reservists.nationalId, `%${query.q}%`))
        : undefined,
      query.checkedIn === true ? isNotNull(reservists.checkedInAt) : undefined,
      query.checkedIn === false ? isNull(reservists.checkedInAt) : undefined,
    ].filter((f): f is NonNullable<typeof f> => f !== undefined);

    const where = filters.length > 0 ? and(...filters) : undefined;

    const rows = await this.db
      .select()
      .from(reservists)
      .where(where)
      .orderBy(asc(reservists.name), asc(reservists.id))
      .limit(query.limit)
      .offset(query.offset);

    const [count] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(reservists)
      .where(where);

    return { rows, total: count?.total ?? 0 };
  }

  async findById(id: string): Promise<Reservist | undefined> {
    const [row] = await this.db.select().from(reservists).where(eq(reservists.id, id)).limit(1);
    return row;
  }

  async setCheckedIn(id: string): Promise<Reservist | undefined> {
    const [row] = await this.db
      .update(reservists)
      .set({ checkedInAt: new Date() })
      .where(eq(reservists.id, id))
      .returning();
    return row;
  }
}
