export type ReminderKind = 'reminder_24h' | 'reminder_2h' | 'reminder_1h';

export type ReminderActionButton = {
  id: string;
  label: string;
  url: string;
};

export function formatAppointmentHebrew(appointmentTimeIso: string) {
  return new Date(appointmentTimeIso).toLocaleString('he-IL', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildReminderMessage(params: {
  businessName: string;
  appointmentTimeIso: string;
  reminderKind: ReminderKind;
  confirmUrl: string;
  cancelUrl: string;
}) {
  const when = formatAppointmentHebrew(params.appointmentTimeIso);
  const leadByKind: Record<ReminderKind, string> = {
    reminder_24h: 'תזכורת: מחר יש לך תור',
    reminder_2h: 'תזכורת: בעוד כשעתיים יש לך תור',
    reminder_1h: 'תזכורת: בעוד שעה יש לך תור',
  };
  const lead = leadByKind[params.reminderKind];

  const lines = [
    `FlashTor | ${params.businessName}`,
    `${lead} (${when}).`,
    '',
    `✅ אשר הגעה: ${params.confirmUrl}`,
    `❌ בטל תור: ${params.cancelUrl}`,
  ];

  return lines.join('\n');
}

export function buildReminderActions(confirmUrl: string, cancelUrl: string): ReminderActionButton[] {
  return [
    {
      id: 'confirm_arrival',
      label: 'אשר הגעה',
      url: confirmUrl,
    },
    {
      id: 'cancel_appointment',
      label: 'בטל תור',
      url: cancelUrl,
    },
  ];
}
