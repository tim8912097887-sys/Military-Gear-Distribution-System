import { and, asc, eq, gt, ilike, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { reservists, type Reservist } from '../../../infrastructure/db/schema/reservists.js';
import type { ListReservistsRepositoryInput, ListReservistsResult } from './dto.js';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export class ReservistRepository {
  constructor(private readonly db: NodePgDatabase) {}
  async list(query: ListReservistsRepositoryInput): Promise<ListReservistsResult> {
    const filters = [
      query.q
        ? or(ilike(reservists.name, `%${query.q}%`), ilike(reservists.nationalId, `%${query.q}%`))
        : undefined,
      query.checkedIn === true ? isNotNull(reservists.checkedInAt) : undefined,
      query.checkedIn === false ? isNull(reservists.checkedInAt) : undefined,
      query.cursor ? gt(reservists.id, query.cursor) : undefined,
    ].filter((f): f is NonNullable<typeof f> => f !== undefined);

    const where = filters.length > 0 ? and(...filters) : undefined;

    const rows = await this.db
      .select()
      .from(reservists)
      .where(where)
      .orderBy(asc(reservists.id))
      .limit(query.limit + 1);

    const [count] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(reservists)
      .where(where);

    const hasMore = rows.length > query.limit;

    const nextCursor = hasMore ? rows[query.limit - 1].id : null;

    return {
      rows: rows.slice(0, query.limit),
      pagination: { total: count.total, limit: query.limit, nextCursor, hasMore },
    };
  }

  async findById(id: string): Promise<Reservist | undefined> {
    const [row] = await this.db.select().from(reservists).where(eq(reservists.id, id)).limit(1);
    return row;
  }

  async setCheckedIn(id: string): Promise<Reservist | undefined> {
    const [row] = await this.db
      .update(reservists)
      .set({
        checkedInAt: new Date(),
      })
      .where(and(eq(reservists.id, id), isNull(reservists.checkedInAt)))
      .returning();

    return row;
  }
}
