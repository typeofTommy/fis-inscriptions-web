import { and, isNull, not, SQL } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/app/db/inscriptionsDB";

export const softDelete = async <T extends PgTable>(
  table: T,
  where: SQL | undefined,
  deletedBy?: string
) => {
  const updateData: Record<string, unknown> = {
    deletedAt: new Date(),
  };
  
  // Si la table a une colonne deletedBy, on l'ajoute
  if (deletedBy && 'deletedBy' in table) {
    updateData.deletedBy = deletedBy;
  }

  if (!where) {
    throw new Error("Where clause is required for soft delete");
  }
  
  const whereClause = and(where, isNull((table as any).deletedAt));
  if (!whereClause) {
    throw new Error("Invalid where clause for soft delete");
  }

  return await db
    .update(table)
    .set(updateData)
    .where(whereClause)
    .returning();
};

export const selectNotDeleted = <T extends PgTable>(
  table: T,
  whereClause?: SQL
) => {
  const notDeletedClause = isNull((table as any).deletedAt);
  
  return whereClause 
    ? and(whereClause, notDeletedClause) || notDeletedClause
    : notDeletedClause;
};

export const selectOnlyDeleted = <T extends PgTable>(
  table: T,
  whereClause?: SQL
) => {
  const deletedClause = not(isNull((table as any).deletedAt));
  
  return whereClause 
    ? and(whereClause, deletedClause) || deletedClause
    : deletedClause;
};

export const restore = async <T extends PgTable>(
  table: T,
  where: SQL | undefined
) => {
  if (!where) {
    throw new Error("Where clause is required for restore");
  }
  return await db
    .update(table)
    .set({ deletedAt: null } as Partial<T["$inferInsert"]>)
    .where(where)
    .returning();
};