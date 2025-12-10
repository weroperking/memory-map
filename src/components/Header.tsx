import { MapPin, Image, Sparkles, Menu, Edit3, Package, Brain, User, LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { GPSTipsDialog } from './GPSTipsDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { analytics, logPageView } from '@/lib/analytics';

interface HeaderProps {
  activeView: 'gallery' | 'map';
  onViewChange: (view: 'gallery' | 'map') => void;
  onUpgrade: () => void;
}

export function Header({ activeView, onViewChange, onUpgrade }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, isPro, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    analytics.logActivity('user_logout', 'auth');
    await signOut();
    setIsOpen(false);
  };

  const handleLogin = () => {
    analytics.logActivity('user_login_attempt', 'auth');
    navigate('/auth');
    setIsOpen(false);
  };

  const getUserInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

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

  const ProfileDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 border-2 border-foreground">
          <Avatar className="h-6 w-6 border border-foreground">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-mono">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline font-mono text-sm">
            {profile?.display_name || user?.email?.split('@')[0]}
          </span>
          {isPro && (
            <span className="text-xs bg-chart-4 text-foreground px-1.5 py-0.5 font-mono font-bold border border-foreground">
              PRO
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-2 border-foreground">
        <div className="px-2 py-2 border-b border-foreground">
          <p className="font-mono text-sm font-bold">{profile?.display_name || 'User'}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          {isPro && (
            <span className="inline-block mt-1 text-xs bg-chart-4 text-foreground px-1.5 py-0.5 font-mono font-bold border border-foreground">
              PRO MEMBER
            </span>
          )}
        </div>
        {!isPro && (
          <>
            <DropdownMenuItem onClick={onUpgrade} className="cursor-pointer gap-2 text-chart-4 font-bold">
              <Sparkles className="h-4 w-4" />
              Upgrade to Pro
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer gap-2 text-destructive">
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
          
          {!isLoading && (
            <>
              {user ? (
                <>
                  {!isPro && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={onUpgrade}
                            className="gap-2 bg-chart-4 text-foreground hover:bg-chart-4/90 border-2 border-foreground shadow-sm animate-pulse"
                          >
                            <Sparkles className="h-4 w-4" />
                            Upgrade to Pro
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="border-2 border-chart-4 bg-chart-4/95 text-foreground">
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2 font-bold">
                              <Edit3 className="h-3 w-3" />
                              Edit Image Metadata
                            </div>
                            <div className="flex items-center gap-2 font-bold">
                              <Package className="h-3 w-3" />
                              Batch Download Images
                            </div>
                            <div className="flex items-center gap-2 font-bold">
                              <Brain className="h-3 w-3" />
                              AI Detection + 13 Fields
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <ProfileDropdown />
                </>
              ) : (
                <Button onClick={handleLogin} variant="outline" className="gap-2 border-2 border-foreground">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </>
          )}
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
              {/* User info at top of mobile menu */}
              {user && (
                <div className="flex items-center gap-3 pb-4 border-b-2 border-foreground">
                  <Avatar className="h-10 w-10 border-2 border-foreground">
                    <AvatarFallback className="bg-primary text-primary-foreground font-mono">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-mono font-bold">{profile?.display_name || user.email?.split('@')[0]}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {isPro && (
                      <span className="inline-block mt-1 text-xs bg-chart-4 text-foreground px-1.5 py-0.5 font-mono font-bold border border-foreground">
                        PRO
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <NavItems />
              <GPSTipsDialog />
              
              {!user ? (
                <Button
                  onClick={handleLogin}
                  className="gap-2 border-2 border-foreground"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              ) : (
                <>
                  {!isPro && (
                    <Button
                      onClick={() => {
                        onUpgrade();
                        setIsOpen(false);
                      }}
                      className="gap-2 bg-chart-4 text-foreground hover:bg-chart-4/90 border-2 border-foreground animate-pulse"
                    >
                      <Sparkles className="h-4 w-4" />
                      Upgrade to Pro
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="gap-2 border-2 border-foreground text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              )}
              
              {!isPro && (
                <div className="border-t-2 border-foreground pt-4 text-xs space-y-2">
                  <p className="font-bold text-chart-4">Pro Features:</p>
                  <div className="flex items-center gap-2">
                    <Edit3 className="h-3 w-3 text-chart-4" />
                    <span>Edit Image Metadata</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-chart-4" />
                    <span>Batch Download</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-3 w-3 text-chart-4" />
                    <span>AI + 13 Metadata Fields</span>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
