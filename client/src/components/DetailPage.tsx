import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import type { DetailPage as DetailPageType, GridItem } from '../../../server/src/schema';

interface DetailPageProps {
  detailPageData: DetailPageType | null;
  selectedGridItem: GridItem | null;
  onBackToMain: () => void;
  isLoading: boolean;
}

export function DetailPage({ detailPageData, selectedGridItem, onBackToMain, isLoading }: DetailPageProps) {
  const renderGalleryItem = (item: string, index: number) => {
    const isVideo = item.includes('.mp4') || item.includes('.mov') || item.includes('video');
    
    return (
      <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-200 flex items-center justify-center">
          {isVideo ? (
            <div className="text-center">
              <span className="text-4xl mb-2 block">🎬</span>
              <p className="text-sm text-purple-600">Video Placeholder</p>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-4xl mb-2 block">🖼️</span>
              <p className="text-sm text-purple-600">Image Placeholder</p>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header with back button */}
      <header className="p-6 border-b bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToMain}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Grid
          </Button>
          {selectedGridItem && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-200 to-pink-300 rounded flex items-center justify-center">
                <span className="text-lg">🎯</span>
              </div>
              <div>
                <h2 className="font-semibold text-purple-800">{selectedGridItem.title}</h2>
                <p className="text-sm text-purple-600">Command: {selectedGridItem.udp_command}</p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="p-6">
        {isLoading ? (
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-32 w-full mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="aspect-video" />
              ))}
            </div>
          </div>
        ) : detailPageData ? (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left column: Text content */}
              <div className="space-y-6">
                <Card className="bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl text-purple-800">
                      ✨ {detailPageData.headline}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-purple-700 leading-relaxed">
                      {detailPageData.intro_text}
                    </p>
                  </CardContent>
                </Card>

                {/* Additional info card */}
                <Card className="bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-purple-800">
                      📋 Item Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-purple-600">
                      <span className="font-medium">Grid Position:</span> {selectedGridItem?.position}
                    </p>
                    <p className="text-sm text-purple-600">
                      <span className="font-medium">UDP Command:</span> {selectedGridItem?.udp_command}
                    </p>
                    <p className="text-sm text-purple-600">
                      <span className="font-medium">Gallery Items:</span> {detailPageData.gallery_items.length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Right column: Gallery */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-purple-800 mb-4">
                  🎨 Media Gallery
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {detailPageData.gallery_items.map((item: string, index: number) => 
                    renderGalleryItem(item, index)
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto text-center">
            <Card className="p-8 bg-white/70 backdrop-blur-sm">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-purple-800 mb-2">
                Detail Page Not Found
              </h2>
              <p className="text-purple-600 mb-6">
                No detail page content is available for this item.
              </p>
              <Button onClick={onBackToMain} variant="default">
                Return to Grid
              </Button>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}