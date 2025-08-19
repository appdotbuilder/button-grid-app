import { db } from '../db';
import { mainPageContentTable } from '../db/schema';
import { type UpdateMainPageContentInput, type MainPageContent } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const updateMainPageContent = async (input: UpdateMainPageContentInput): Promise<MainPageContent> => {
  try {
    // First, check if there's existing main page content
    const existingContent = await db.select()
      .from(mainPageContentTable)
      .orderBy(desc(mainPageContentTable.created_at))
      .limit(1)
      .execute();

    let result;

    if (existingContent.length > 0) {
      // Update existing record
      const updateResult = await db.update(mainPageContentTable)
        .set({
          bottom_left_text: input.bottom_left_text,
        })
        .where(eq(mainPageContentTable.id, existingContent[0].id))
        .returning()
        .execute();
      
      result = updateResult[0];
    } else {
      // Create new record if none exists
      const insertResult = await db.insert(mainPageContentTable)
        .values({
          bottom_left_text: input.bottom_left_text,
        })
        .returning()
        .execute();
      
      result = insertResult[0];
    }

    return result;
  } catch (error) {
    console.error('Main page content update failed:', error);
    throw error;
  }
};