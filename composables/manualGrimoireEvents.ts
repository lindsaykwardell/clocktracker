export const MANUAL_GRIMOIRE_EVENT_PREFIX = "manual-event-";
export const AUTO_MANUAL_GRIMOIRE_EVENT_PREFIX = `${MANUAL_GRIMOIRE_EVENT_PREFIX}auto-`;

export function createManualGrimoireEventParticipantId() {
  const id =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${MANUAL_GRIMOIRE_EVENT_PREFIX}${id}`;
}

export function isManualGrimoireEventParticipant(participantId: string | null | undefined) {
  return participantId?.startsWith(MANUAL_GRIMOIRE_EVENT_PREFIX) ?? false;
}

export function isAutoManualGrimoireEventParticipant(participantId: string | null | undefined) {
  return participantId?.startsWith(AUTO_MANUAL_GRIMOIRE_EVENT_PREFIX) ?? false;
}

export function isBlankManualGrimoireEvent(event: {
  participant_id?: string | null;
  event_type?: string | null;
  status_source?: string | null;
  cause?: string | null;
  by_participant_id?: string | null;
  player_name?: string | null;
  role_id?: string | null;
  by_role_id?: string | null;
  old_role_id?: string | null;
  new_role_id?: string | null;
  old_alignment?: string | null;
  new_alignment?: string | null;
}) {
  if (!isManualGrimoireEventParticipant(event.participant_id)) return false;

  return (
    !event.event_type &&
    !event.status_source &&
    !event.cause &&
    !event.by_participant_id &&
    !event.player_name?.trim() &&
    !event.role_id &&
    !event.by_role_id &&
    !event.old_role_id &&
    !event.new_role_id &&
    !event.old_alignment &&
    !event.new_alignment
  );
}
