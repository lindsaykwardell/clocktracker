export type EndTriggerSubtypeOption = {
  value: string;
  label: string;
};

export const END_TRIGGER_SUBTYPE_OPTIONS: Record<string, EndTriggerSubtypeOption[]> = {
  leviathan: [
    {
      value: "LEVIATHAN_SECOND_GOOD_EXECUTION",
      label: "Second good execution",
    },
    {
      value: "LEVIATHAN_DAY_FIVE",
      label: "5 days passed",
    },
  ],
  atheist: [
    {
      value: "ATHEIST_STORYTELLER_EXECUTED",
      label: "Atheist in play and Storyteller executed",
    },
    {
      value: "NO_ATHEIST_STORYTELLER_EXECUTED",
      label: "No Atheist in play and Storyteller executed",
    },
  ],
};

export function getEndTriggerSubtypeOptions(roleId: string | null | undefined) {
  if (!roleId) return [];
  return END_TRIGGER_SUBTYPE_OPTIONS[roleId] ?? [];
}

export function parseEndTriggerSubtype(subtype: string | null | undefined) {
  if (!subtype) return null;
  const trimmed = subtype.trim();
  return trimmed.length > 0 ? trimmed : null;
}
