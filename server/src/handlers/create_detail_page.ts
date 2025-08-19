import { db } from '../db';
import { gridItemsTable, detailPagesTable } from '../db/schema';
import { type CreateDetailPageInput, type DetailPage } from '../schema';
import { eq } from 'drizzle-orm';

export const createDetailPage = async (input: CreateDetailPageInput): Promise<DetailPage> => {
  try {
    // First, validate that the grid item exists
    const gridItems = await db.select()
      .from(gridItemsTable)
      .where(eq(gridItemsTable.id, input.grid_item_id))
      .execute();

    if (gridItems.length === 0) {
      throw new Error(`Grid item with ID ${input.grid_item_id} not found`);
    }

    // Insert detail page record
    const result = await db.insert(detailPagesTable)
      .values({
        grid_item_id: input.grid_item_id,
        headline: input.headline,
        intro_text: input.intro_text,
        gallery_items: input.gallery_items // JSONB column - no conversion needed
      })
      .returning()
      .execute();

    // Return the created detail page
    const detailPage = result[0];
    return {
      ...detailPage,
      gallery_items: detailPage.gallery_items as string[] // Type assertion for JSONB
    };
  } catch (error) {
    console.error('Detail page creation failed:', error);
    throw error;
  }
};