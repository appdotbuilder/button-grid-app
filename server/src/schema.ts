import { z } from 'zod';

// Grid item schema for the 3x3 button grid
export const gridItemSchema = z.object({
  id: z.number(),
  position: z.number().int().min(1).max(9), // Grid position 1-9
  title: z.string(),
  image_url: z.string(), // Placeholder image URL
  udp_command: z.string(), // Command to send via UDP (e.g., "img-1", "img-2")
  created_at: z.coerce.date()
});

export type GridItem = z.infer<typeof gridItemSchema>;

// Detail page content schema
export const detailPageSchema = z.object({
  id: z.number(),
  grid_item_id: z.number(), // Foreign key to grid item
  headline: z.string(),
  intro_text: z.string(),
  gallery_items: z.array(z.string()), // Array of placeholder image/video URLs
  created_at: z.coerce.date()
});

export type DetailPage = z.infer<typeof detailPageSchema>;

// Main page content schema
export const mainPageContentSchema = z.object({
  id: z.number(),
  bottom_left_text: z.string(), // Placeholder text at bottom left
  created_at: z.coerce.date()
});

export type MainPageContent = z.infer<typeof mainPageContentSchema>;

// Input schema for creating grid items
export const createGridItemInputSchema = z.object({
  position: z.number().int().min(1).max(9),
  title: z.string(),
  image_url: z.string(),
  udp_command: z.string()
});

export type CreateGridItemInput = z.infer<typeof createGridItemInputSchema>;

// Input schema for creating detail pages
export const createDetailPageInputSchema = z.object({
  grid_item_id: z.number(),
  headline: z.string(),
  intro_text: z.string(),
  gallery_items: z.array(z.string())
});

export type CreateDetailPageInput = z.infer<typeof createDetailPageInputSchema>;

// Input schema for updating main page content
export const updateMainPageContentInputSchema = z.object({
  bottom_left_text: z.string()
});

export type UpdateMainPageContentInput = z.infer<typeof updateMainPageContentInputSchema>;

// UDP command execution schema
export const udpCommandSchema = z.object({
  command: z.string(),
  target_host: z.string().default('localhost'),
  target_port: z.number().default(5000)
});

export type UdpCommand = z.infer<typeof udpCommandSchema>;

// Grid item click event schema
export const gridItemClickInputSchema = z.object({
  grid_item_id: z.number()
});

export type GridItemClickInput = z.infer<typeof gridItemClickInputSchema>;