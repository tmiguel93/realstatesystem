import { useState } from "react";
import { localeOptions, themeOptions } from "@imobiliaria/shared";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { useAuth } from "@/features/auth/auth-context";
import { useI18n } from "@/features/preferences/language-provider";
import { useTheme } from "@/features/preferences/theme-provider";

export function SettingsPage() {
  const { updatePreferences } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const { themePreference, setThemePreference, resolvedTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  const persistPreferences = async () => {
    setSaving(true);
    try {
      await updatePreferences({
        preferredTheme: themePreference,
        preferredLocale: locale,
      });
      toast.success(t("common.preferencesSaved"));
    } catch {
      toast.error(t("common.preferencesError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("settings.eyebrow")}
        title={t("settings.title")}
        description={t("settings.description")}
        actions={
          <button
            type="button"
            onClick={() => void persistPreferences()}
            disabled={saving}
            className="secondary-button"
          >
            {saving ? `${t("common.loading")}...` : t("settings.saveButton")}
          </button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title={t("settings.themeTitle")}
          description={t("settings.themeDescription")}
        >
          <div className="grid gap-3">
            {themeOptions.map((option) => {
              const selected = option.value === themePreference;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setThemePreference(option.value as "SYSTEM" | "LIGHT" | "DARK")
                  }
                  className={`rounded-[24px] border px-5 py-5 text-left transition ${
                    selected
                      ? "border-brand-300 bg-brand-50"
                      : "border-ink-200 bg-[var(--elevated-bg)]"
                  }`}
                >
                  <p className="font-semibold text-ink-950">{option.label}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    {t("settings.themeResolved", {
                      theme:
                        resolvedTheme === "dark"
                          ? t("settings.themeResolvedDark")
                          : t("settings.themeResolvedLight"),
                    })}
                  </p>
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title={t("settings.languageTitle")}
          description={t("settings.languageDescription")}
        >
          <div className="grid gap-3">
            {localeOptions.map((option) => {
              const selected = option.value === locale;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLocale(option.value as "PT_BR" | "EN" | "ES")}
                  className={`rounded-[24px] border px-5 py-5 text-left transition ${
                    selected
                      ? "border-brand-300 bg-brand-50"
                      : "border-ink-200 bg-[var(--elevated-bg)]"
                  }`}
                >
                  <p className="font-semibold text-ink-950">{option.label}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    {option.value === "PT_BR"
                      ? t("settings.localePrimary")
                      : t("settings.localeSecondary")}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            {t("settings.legalNote")}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
