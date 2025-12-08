import { MapPin, Image, Sparkles, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { GPSTipsDialog } from './GPSTipsDialog';

interface HeaderProps {
  activeView: 'gallery' | 'map';
  onViewChange: (view: 'gallery' | 'map') => void;
  onUpgrade: () => void;
}

export function Header({ activeView, onViewChange, onUpgrade }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const NavItems = () => (
    <>
      <Button
        variant={activeView === 'gallery' ? 'default' : 'outline'}
        onClick={() => {
          onViewChange('gallery');
          setIsOpen(false);
        }}
        className="gap-2"
      >
        <Image className="h-4 w-4" />
        Gallery
      </Button>
      <Button
        variant={activeView === 'map' ? 'default' : 'outline'}
        onClick={() => {
          onViewChange('map');
          setIsOpen(false);
        }}
        className="gap-2"
      >
        <MapPin className="h-4 w-4" />
        Map
      </Button>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b-2 border-foreground bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-primary shadow-sm">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-mono text-xl font-bold tracking-tight">PHOTOMAP</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-2 md:flex">
          <NavItems />
          <div className="ml-4 h-8 w-px bg-foreground" />
          <GPSTipsDialog />
          <Button
            onClick={onUpgrade}
            className="gap-2 bg-chart-4 text-foreground hover:bg-chart-4/90 border-2 border-foreground shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade to Pro
          </Button>
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 border-l-2 border-foreground">
            <div className="mt-8 flex flex-col gap-4">
              <NavItems />
              <GPSTipsDialog />
              <Button
                onClick={() => {
                  onUpgrade();
                  setIsOpen(false);
                }}
                className="gap-2 bg-chart-4 text-foreground hover:bg-chart-4/90 border-2 border-foreground"
              >
                <Sparkles className="h-4 w-4" />
                Upgrade to Pro
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
