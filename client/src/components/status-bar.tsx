import { Wifi, Signal, Battery } from "lucide-react";
import { useI18n } from "@/i18n";

export default function StatusBar() {
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false
  });

  const { t, lang, setLang, translateFallbackEnabled, setTranslateFallbackEnabled } = useI18n();

  return (
    <div className="status-bar" data-testid="status-bar">
      <div className="flex items-center space-x-1">
        <div className="w-1 h-1 bg-foreground rounded-full"></div>
        <div className="w-1 h-1 bg-foreground rounded-full"></div>
        <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
      </div>
      <div className="text-sm font-medium text-foreground" data-testid="status-time">
        {currentTime}
      </div>
      <div className="flex items-center space-x-1">
        <Signal className="w-3 h-3" />
        <Wifi className="w-3 h-3" />
        <div className="w-6 h-3 border border-foreground rounded-sm">
          <div className="w-4 h-2 bg-secondary rounded-sm m-0.5"></div>
        </div>
        <div className="ml-2 flex items-center space-x-2">
          <select aria-label="language" value={lang} onChange={(e) => setLang(e.target.value as any)} className="bg-transparent text-sm">
            <option value="en">{t('lang_en_short')}</option>
            <option value="hi">{t('lang_hi_short')}</option>
          </select>
          <label className="text-xs flex items-center space-x-1">
            <input type="checkbox" checked={translateFallbackEnabled} onChange={(e) => setTranslateFallbackEnabled(e.target.checked)} />
            <span>{t('auto_translate')}</span>
          </label>
        </div>
      </div>
    </div>
  );
}
