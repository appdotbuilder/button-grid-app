import { db } from '../db';
import { gridItemsTable } from '../db/schema';
import { type GridItemClickInput } from '../schema';
import { sendUdpCommand } from './send_udp_command';
import { eq } from 'drizzle-orm';

export async function handleGridItemClick(input: GridItemClickInput): Promise<{ success: boolean; message: string; detailPageUrl: string }> {
  try {
    // Fetch the grid item from the database
    const gridItems = await db.select()
      .from(gridItemsTable)
      .where(eq(gridItemsTable.id, input.grid_item_id))
      .execute();

    if (gridItems.length === 0) {
      return {
        success: false,
        message: `Grid item with ID ${input.grid_item_id} not found`,
        detailPageUrl: ''
      };
    }

    const gridItem = gridItems[0];

    // Send UDP command to the target host
    const udpResult = await sendUdpCommand({
      command: gridItem.udp_command,
      target_host: 'localhost',
      target_port: 5000
    });

    return {
      success: udpResult.success,
      message: `Grid item "${gridItem.title}" clicked. ${udpResult.message}`,
      detailPageUrl: `/detail/${gridItem.id}`
    };
  } catch (error) {
    console.error('Grid item click handling failed:', error);
    throw error;
  }
}