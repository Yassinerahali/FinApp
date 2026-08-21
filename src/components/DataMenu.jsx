import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";

export default function DataMenu({ onImport, onExportCsv, onBackupJson, onRestoreClick }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleAction(fn) {
    fn();
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("dataMenuAria")}
        className="w-8 h-8 rounded-full border border-(--color-rule) flex items-center justify-center shrink-0 hover:border-(--color-brass) transition-colors"
      >
        <span aria-hidden="true" className="text-sm leading-none">📁</span>
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-56 border border-(--color-rule) bg-(--color-paper) shadow-lg z-20 animate-scale-in">
          <button
            onClick={() => handleAction(onImport)}
            className="w-full text-start px-4 py-2.5 text-sm hover:bg-(--color-paper-bar)/50 transition-colors border-b border-(--color-rule)"
          >
            {t("importButton")}
          </button>
          <button
            onClick={() => handleAction(onExportCsv)}
            className="w-full text-start px-4 py-2.5 text-sm hover:bg-(--color-paper-bar)/50 transition-colors border-b border-(--color-rule)"
          >
            {t("exportCsv")}
          </button>
          <button
            onClick={() => handleAction(onBackupJson)}
            className="w-full text-start px-4 py-2.5 text-sm hover:bg-(--color-paper-bar)/50 transition-colors border-b border-(--color-rule)"
          >
            {t("backupJson")}
          </button>
          <button
            onClick={() => handleAction(onRestoreClick)}
            className="w-full text-start px-4 py-2.5 text-sm hover:bg-(--color-paper-bar)/50 transition-colors"
          >
            {t("restoreBackup")}
          </button>
        </div>
      )}
    </div>
  );
}
