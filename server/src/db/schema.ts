import { serial, text, pgTable, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Grid items table - represents the 3x3 button grid
export const gridItemsTable = pgTable('grid_items', {
  id: serial('id').primaryKey(),
  position: integer('position').notNull(), // Grid position 1-9
  title: text('title').notNull(),
  image_url: text('image_url').notNull(), // Placeholder image URL
  udp_command: text('udp_command').notNull(), // Command to send via UDP
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Detail pages table - content for detail pages
export const detailPagesTable = pgTable('detail_pages', {
  id: serial('id').primaryKey(),
  grid_item_id: integer('grid_item_id').notNull(), // Foreign key to grid items
  headline: text('headline').notNull(),
  intro_text: text('intro_text').notNull(),
  gallery_items: jsonb('gallery_items').notNull(), // Array of image/video URLs stored as JSON
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Main page content table - stores the bottom left placeholder text
export const mainPageContentTable = pgTable('main_page_content', {
  id: serial('id').primaryKey(),
  bottom_left_text: text('bottom_left_text').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations between tables
export const gridItemsRelations = relations(gridItemsTable, ({ one }) => ({
  detailPage: one(detailPagesTable, {
    fields: [gridItemsTable.id],
    references: [detailPagesTable.grid_item_id],
  }),
}));

export const detailPagesRelations = relations(detailPagesTable, ({ one }) => ({
  gridItem: one(gridItemsTable, {
    fields: [detailPagesTable.grid_item_id],
    references: [gridItemsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type GridItem = typeof gridItemsTable.$inferSelect;
export type NewGridItem = typeof gridItemsTable.$inferInsert;

export type DetailPage = typeof detailPagesTable.$inferSelect;
export type NewDetailPage = typeof detailPagesTable.$inferInsert;

export type MainPageContent = typeof mainPageContentTable.$inferSelect;
export type NewMainPageContent = typeof mainPageContentTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  gridItems: gridItemsTable, 
  detailPages: detailPagesTable,
  mainPageContent: mainPageContentTable
};