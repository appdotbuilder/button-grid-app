import { db } from '../db';
import { gridItemsTable } from '../db/schema';
import { type GridItem } from '../schema';
import { asc } from 'drizzle-orm';

export const getGridItems = async (): Promise<GridItem[]> => {
  try {
    // Fetch all grid items ordered by position to ensure proper grid layout
    const results = await db.select()
      .from(gridItemsTable)
      .orderBy(asc(gridItemsTable.position))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch grid items:', error);
    throw error;
  }
};