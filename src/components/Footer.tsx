import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t-2 border-foreground bg-background">
      <div className="container py-6 text-center">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Link to="/legal/privacy" className="text-sm text-muted-foreground hover:text-foreground">
            Privacy Policy
          </Link>
          <span className="hidden sm:inline">•</span>
          <Link to="/legal/terms" className="text-sm text-muted-foreground hover:text-foreground">
            Terms of Service
          </Link>
          <span className="hidden sm:inline">•</span>
          <Link to="/legal/refund" className="text-sm text-muted-foreground hover:text-foreground">
            Refund Policy
          </Link>
          <span className="hidden sm:inline">•</span>
          <Link to="/legal" className="text-sm text-muted-foreground hover:text-foreground">
            Legal
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-4">© {new Date().getFullYear()} PHOTOMAP. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
