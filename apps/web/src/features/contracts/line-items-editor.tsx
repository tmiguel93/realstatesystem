import { Plus, Trash2 } from "lucide-react";
import { FormInput } from "@/components/form/form-input";
import { useI18n } from "@/features/preferences/language-provider";

export type MoneyLineItem = {
  label: string;
  amount: number;
};

type LineItemsEditorProps = {
  title: string;
  description: string;
  items: MoneyLineItem[];
  onChange: (items: MoneyLineItem[]) => void;
};

export function LineItemsEditor({
  title,
  description,
  items,
  onChange,
}: LineItemsEditorProps) {
  const { t } = useI18n();

  const updateItem = (
    index: number,
    field: keyof MoneyLineItem,
    value: string | number,
  ) => {
    onChange(
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  return (
    <div className="space-y-4 rounded-[24px] border border-ink-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink-950">{title}</p>
          <p className="mt-1 text-sm text-ink-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...items, { label: "", amount: 0 }])}
          className="secondary-button px-3 py-2"
        >
          <Plus size={14} />
          {t("common.add")}
        </button>
      </div>

      <div className="space-y-3">
        {items.length ? (
          items.map((item, index) => (
            <div
              key={`${title}-${index}`}
              className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_56px]"
            >
              <FormInput
                label={t("common.description")}
                value={item.label}
                onChange={(event) => updateItem(index, "label", event.target.value)}
              />
              <FormInput
                label={t("common.amount")}
                type="number"
                step="0.01"
                value={item.amount}
                onChange={(event) =>
                  updateItem(index, "amount", Number(event.target.value || 0))
                }
              />
              <button
                type="button"
                onClick={() =>
                  onChange(items.filter((_, itemIndex) => itemIndex !== index))
                }
                className="secondary-button mt-[30px] px-3 py-3 text-rose-700"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-[20px] border border-dashed border-ink-200 px-4 py-4 text-sm text-ink-500">
            {t("common.noneRegisteredYet")}
          </div>
        )}
      </div>
    </div>
  );
}
