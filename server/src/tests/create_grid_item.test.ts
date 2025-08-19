import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gridItemsTable } from '../db/schema';
import { type CreateGridItemInput } from '../schema';
import { createGridItem } from '../handlers/create_grid_item';
import { eq } from 'drizzle-orm';

// Test input for creating grid items
const testInput: CreateGridItemInput = {
  position: 1,
  title: 'Test Grid Item',
  image_url: 'https://example.com/placeholder.jpg',
  udp_command: 'img-1'
};

describe('createGridItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a grid item successfully', async () => {
    const result = await createGridItem(testInput);

    // Validate returned data
    expect(result.position).toEqual(1);
    expect(result.title).toEqual('Test Grid Item');
    expect(result.image_url).toEqual('https://example.com/placeholder.jpg');
    expect(result.udp_command).toEqual('img-1');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save grid item to database', async () => {
    const result = await createGridItem(testInput);

    // Query database to verify persistence
    const savedItems = await db.select()
      .from(gridItemsTable)
      .where(eq(gridItemsTable.id, result.id))
      .execute();

    expect(savedItems).toHaveLength(1);
    const savedItem = savedItems[0];
    expect(savedItem.position).toEqual(1);
    expect(savedItem.title).toEqual('Test Grid Item');
    expect(savedItem.image_url).toEqual('https://example.com/placeholder.jpg');
    expect(savedItem.udp_command).toEqual('img-1');
    expect(savedItem.created_at).toBeInstanceOf(Date);
  });

  it('should prevent duplicate positions', async () => {
    // Create first grid item at position 1
    await createGridItem(testInput);

    // Attempt to create another item at the same position
    const duplicateInput: CreateGridItemInput = {
      position: 1,
      title: 'Duplicate Position Item',
      image_url: 'https://example.com/another.jpg',
      udp_command: 'img-duplicate'
    };

    await expect(createGridItem(duplicateInput))
      .rejects.toThrow(/Grid position 1 is already occupied/i);
  });

  it('should allow different positions', async () => {
    // Create items at different positions
    const position1Result = await createGridItem(testInput);

    const position2Input: CreateGridItemInput = {
      position: 2,
      title: 'Second Grid Item',
      image_url: 'https://example.com/second.jpg',
      udp_command: 'img-2'
    };

    const position2Result = await createGridItem(position2Input);

    // Both should be created successfully
    expect(position1Result.position).toEqual(1);
    expect(position2Result.position).toEqual(2);

    // Verify both exist in database
    const allItems = await db.select()
      .from(gridItemsTable)
      .execute();

    expect(allItems).toHaveLength(2);
  });

  it('should handle edge case positions correctly', async () => {
    // Test position 9 (max allowed)
    const position9Input: CreateGridItemInput = {
      position: 9,
      title: 'Bottom Right Item',
      image_url: 'https://example.com/bottom-right.jpg',
      udp_command: 'img-9'
    };

    const result = await createGridItem(position9Input);
    expect(result.position).toEqual(9);

    // Verify it's saved correctly
    const savedItem = await db.select()
      .from(gridItemsTable)
      .where(eq(gridItemsTable.position, 9))
      .execute();

    expect(savedItem).toHaveLength(1);
    expect(savedItem[0].title).toEqual('Bottom Right Item');
  });

  it('should handle various UDP commands', async () => {
    const specialCommandInput: CreateGridItemInput = {
      position: 5,
      title: 'Special Command Item',
      image_url: 'https://example.com/special.jpg',
      udp_command: 'custom-command-123'
    };

    const result = await createGridItem(specialCommandInput);
    expect(result.udp_command).toEqual('custom-command-123');

    // Verify command is saved correctly
    const savedItem = await db.select()
      .from(gridItemsTable)
      .where(eq(gridItemsTable.id, result.id))
      .execute();

    expect(savedItem[0].udp_command).toEqual('custom-command-123');
  });

  it('should create items with different URLs and titles', async () => {
    const inputs: CreateGridItemInput[] = [
      {
        position: 1,
        title: 'Home Page',
        image_url: 'https://cdn.example.com/home.png',
        udp_command: 'show-home'
      },
      {
        position: 3,
        title: 'Gallery View',
        image_url: 'https://cdn.example.com/gallery.svg',
        udp_command: 'open-gallery'
      }
    ];

    const results = await Promise.all(inputs.map(input => createGridItem(input)));

    expect(results).toHaveLength(2);
    expect(results[0].title).toEqual('Home Page');
    expect(results[1].title).toEqual('Gallery View');
    expect(results[0].image_url).toContain('home.png');
    expect(results[1].image_url).toContain('gallery.svg');
  });
});