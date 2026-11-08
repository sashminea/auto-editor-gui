import { useEffect, useRef, useState } from "react";
import {
  MoonIcon, SunIcon, HomeIcon, QuestionMarkCircledIcon, GitHubLogoIcon, LinkedInLogoIcon, PlayIcon, MixerHorizontalIcon,
} from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import logo from "@/assets/icon.ico"; // repo-root built-assets/icon.ico
import type { Theme } from "@/lib/theme";

const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

interface TitleBarProps {
  theme: Theme;
  onToggleTheme: () => void;
  onOpenOptions: () => void;
  optionsCount: number;
  onHome?: () => void; // only passed while a video is open
}

const helpLinks = [
  { title: "Tutorial", href: "/docs", icon: PlayIcon, hint: "Watch how the GUI works" },
  { title: "Contribute", href: "https://github.com/sashminea/auto-editor-gui#read-me", icon: GitHubLogoIcon, hint: "Send us a pull request" },
  { title: "Contact us", href: "https://www.linkedin.com/in/sashminadhikari/", icon: LinkedInLogoIcon, hint: "Questions or need help?" },
];

const TitleBar: React.FC<TitleBarProps> = ({ theme, onToggleTheme, onOpenOptions, optionsCount, onHome }) => {
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
      className="flex h-10 shrink-0 select-none items-center justify-between border-b bg-background [-webkit-app-region:drag]"
      // Leave room for native window controls (right on Windows/Linux, left on macOS)
      style={{ paddingLeft: isMac ? 84 : 12, paddingRight: isMac ? 12 : 150 }}
    >
      <div className="flex items-center gap-2">
        <img src={logo} alt="" draggable={false} className="h-6 w-6 object-contain" />
        <span className="text-sm font-medium tracking-tight">Auto-Editor GUI</span>
        {onHome && (
          <button
            type="button"
            onClick={onHome}
            aria-label="Back to start"
            title="Back to start"
            className="ml-1 grid h-6 w-6 place-items-center rounded-full text-muted-foreground/40 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [-webkit-app-region:no-drag]"
          >
            <HomeIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 [-webkit-app-region:no-drag]">
        <Button variant="outline" size="sm" onClick={onOpenOptions} title="More options (Ctrl+,)">
          <MixerHorizontalIcon /> Options
          {optionsCount > 0 && (
            <span className="mono-label rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">{optionsCount}</span>
          )}
        </Button>

        <div className="relative" ref={menuRef}>
          <Button variant="ghost" size="sm" onClick={() => setHelpOpen((o) => !o)} aria-expanded={helpOpen} aria-haspopup="menu">
            <QuestionMarkCircledIcon /> Help
          </Button>
          {helpOpen && (
            <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border bg-popover/95 p-1.5 text-popover-foreground shadow-xl backdrop-blur-xl">
              {helpLinks.map(({ title, href, icon: Icon, hint }) => (
                <a
                  key={title}
                  role="menuitem"
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  onClick={() => setHelpOpen(false)}
                  className="flex items-start gap-3 rounded-xl p-2.5 text-sm hover:bg-accent focus:bg-accent focus:outline-none"
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
          variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleTheme}
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