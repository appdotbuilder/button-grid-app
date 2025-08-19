import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gridItemsTable, detailPagesTable } from '../db/schema';
import { type CreateDetailPageInput, type CreateGridItemInput } from '../schema';
import { createDetailPage } from '../handlers/create_detail_page';
import { eq } from 'drizzle-orm';

// Test data
const testGridItem: CreateGridItemInput = {
  position: 1,
  title: 'Test Grid Item',
  image_url: 'https://example.com/test.jpg',
  udp_command: 'test-cmd-1'
};

const testDetailPageInput: CreateDetailPageInput = {
  grid_item_id: 1, // Will be set dynamically in tests
  headline: 'Test Detail Page',
  intro_text: 'This is a test detail page introduction text.',
  gallery_items: [
    'https://example.com/gallery1.jpg',
    'https://example.com/gallery2.mp4',
    'https://example.com/gallery3.jpg'
  ]
};

describe('createDetailPage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a detail page', async () => {
    // First create a grid item as prerequisite
    const gridItemResult = await db.insert(gridItemsTable)
      .values(testGridItem)
      .returning()
      .execute();
    
    const gridItem = gridItemResult[0];
    const input = { ...testDetailPageInput, grid_item_id: gridItem.id };

    const result = await createDetailPage(input);

    // Basic field validation
    expect(result.grid_item_id).toEqual(gridItem.id);
    expect(result.headline).toEqual('Test Detail Page');
    expect(result.intro_text).toEqual(testDetailPageInput.intro_text);
    expect(result.gallery_items).toEqual(testDetailPageInput.gallery_items);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save detail page to database', async () => {
    // First create a grid item as prerequisite
    const gridItemResult = await db.insert(gridItemsTable)
      .values(testGridItem)
      .returning()
      .execute();
    
    const gridItem = gridItemResult[0];
    const input = { ...testDetailPageInput, grid_item_id: gridItem.id };

    const result = await createDetailPage(input);

    // Query the database to verify the detail page was saved
    const detailPages = await db.select()
      .from(detailPagesTable)
      .where(eq(detailPagesTable.id, result.id))
      .execute();

    expect(detailPages).toHaveLength(1);
    expect(detailPages[0].grid_item_id).toEqual(gridItem.id);
    expect(detailPages[0].headline).toEqual('Test Detail Page');
    expect(detailPages[0].intro_text).toEqual(testDetailPageInput.intro_text);
    expect(detailPages[0].gallery_items).toEqual(testDetailPageInput.gallery_items);
    expect(detailPages[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle gallery items as JSONB correctly', async () => {
    // First create a grid item as prerequisite
    const gridItemResult = await db.insert(gridItemsTable)
      .values(testGridItem)
      .returning()
      .execute();
    
    const gridItem = gridItemResult[0];
    
    // Test with different gallery item formats
    const complexGalleryItems = [
      'https://example.com/image1.jpg',
      'https://example.com/video1.mp4',
      'https://example.com/image2.png',
      'https://example.com/document.pdf'
    ];
    
    const input = {
      ...testDetailPageInput,
      grid_item_id: gridItem.id,
      gallery_items: complexGalleryItems
    };

    const result = await createDetailPage(input);

    expect(result.gallery_items).toEqual(complexGalleryItems);
    expect(Array.isArray(result.gallery_items)).toBe(true);
    expect(result.gallery_items).toHaveLength(4);
    
    // Verify in database
    const detailPages = await db.select()
      .from(detailPagesTable)
      .where(eq(detailPagesTable.id, result.id))
      .execute();

    expect(detailPages[0].gallery_items).toEqual(complexGalleryItems);
  });

  it('should throw error when grid item does not exist', async () => {
    const input = {
      ...testDetailPageInput,
      grid_item_id: 99999 // Non-existent grid item ID
    };

    await expect(createDetailPage(input)).rejects.toThrow(/Grid item with ID 99999 not found/i);
  });

  it('should create multiple detail pages for different grid items', async () => {
    // Create two grid items
    const gridItem1Result = await db.insert(gridItemsTable)
      .values({ ...testGridItem, position: 1, udp_command: 'cmd-1' })
      .returning()
      .execute();
    
    const gridItem2Result = await db.insert(gridItemsTable)
      .values({ ...testGridItem, position: 2, udp_command: 'cmd-2' })
      .returning()
      .execute();

    const gridItem1 = gridItem1Result[0];
    const gridItem2 = gridItem2Result[0];

    // Create detail pages for both grid items
    const detailPage1 = await createDetailPage({
      ...testDetailPageInput,
      grid_item_id: gridItem1.id,
      headline: 'Detail Page 1'
    });

    const detailPage2 = await createDetailPage({
      ...testDetailPageInput,
      grid_item_id: gridItem2.id,
      headline: 'Detail Page 2'
    });

    // Verify both were created correctly
    expect(detailPage1.grid_item_id).toEqual(gridItem1.id);
    expect(detailPage1.headline).toEqual('Detail Page 1');
    
    expect(detailPage2.grid_item_id).toEqual(gridItem2.id);
    expect(detailPage2.headline).toEqual('Detail Page 2');

    // Verify in database
    const allDetailPages = await db.select()
      .from(detailPagesTable)
      .execute();

    expect(allDetailPages).toHaveLength(2);
  });
});