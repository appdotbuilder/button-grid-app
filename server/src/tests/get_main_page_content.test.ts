import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mainPageContentTable } from '../db/schema';
import { getMainPageContent } from '../handlers/get_main_page_content';

describe('getMainPageContent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return default content when no content exists', async () => {
    const result = await getMainPageContent();

    expect(result.id).toEqual(0);
    expect(result.bottom_left_text).toEqual('Welcome to the main page');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should return existing content from database', async () => {
    // Insert test content
    const testContent = await db.insert(mainPageContentTable)
      .values({
        bottom_left_text: 'Custom main page text'
      })
      .returning()
      .execute();

    const result = await getMainPageContent();

    expect(result.id).toEqual(testContent[0].id);
    expect(result.bottom_left_text).toEqual('Custom main page text');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(testContent[0].created_at);
  });

  it('should return most recent content when multiple entries exist', async () => {
    // Insert first content
    await db.insert(mainPageContentTable)
      .values({
        bottom_left_text: 'First content'
      })
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert second, more recent content
    const recentContent = await db.insert(mainPageContentTable)
      .values({
        bottom_left_text: 'Most recent content'
      })
      .returning()
      .execute();

    const result = await getMainPageContent();

    expect(result.id).toEqual(recentContent[0].id);
    expect(result.bottom_left_text).toEqual('Most recent content');
    expect(result.created_at).toEqual(recentContent[0].created_at);
  });

  it('should verify database content is saved correctly', async () => {
    // Insert test content
    const insertedContent = await db.insert(mainPageContentTable)
      .values({
        bottom_left_text: 'Test database content'
      })
      .returning()
      .execute();

    // Verify it was saved correctly by querying directly
    const directQuery = await db.select()
      .from(mainPageContentTable)
      .execute();

    expect(directQuery).toHaveLength(1);
    expect(directQuery[0].id).toEqual(insertedContent[0].id);
    expect(directQuery[0].bottom_left_text).toEqual('Test database content');
    expect(directQuery[0].created_at).toBeInstanceOf(Date);

    // Verify handler returns the same content
    const handlerResult = await getMainPageContent();
    expect(handlerResult.id).toEqual(insertedContent[0].id);
    expect(handlerResult.bottom_left_text).toEqual('Test database content');
  });

  it('should handle empty string content', async () => {
    // Insert content with empty string
    const testContent = await db.insert(mainPageContentTable)
      .values({
        bottom_left_text: ''
      })
      .returning()
      .execute();

    const result = await getMainPageContent();

    expect(result.id).toEqual(testContent[0].id);
    expect(result.bottom_left_text).toEqual('');
    expect(result.created_at).toBeInstanceOf(Date);
  });
});