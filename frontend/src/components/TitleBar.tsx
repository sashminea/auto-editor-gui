import { useEffect, useRef, useState } from "react";
import {
  MoonIcon,
  SunIcon,
  QuestionMarkCircledIcon,
  GitHubLogoIcon,
  LinkedInLogoIcon,
  PlayIcon,
} from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import type { Theme } from "@/lib/theme";

const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

interface TitleBarProps {
  theme: Theme;
  onToggleTheme: () => void;
}

const helpLinks = [
  { title: "Tutorial", href: "/docs", icon: PlayIcon, hint: "Watch how the GUI works" },
  { title: "Contribute", href: "https://github.com/sashminea/auto-editor-gui", icon: GitHubLogoIcon, hint: "Send us a pull request" },
  { title: "Contact us", href: "https://www.linkedin.com/in/sashminadhikari/", icon: LinkedInLogoIcon, hint: "Questions or need help?" },
];

const TitleBar: React.FC<TitleBarProps> = ({ theme, onToggleTheme }) => {
  const [helpOpen, setHelpOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!helpOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setHelpOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setHelpOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [helpOpen]);

  return (
    <header
      className="flex h-10 shrink-0 select-none items-center justify-between border-b bg-card [-webkit-app-region:drag]"
      // Leave room for native window controls (right on Windows/Linux, left on macOS)
      style={{ paddingLeft: isMac ? 84 : 12, paddingRight: isMac ? 12 : 150 }}
    >
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="text-primary">
          <path fill="currentColor" d="m22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29a.996.996 0 0 0-1.41 0L1.29 18.96a.996.996 0 0 0 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05a.996.996 0 0 0 0-1.41zm-1.03 5.49l-2.12-2.12l2.44-2.44l2.12 2.12z" />
        </svg>
        <span className="text-sm font-semibold">Auto-Editor GUI</span>
      </div>

      <div className="flex items-center gap-1 [-webkit-app-region:no-drag]">
        <div className="relative" ref={menuRef}>
          <Button variant="ghost" size="sm" onClick={() => setHelpOpen((o) => !o)} aria-expanded={helpOpen} aria-haspopup="menu">
            <QuestionMarkCircledIcon /> Help
          </Button>
          {helpOpen && (
            <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-64 rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">
              {helpLinks.map(({ title, href, icon: Icon, hint }) => (
                <a
                  key={title}
                  role="menuitem"
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  onClick={() => setHelpOpen(false)}
                  className="flex items-start gap-3 rounded-sm p-2 text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block font-medium leading-tight">{title}</span>
                    <span className="block text-xs text-muted-foreground">{hint}</span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Light theme" : "Dark theme"}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </Button>
      </div>
    </header>
  );
};

export default TitleBar;