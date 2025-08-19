import { db } from '../db';
import { gridItemsTable } from '../db/schema';
import { type CreateGridItemInput, type GridItem } from '../schema';
import { eq } from 'drizzle-orm';

export const createGridItem = async (input: CreateGridItemInput): Promise<GridItem> => {
  try {
    // Validate that position is unique (1-9 grid positions)
    const existingItem = await db.select()
      .from(gridItemsTable)
      .where(eq(gridItemsTable.position, input.position))
      .execute();

    if (existingItem.length > 0) {
      throw new Error(`Grid position ${input.position} is already occupied`);
    }

    // Insert new grid item
    const result = await db.insert(gridItemsTable)
      .values({
        position: input.position,
        title: input.title,
        image_url: input.image_url,
        udp_command: input.udp_command
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Grid item creation failed:', error);
    throw error;
  }
};