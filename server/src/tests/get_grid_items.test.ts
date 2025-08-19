import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gridItemsTable } from '../db/schema';
import { type CreateGridItemInput } from '../schema';
import { getGridItems } from '../handlers/get_grid_items';

// Test data for grid items
const testGridItems: CreateGridItemInput[] = [
  {
    position: 3,
    title: 'Third Item',
    image_url: '/test3.jpg',
    udp_command: 'img-3'
  },
  {
    position: 1,
    title: 'First Item',
    image_url: '/test1.jpg',
    udp_command: 'img-1'
  },
  {
    position: 2,
    title: 'Second Item',
    image_url: '/test2.jpg',
    udp_command: 'img-2'
  }
];

describe('getGridItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no grid items exist', async () => {
    const result = await getGridItems();
    
    expect(result).toEqual([]);
  });

  it('should return all grid items ordered by position', async () => {
    // Insert test data in random order
    await db.insert(gridItemsTable)
      .values(testGridItems)
      .execute();

    const result = await getGridItems();

    expect(result).toHaveLength(3);
    
    // Verify items are ordered by position (1, 2, 3)
    expect(result[0].position).toBe(1);
    expect(result[0].title).toBe('First Item');
    expect(result[1].position).toBe(2);
    expect(result[1].title).toBe('Second Item');
    expect(result[2].position).toBe(3);
    expect(result[2].title).toBe('Third Item');
  });

  it('should return correct field types and values', async () => {
    await db.insert(gridItemsTable)
      .values([testGridItems[0]])
      .execute();

    const result = await getGridItems();
    const item = result[0];

    // Verify all fields are present and have correct types
    expect(typeof item.id).toBe('number');
    expect(typeof item.position).toBe('number');
    expect(typeof item.title).toBe('string');
    expect(typeof item.image_url).toBe('string');
    expect(typeof item.udp_command).toBe('string');
    expect(item.created_at).toBeInstanceOf(Date);

    // Verify field values
    expect(item.position).toBe(3);
    expect(item.title).toBe('Third Item');
    expect(item.image_url).toBe('/test3.jpg');
    expect(item.udp_command).toBe('img-3');
  });

  it('should handle full grid of 9 items correctly', async () => {
    // Create a complete 3x3 grid
    const fullGrid: CreateGridItemInput[] = Array.from({ length: 9 }, (_, i) => ({
      position: i + 1,
      title: `Button ${i + 1}`,
      image_url: `/placeholder${i + 1}.jpg`,
      udp_command: `img-${i + 1}`
    }));

    // Insert in reverse order to test ordering
    await db.insert(gridItemsTable)
      .values(fullGrid.reverse())
      .execute();

    const result = await getGridItems();

    expect(result).toHaveLength(9);
    
    // Verify all positions are in correct order (1-9)
    result.forEach((item, index) => {
      expect(item.position).toBe(index + 1);
      expect(item.title).toBe(`Button ${index + 1}`);
      expect(item.udp_command).toBe(`img-${index + 1}`);
    });
  });

  it('should handle duplicate positions by maintaining database order', async () => {
    // Insert items with duplicate positions
    const duplicatePositions: CreateGridItemInput[] = [
      {
        position: 5,
        title: 'First Item at Position 5',
        image_url: '/test1.jpg',
        udp_command: 'img-1'
      },
      {
        position: 5,
        title: 'Second Item at Position 5',
        image_url: '/test2.jpg',
        udp_command: 'img-2'
      }
    ];

    await db.insert(gridItemsTable)
      .values(duplicatePositions)
      .execute();

    const result = await getGridItems();

    expect(result).toHaveLength(2);
    expect(result[0].position).toBe(5);
    expect(result[1].position).toBe(5);
    
    // Both items should be present, maintaining insertion order
    expect(result[0].title).toBe('First Item at Position 5');
    expect(result[1].title).toBe('Second Item at Position 5');
  });
});