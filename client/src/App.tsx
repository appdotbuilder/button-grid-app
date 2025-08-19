import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { MainPage } from '@/components/MainPage';
import { DetailPage } from '@/components/DetailPage';
import type { GridItem, MainPageContent, DetailPage as DetailPageType } from '../../server/src/schema';

type AppState = 'main' | 'detail';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('main');
  const [selectedGridItemId, setSelectedGridItemId] = useState<number | null>(null);
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [mainPageContent, setMainPageContent] = useState<MainPageContent | null>(null);
  const [detailPageData, setDetailPageData] = useState<DetailPageType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load grid items for main page
  const loadGridItems = useCallback(async () => {
    try {
      const items = await trpc.getGridItems.query();
      setGridItems(items);
    } catch (error) {
      console.error('Failed to load grid items:', error);
    }
  }, []);

  // Load main page content
  const loadMainPageContent = useCallback(async () => {
    try {
      const content = await trpc.getMainPageContent.query();
      setMainPageContent(content);
    } catch (error) {
      console.error('Failed to load main page content:', error);
    }
  }, []);

  // Load detail page data
  const loadDetailPage = useCallback(async (gridItemId: number) => {
    setIsLoading(true);
    try {
      const detail = await trpc.getDetailPage.query({ gridItemId });
      setDetailPageData(detail);
    } catch (error) {
      console.error('Failed to load detail page:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle grid item click
  const handleGridItemClick = async (gridItem: GridItem) => {
    setIsLoading(true);
    try {
      // Send UDP command and get navigation info
      const result = await trpc.handleGridItemClick.mutate({ grid_item_id: gridItem.id });
      console.log('Grid item click result:', result);
      
      // Navigate to detail page
      setSelectedGridItemId(gridItem.id);
      await loadDetailPage(gridItem.id);
      setCurrentState('detail');
    } catch (error) {
      console.error('Failed to handle grid item click:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate back to main page
  const handleBackToMain = () => {
    setCurrentState('main');
    setSelectedGridItemId(null);
    setDetailPageData(null);
  };

  // Load initial data
  useEffect(() => {
    loadGridItems();
    loadMainPageContent();
  }, [loadGridItems, loadMainPageContent]);

  if (currentState === 'main') {
    return (
      <MainPage
        gridItems={gridItems}
        mainPageContent={mainPageContent}
        onGridItemClick={handleGridItemClick}
        isLoading={isLoading}
      />
    );
  }

  if (currentState === 'detail') {
    return (
      <DetailPage
        detailPageData={detailPageData}
        selectedGridItem={gridItems.find((item: GridItem) => item.id === selectedGridItemId) || null}
        onBackToMain={handleBackToMain}
        isLoading={isLoading}
      />
    );
  }

  return null;
}

export default App;