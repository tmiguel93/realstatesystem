type OptionLike = {
  value: string;
  label: string;
};

export function getOptionLabel(
  options: readonly OptionLike[],
  value?: string | null,
) {
  if (!value) {
    return "Nao informado";
  }

  return options.find((option) => option.value === value)?.label ?? value;
}
