import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gridItemsTable } from '../db/schema';
import { type GridItemClickInput, type CreateGridItemInput } from '../schema';
import { handleGridItemClick } from '../handlers/handle_grid_item_click';

// Mock the sendUdpCommand function since we don't want to test actual UDP sending
const mockSendUdpCommand = mock(() => Promise.resolve({ 
  success: true, 
  message: 'UDP command sent successfully' 
}));

// Mock the sendUdpCommand module
mock.module('../handlers/send_udp_command', () => ({
  sendUdpCommand: mockSendUdpCommand
}));

// Test input data
const testGridItemInput: CreateGridItemInput = {
  position: 1,
  title: 'Test Grid Item',
  image_url: 'https://placeholder.com/test.jpg',
  udp_command: 'img-test-1'
};

describe('handleGridItemClick', () => {
  beforeEach(async () => {
    await createDB();
    mockSendUdpCommand.mockClear();
  });

  afterEach(resetDB);

  it('should handle grid item click successfully', async () => {
    // Create a test grid item
    const gridItems = await db.insert(gridItemsTable)
      .values(testGridItemInput)
      .returning()
      .execute();

    const gridItem = gridItems[0];

    const input: GridItemClickInput = {
      grid_item_id: gridItem.id
    };

    const result = await handleGridItemClick(input);

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.message).toContain('Test Grid Item');
    expect(result.message).toContain('clicked');
    expect(result.message).toContain('UDP command sent successfully');
    expect(result.detailPageUrl).toBe(`/detail/${gridItem.id}`);

    // Verify UDP command was called with correct parameters
    expect(mockSendUdpCommand).toHaveBeenCalledTimes(1);
    expect(mockSendUdpCommand).toHaveBeenCalledWith({
      command: 'img-test-1',
      target_host: 'localhost',
      target_port: 5000
    });
  });

  it('should handle non-existent grid item', async () => {
    const input: GridItemClickInput = {
      grid_item_id: 999 // Non-existent ID
    };

    const result = await handleGridItemClick(input);

    // Verify the result for non-existent item
    expect(result.success).toBe(false);
    expect(result.message).toContain('Grid item with ID 999 not found');
    expect(result.detailPageUrl).toBe('');

    // Verify UDP command was not called
    expect(mockSendUdpCommand).not.toHaveBeenCalled();
  });

  it('should handle UDP command failure', async () => {
    // Mock UDP command failure
    mockSendUdpCommand.mockResolvedValueOnce({
      success: false,
      message: 'UDP send failed'
    });

    // Create a test grid item
    const gridItems = await db.insert(gridItemsTable)
      .values(testGridItemInput)
      .returning()
      .execute();

    const gridItem = gridItems[0];

    const input: GridItemClickInput = {
      grid_item_id: gridItem.id
    };

    const result = await handleGridItemClick(input);

    // Verify the result reflects UDP failure
    expect(result.success).toBe(false);
    expect(result.message).toContain('Test Grid Item');
    expect(result.message).toContain('clicked');
    expect(result.message).toContain('UDP send failed');
    expect(result.detailPageUrl).toBe(`/detail/${gridItem.id}`);

    // Verify UDP command was called
    expect(mockSendUdpCommand).toHaveBeenCalledTimes(1);
    expect(mockSendUdpCommand).toHaveBeenCalledWith({
      command: 'img-test-1',
      target_host: 'localhost',
      target_port: 5000
    });
  });

  it('should handle different grid positions and commands', async () => {
    // Create multiple test grid items
    const gridItem1Input = {
      ...testGridItemInput,
      position: 5,
      title: 'Center Item',
      udp_command: 'img-center'
    };

    const gridItem2Input = {
      ...testGridItemInput,
      position: 9,
      title: 'Bottom Right Item',
      udp_command: 'img-bottom-right'
    };

    const [gridItem1, gridItem2] = await Promise.all([
      db.insert(gridItemsTable).values(gridItem1Input).returning().execute(),
      db.insert(gridItemsTable).values(gridItem2Input).returning().execute()
    ]);

    // Test first grid item
    const result1 = await handleGridItemClick({ grid_item_id: gridItem1[0].id });
    
    expect(result1.success).toBe(true);
    expect(result1.message).toContain('Center Item');
    expect(result1.detailPageUrl).toBe(`/detail/${gridItem1[0].id}`);
    expect(mockSendUdpCommand).toHaveBeenCalledWith({
      command: 'img-center',
      target_host: 'localhost',
      target_port: 5000
    });

    // Test second grid item
    const result2 = await handleGridItemClick({ grid_item_id: gridItem2[0].id });
    
    expect(result2.success).toBe(true);
    expect(result2.message).toContain('Bottom Right Item');
    expect(result2.detailPageUrl).toBe(`/detail/${gridItem2[0].id}`);
    expect(mockSendUdpCommand).toHaveBeenCalledWith({
      command: 'img-bottom-right',
      target_host: 'localhost',
      target_port: 5000
    });

    // Verify both calls were made
    expect(mockSendUdpCommand).toHaveBeenCalledTimes(2);
  });
});