import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { detailPagesTable, gridItemsTable } from '../db/schema';
import { getDetailPage } from '../handlers/get_detail_page';
import { eq } from 'drizzle-orm';

describe('getDetailPage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return detail page for existing grid item', async () => {
    // Create a grid item first
    const gridItemResult = await db.insert(gridItemsTable)
      .values({
        position: 1,
        title: 'Test Grid Item',
        image_url: '/test-image.jpg',
        udp_command: 'test-command'
      })
      .returning()
      .execute();

    const gridItemId = gridItemResult[0].id;

    // Create detail page for the grid item
    const detailPageData = {
      grid_item_id: gridItemId,
      headline: 'Test Detail Page',
      intro_text: 'This is a test intro text for the detail page.',
      gallery_items: [
        '/gallery-image-1.jpg',
        '/gallery-image-2.jpg',
        '/gallery-video-1.mp4'
      ]
    };

    await db.insert(detailPagesTable)
      .values({
        ...detailPageData,
        gallery_items: JSON.stringify(detailPageData.gallery_items) // Store as JSON
      })
      .execute();

    // Test the handler
    const result = await getDetailPage(gridItemId);

    expect(result).not.toBeNull();
    expect(result!.grid_item_id).toEqual(gridItemId);
    expect(result!.headline).toEqual('Test Detail Page');
    expect(result!.intro_text).toEqual('This is a test intro text for the detail page.');
    expect(result!.gallery_items).toEqual([
      '/gallery-image-1.jpg',
      '/gallery-image-2.jpg',
      '/gallery-video-1.mp4'
    ]);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when no detail page exists for grid item', async () => {
    // Create a grid item without a detail page
    const gridItemResult = await db.insert(gridItemsTable)
      .values({
        position: 2,
        title: 'Grid Item Without Detail',
        image_url: '/test-image.jpg',
        udp_command: 'test-command'
      })
      .returning()
      .execute();

    const gridItemId = gridItemResult[0].id;

    // Test the handler - should return null
    const result = await getDetailPage(gridItemId);

    expect(result).toBeNull();
  });

  it('should return null for non-existent grid item ID', async () => {
    // Test with a grid item ID that doesn't exist
    const result = await getDetailPage(99999);

    expect(result).toBeNull();
  });

  it('should handle empty gallery items array', async () => {
    // Create a grid item
    const gridItemResult = await db.insert(gridItemsTable)
      .values({
        position: 3,
        title: 'Grid Item with Empty Gallery',
        image_url: '/test-image.jpg',
        udp_command: 'test-command'
      })
      .returning()
      .execute();

    const gridItemId = gridItemResult[0].id;

    // Create detail page with empty gallery
    await db.insert(detailPagesTable)
      .values({
        grid_item_id: gridItemId,
        headline: 'Empty Gallery Test',
        intro_text: 'Detail page with no gallery items.',
        gallery_items: JSON.stringify([]) // Empty array
      })
      .execute();

    // Test the handler
    const result = await getDetailPage(gridItemId);

    expect(result).not.toBeNull();
    expect(result!.gallery_items).toEqual([]);
    expect(Array.isArray(result!.gallery_items)).toBe(true);
  });

  it('should verify detail page is stored correctly in database', async () => {
    // Create a grid item
    const gridItemResult = await db.insert(gridItemsTable)
      .values({
        position: 4,
        title: 'Database Verification Test',
        image_url: '/test-image.jpg',
        udp_command: 'test-command'
      })
      .returning()
      .execute();

    const gridItemId = gridItemResult[0].id;

    // Create detail page
    const galleryItems = ['/image1.jpg', '/video1.mp4', '/image2.jpg'];
    await db.insert(detailPagesTable)
      .values({
        grid_item_id: gridItemId,
        headline: 'Database Test Page',
        intro_text: 'Testing database storage and retrieval.',
        gallery_items: JSON.stringify(galleryItems)
      })
      .execute();

    // Get detail page using handler
    const result = await getDetailPage(gridItemId);

    // Verify data was stored and retrieved correctly
    expect(result).not.toBeNull();
    
    // Query database directly to verify storage
    const dbResult = await db.select()
      .from(detailPagesTable)
      .where(eq(detailPagesTable.grid_item_id, gridItemId))
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(dbResult[0].headline).toEqual('Database Test Page');
    expect(dbResult[0].gallery_items).toEqual(galleryItems); // Drizzle handles JSON parsing
    
    // Verify handler result matches database
    expect(result!.headline).toEqual(dbResult[0].headline);
    expect(result!.gallery_items).toEqual(galleryItems);
    expect(result!.created_at).toEqual(dbResult[0].created_at);
  });

  it('should handle multiple gallery items of different types', async () => {
    // Create a grid item
    const gridItemResult = await db.insert(gridItemsTable)
      .values({
        position: 5,
        title: 'Mixed Gallery Test',
        image_url: '/test-image.jpg',
        udp_command: 'test-command'
      })
      .returning()
      .execute();

    const gridItemId = gridItemResult[0].id;

    // Create detail page with mixed media types
    const mixedGallery = [
      '/images/photo1.jpg',
      '/videos/clip1.mp4',
      '/images/photo2.png',
      '/videos/clip2.mov',
      '/documents/file1.pdf'
    ];

    await db.insert(detailPagesTable)
      .values({
        grid_item_id: gridItemId,
        headline: 'Mixed Media Gallery',
        intro_text: 'Gallery with various file types.',
        gallery_items: JSON.stringify(mixedGallery)
      })
      .execute();

    // Test the handler
    const result = await getDetailPage(gridItemId);

    expect(result).not.toBeNull();
    expect(result!.gallery_items).toEqual(mixedGallery);
    expect(result!.gallery_items).toHaveLength(5);
    
    // Verify all items are strings
    result!.gallery_items.forEach(item => {
      expect(typeof item).toBe('string');
    });
  });
});