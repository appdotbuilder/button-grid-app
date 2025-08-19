import { db } from '../db';
import { mainPageContentTable } from '../db/schema';
import { type MainPageContent } from '../schema';
import { desc } from 'drizzle-orm';

export const getMainPageContent = async (): Promise<MainPageContent> => {
  try {
    // Get the most recent main page content
    const results = await db.select()
      .from(mainPageContentTable)
      .orderBy(desc(mainPageContentTable.created_at))
      .limit(1)
      .execute();

    // If no content exists, return default content
    if (results.length === 0) {
      return {
        id: 0,
        bottom_left_text: "Welcome to the main page",
        created_at: new Date()
      };
    }

    return results[0];
  } catch (error) {
    console.error('Failed to fetch main page content:', error);
    throw error;
  }
};