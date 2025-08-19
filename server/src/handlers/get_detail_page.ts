import { db } from '../db';
import { detailPagesTable } from '../db/schema';
import { type DetailPage } from '../schema';
import { eq } from 'drizzle-orm';

export const getDetailPage = async (gridItemId: number): Promise<DetailPage | null> => {
  try {
    // Query for detail page by grid item ID
    const results = await db.select()
      .from(detailPagesTable)
      .where(eq(detailPagesTable.grid_item_id, gridItemId))
      .execute();

    // Return null if no detail page found
    if (results.length === 0) {
      return null;
    }

    const detailPage = results[0];
    
    // Return the detail page with properly parsed gallery_items
    return {
      id: detailPage.id,
      grid_item_id: detailPage.grid_item_id,
      headline: detailPage.headline,
      intro_text: detailPage.intro_text,
      gallery_items: detailPage.gallery_items as string[], // JSONB field - cast to string array
      created_at: detailPage.created_at
    };
  } catch (error) {
    console.error('Detail page retrieval failed:', error);
    throw error;
  }
};