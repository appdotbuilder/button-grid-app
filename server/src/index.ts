import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createGridItemInputSchema,
  createDetailPageInputSchema, 
  updateMainPageContentInputSchema,
  gridItemClickInputSchema
} from './schema';

// Import handlers
import { getGridItems } from './handlers/get_grid_items';
import { createGridItem } from './handlers/create_grid_item';
import { getDetailPage } from './handlers/get_detail_page';
import { createDetailPage } from './handlers/create_detail_page';
import { getMainPageContent } from './handlers/get_main_page_content';
import { updateMainPageContent } from './handlers/update_main_page_content';
import { sendUdpCommand } from './handlers/send_udp_command';
import { handleGridItemClick } from './handlers/handle_grid_item_click';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Grid items management
  getGridItems: publicProcedure
    .query(() => getGridItems()),
    
  createGridItem: publicProcedure
    .input(createGridItemInputSchema)
    .mutation(({ input }) => createGridItem(input)),

  // Detail pages management
  getDetailPage: publicProcedure
    .input(z.object({ gridItemId: z.number() }))
    .query(({ input }) => getDetailPage(input.gridItemId)),
    
  createDetailPage: publicProcedure
    .input(createDetailPageInputSchema)
    .mutation(({ input }) => createDetailPage(input)),

  // Main page content management
  getMainPageContent: publicProcedure
    .query(() => getMainPageContent()),
    
  updateMainPageContent: publicProcedure
    .input(updateMainPageContentInputSchema)
    .mutation(({ input }) => updateMainPageContent(input)),

  // Grid item click handling (sends UDP and returns navigation info)
  handleGridItemClick: publicProcedure
    .input(gridItemClickInputSchema)
    .mutation(({ input }) => handleGridItemClick(input)),

  // Direct UDP command sending (for testing purposes)
  sendUdpCommand: publicProcedure
    .input(z.object({ 
      command: z.string(),
      target_host: z.string().default('localhost'),
      target_port: z.number().default(5000)
    }))
    .mutation(({ input }) => sendUdpCommand(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();