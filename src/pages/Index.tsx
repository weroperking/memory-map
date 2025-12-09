import { useState } from 'react';
import { Header } from '@/components/Header';
import { PhotoUploader } from '@/components/PhotoUploader';
import { PhotoGallery } from '@/components/PhotoGallery';
import { PhotoMap } from '@/components/PhotoMap';
import { PhotoDetail } from '@/components/PhotoDetail';
import { UpgradeModal } from '@/components/UpgradeModal';
import { PhotoProvider } from '@/contexts/PhotoContext';

const Index = () => {
  const [activeView, setActiveView] = useState<'gallery' | 'map'>('gallery');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isPro, setIsPro] = useState(false);

  return (
    <PhotoProvider>
      <div className="min-h-screen bg-background">
        <Header
          activeView={activeView}
          onViewChange={setActiveView}
          onUpgrade={() => setShowUpgrade(true)}
        />

        <main className="container py-6">
          <PhotoUploader />

          {activeView === 'gallery' ? <PhotoGallery /> : <PhotoMap />}
        </main>

        <PhotoDetail onUpgrade={() => setShowUpgrade(true)} isPro={isPro} />
        <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} onUpgradeComplete={() => setIsPro(true)} />
      </div>
    </PhotoProvider>
  );
};

export default Index;
