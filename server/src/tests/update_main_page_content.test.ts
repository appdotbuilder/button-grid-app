import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mainPageContentTable } from '../db/schema';
import { type UpdateMainPageContentInput } from '../schema';
import { updateMainPageContent } from '../handlers/update_main_page_content';
import { eq, desc } from 'drizzle-orm';

// Test input for updating main page content
const testInput: UpdateMainPageContentInput = {
  bottom_left_text: 'Updated bottom left text content'
};

describe('updateMainPageContent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create new main page content when none exists', async () => {
    const result = await updateMainPageContent(testInput);

    // Verify the returned data
    expect(result.bottom_left_text).toEqual('Updated bottom left text content');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save new content to database when none exists', async () => {
    const result = await updateMainPageContent(testInput);

    // Query the database to verify data was saved
    const savedContent = await db.select()
      .from(mainPageContentTable)
      .where(eq(mainPageContentTable.id, result.id))
      .execute();

    expect(savedContent).toHaveLength(1);
    expect(savedContent[0].bottom_left_text).toEqual('Updated bottom left text content');
    expect(savedContent[0].id).toEqual(result.id);
    expect(savedContent[0].created_at).toBeInstanceOf(Date);
  });

  it('should update existing main page content', async () => {
    // First, create initial content
    const initialResult = await updateMainPageContent({
      bottom_left_text: 'Initial content'
    });

    // Then update it with new content
    const updatedResult = await updateMainPageContent({
      bottom_left_text: 'Updated content text'
    });

    // Should update the same record (same ID)
    expect(updatedResult.id).toEqual(initialResult.id);
    expect(updatedResult.bottom_left_text).toEqual('Updated content text');
    expect(updatedResult.created_at).toBeInstanceOf(Date);
  });

  it('should update the existing record in database', async () => {
    // Create initial content
    await updateMainPageContent({
      bottom_left_text: 'Initial content'
    });

    // Update with new content
    const updatedResult = await updateMainPageContent({
      bottom_left_text: 'Final updated content'
    });

    // Verify only one record exists and it has the updated content
    const allContent = await db.select()
      .from(mainPageContentTable)
      .execute();

    expect(allContent).toHaveLength(1);
    expect(allContent[0].id).toEqual(updatedResult.id);
    expect(allContent[0].bottom_left_text).toEqual('Final updated content');
  });

  it('should handle multiple updates correctly', async () => {
    // Create and update multiple times
    await updateMainPageContent({ bottom_left_text: 'First update' });
    await updateMainPageContent({ bottom_left_text: 'Second update' });
    const finalResult = await updateMainPageContent({ bottom_left_text: 'Third update' });

    // Should still have only one record with the latest content
    const allContent = await db.select()
      .from(mainPageContentTable)
      .orderBy(desc(mainPageContentTable.created_at))
      .execute();

    expect(allContent).toHaveLength(1);
    expect(allContent[0].bottom_left_text).toEqual('Third update');
    expect(allContent[0].id).toEqual(finalResult.id);
  });

  it('should handle empty string content', async () => {
    const result = await updateMainPageContent({
      bottom_left_text: ''
    });

    expect(result.bottom_left_text).toEqual('');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const savedContent = await db.select()
      .from(mainPageContentTable)
      .where(eq(mainPageContentTable.id, result.id))
      .execute();

    expect(savedContent[0].bottom_left_text).toEqual('');
  });

  it('should handle long text content', async () => {
    const longText = 'This is a very long text content that might be used for the bottom left section of the main page. '.repeat(10);
    
    const result = await updateMainPageContent({
      bottom_left_text: longText
    });

    expect(result.bottom_left_text).toEqual(longText);
    expect(result.id).toBeDefined();

    // Verify in database
    const savedContent = await db.select()
      .from(mainPageContentTable)
      .where(eq(mainPageContentTable.id, result.id))
      .execute();

    expect(savedContent[0].bottom_left_text).toEqual(longText);
  });
});