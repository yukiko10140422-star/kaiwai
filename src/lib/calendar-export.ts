export function generateGoogleCalendarUrl(task: {
  title: string;
  description?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  location?: string | null;
}): string | null {
  if (!task.due_date) return null;

  const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  const params = new URLSearchParams();
  params.set("text", task.title);

  if (task.description) {
    params.set("details", task.description);
  }
  if (task.location) {
    params.set("location", task.location);
  }

  // Format dates for Google Calendar (YYYYMMDDTHHmmssZ or YYYYMMDD/YYYYMMDD)
  if (task.due_time) {
    // With time: set as 1-hour event
    const start =
      task.due_date.replace(/-/g, "") +
      "T" +
      task.due_time.replace(/:/g, "") +
      "00";
    const endDate = new Date(`${task.due_date}T${task.due_time}`);
    endDate.setHours(endDate.getHours() + 1);
    const end = endDate
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
    params.set("dates", `${start}/${end}`);
  } else {
    // All-day event
    const dateStr = task.due_date.replace(/-/g, "");
    const nextDay = new Date(task.due_date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split("T")[0].replace(/-/g, "");
    params.set("dates", `${dateStr}/${nextDayStr}`);
  }

  return `${baseUrl}&${params.toString()}`;
}

export function generateIcsContent(task: {
  title: string;
  description?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  location?: string | null;
}): string | null {
  if (!task.due_date) return null;

  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  let dtstart: string;
  let dtend: string;

  if (task.due_time) {
    dtstart =
      task.due_date.replace(/-/g, "") +
      "T" +
      task.due_time.replace(/:/g, "") +
      "00";
    const endDate = new Date(`${task.due_date}T${task.due_time}`);
    endDate.setHours(endDate.getHours() + 1);
    dtend = endDate
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")
      .split("Z")[0];
  } else {
    dtstart = task.due_date.replace(/-/g, "");
    const nextDay = new Date(task.due_date);
    nextDay.setDate(nextDay.getDate() + 1);
    dtend = nextDay.toISOString().split("T")[0].replace(/-/g, "");
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KAIWAI//Task//JA",
    "BEGIN:VEVENT",
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${task.title}`,
  ];

  if (task.description)
    lines.push(`DESCRIPTION:${task.description.replace(/\n/g, "\\n")}`);
  if (task.location) lines.push(`LOCATION:${task.location}`);
  lines.push(`DTSTAMP:${now}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
