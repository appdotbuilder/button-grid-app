import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { GridItem, MainPageContent } from '../../../server/src/schema';

interface MainPageProps {
  gridItems: GridItem[];
  mainPageContent: MainPageContent | null;
  onGridItemClick: (gridItem: GridItem) => Promise<void>;
  isLoading: boolean;
}

export function MainPage({ gridItems, mainPageContent, onGridItemClick, isLoading }: MainPageProps) {
  // Sort grid items by position to ensure proper layout
  const sortedGridItems = [...gridItems].sort((a: GridItem, b: GridItem) => a.position - b.position);

  // Create a 3x3 grid with placeholders for missing items
  const gridWithPlaceholders: (GridItem | null)[] = Array.from({ length: 9 }, (_, index) => {
    const position = index + 1;
    return sortedGridItems.find((item: GridItem) => item.position === position) || null;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="p-6 text-center">
        <h1 className="text-4xl font-bold text-indigo-800 mb-2">🎨 Interactive Grid Gallery</h1>
        <p className="text-indigo-600">Click any button to explore detailed content and send commands</p>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* 3x3 Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {gridWithPlaceholders.map((gridItem: GridItem | null, index: number) => (
              <Card key={index} className="aspect-square p-0 overflow-hidden hover:shadow-lg transition-shadow">
                {gridItem ? (
                  <Button
                    variant="ghost"
                    className="w-full h-full p-4 flex flex-col items-center justify-center gap-3 hover:bg-indigo-50 disabled:opacity-50"
                    onClick={() => onGridItemClick(gridItem)}
                    disabled={isLoading}
                  >
                    {/* Placeholder image */}
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-200 to-purple-300 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🖼️</span>
                    </div>
                    
                    {/* Title */}
                    <div className="text-center">
                      <p className="font-semibold text-indigo-800">{gridItem.title}</p>
                      <p className="text-xs text-indigo-500">Position {gridItem.position}</p>
                    </div>
                  </Button>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center text-gray-400">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-2 mx-auto">
                        <span className="text-2xl">📋</span>
                      </div>
                      <p className="text-sm">Empty Slot</p>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 text-indigo-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                <span>Sending command...</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom left text */}
      <footer className="p-6">
        <div className="text-left">
          {mainPageContent ? (
            <p className="text-indigo-600 bg-white/50 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
              📝 {mainPageContent.bottom_left_text}
            </p>
          ) : (
            <Skeleton className="h-10 w-64" />
          )}
        </div>
      </footer>
    </div>
  );
}