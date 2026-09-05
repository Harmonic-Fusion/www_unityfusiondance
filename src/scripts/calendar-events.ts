type CalendarEvent = {
  summary: string;
  description: string;
  location: string;
  start: Date | null;
  end: Date | null;
  rrule: string | null;
};

type RRule = {
  freq: string;
  interval?: number;
  count?: number;
  until?: Date | null;
  byday?: string[];
};

const TIMEZONE = 'America/Los_Angeles';
const DAY_MAP: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function decodeICalText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .replace(/\\[nN]/g, '\n');
}

function parseICalDate(dateString: string): Date | null {
  if (!dateString) return null;
  dateString = dateString.trim();

  if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10) - 1;
    const day = parseInt(dateString.substring(6, 8), 10);
    return new Date(year, month, day, 0, 0, 0);
  }

  if (dateString.length >= 15 && dateString.includes('T')) {
    const datePart = dateString.substring(0, 8);
    const timePart = dateString.substring(9);
    const year = parseInt(datePart.substring(0, 4), 10);
    const month = parseInt(datePart.substring(4, 6), 10) - 1;
    const day = parseInt(datePart.substring(6, 8), 10);
    const timeStr = timePart.replace('Z', '');
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (timeStr.length >= 6) {
      hours = parseInt(timeStr.substring(0, 2), 10) || 0;
      minutes = parseInt(timeStr.substring(2, 4), 10) || 0;
      seconds = parseInt(timeStr.substring(4, 6), 10) || 0;
    } else if (timeStr.length >= 4) {
      hours = parseInt(timeStr.substring(0, 2), 10) || 0;
      minutes = parseInt(timeStr.substring(2, 4), 10) || 0;
    }

    if (dateString.endsWith('Z')) {
      return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    }
    return new Date(year, month, day, hours, minutes, seconds);
  }

  return null;
}

function parseICal(icalData: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icalData.split(/\r?\n/);
  let currentEvent: CalendarEvent | null = null;
  let inEvent = false;
  let currentProperty = '';
  let currentValue = '';

  const saveProperty = () => {
    if (!currentProperty || !currentEvent) return;
    const trimmedValue = currentValue.trim();
    if (currentProperty === 'start' || currentProperty === 'end') {
      // Dates are set directly when parsed
    } else if (currentProperty === 'summary') {
      currentEvent.summary = trimmedValue;
    } else if (currentProperty === 'description') {
      currentEvent.description = trimmedValue;
    } else if (currentProperty === 'location') {
      currentEvent.location = decodeICalText(trimmedValue);
    } else if (currentProperty === 'rrule') {
      currentEvent.rrule = trimmedValue;
    }
    currentProperty = '';
    currentValue = '';
  };

  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    let line = originalLine.trim();
    if (!line) continue;

    if (originalLine.startsWith(' ') || originalLine.startsWith('\t')) {
      if (currentProperty && currentEvent) {
        currentValue += ' ' + line;
      }
      continue;
    }

    saveProperty();

    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {
        summary: '',
        description: '',
        location: '',
        start: null,
        end: null,
        rrule: null,
      };
      continue;
    }

    if (line === 'END:VEVENT') {
      if (currentEvent) {
        saveProperty();
        if (currentEvent.start) {
          if (!currentEvent.end) {
            currentEvent.end = new Date(currentEvent.start.getTime() + 60 * 60 * 1000);
          }
          events.push(currentEvent);
        }
      }
      inEvent = false;
      currentEvent = null;
      currentProperty = '';
      currentValue = '';
      continue;
    }

    if (!inEvent || !currentEvent) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const property = line.substring(0, colonIndex).toUpperCase();
    const value = line.substring(colonIndex + 1);
    const semicolonIndex = property.indexOf(';');
    const propertyName = semicolonIndex !== -1 ? property.substring(0, semicolonIndex) : property;

    switch (propertyName) {
      case 'SUMMARY':
        currentProperty = 'summary';
        currentValue = value;
        break;
      case 'DESCRIPTION':
        currentProperty = 'description';
        currentValue = value;
        break;
      case 'LOCATION':
        currentProperty = 'location';
        currentValue = decodeICalText(value);
        break;
      case 'DTSTART': {
        const startDate = parseICalDate(value);
        if (startDate) currentEvent.start = startDate;
        break;
      }
      case 'DTEND': {
        const endDate = parseICalDate(value);
        if (endDate) currentEvent.end = endDate;
        break;
      }
      case 'RRULE':
        currentProperty = 'rrule';
        currentValue = value;
        break;
    }
  }

  return events;
}

function parseRRULE(rruleString: string): RRule | null {
  if (!rruleString) return null;
  const rrule: RRule = { freq: '' };
  for (const part of rruleString.split(';')) {
    const [key, value] = part.split('=');
    if (!key || !value) continue;
    const upperKey = key.toUpperCase();
    if (upperKey === 'FREQ') rrule.freq = value.toUpperCase();
    else if (upperKey === 'INTERVAL') rrule.interval = parseInt(value, 10) || 1;
    else if (upperKey === 'COUNT') rrule.count = parseInt(value, 10);
    else if (upperKey === 'UNTIL') rrule.until = parseICalDate(value);
    else if (upperKey === 'BYDAY') rrule.byday = value.split(',');
  }
  return rrule.freq ? rrule : null;
}

function parseBydays(byday: string[]): number[] {
  return byday
    .map((d) => {
      const match = d.match(/^(-?\d+)?([A-Z]+)$/i);
      if (match) return DAY_MAP[match[2].toUpperCase()];
      return DAY_MAP[d.toUpperCase()];
    })
    .filter((d): d is number => d !== undefined);
}

function expandRRULE(event: CalendarEvent, maxDate: Date): CalendarEvent[] {
  if (!event.rrule || !event.start) return [];
  const rrule = parseRRULE(event.rrule);
  if (!rrule) return [];

  const instances: CalendarEvent[] = [];
  const startUTC = new Date(event.start);
  let currentDateUTC = new Date(
    Date.UTC(
      startUTC.getUTCFullYear(),
      startUTC.getUTCMonth(),
      startUTC.getUTCDate(),
      startUTC.getUTCHours(),
      startUTC.getUTCMinutes(),
      startUTC.getUTCSeconds(),
    ),
  );
  const duration = event.end
    ? event.end.getTime() - event.start.getTime()
    : 60 * 60 * 1000;
  let count = 0;
  const maxInstances = 500;

  if (rrule.freq === 'WEEKLY' && rrule.byday?.length) {
    const targetDays = parseBydays(rrule.byday);
    if (targetDays.length > 0 && !targetDays.includes(currentDateUTC.getUTCDay())) {
      const originalHours = currentDateUTC.getUTCHours();
      const originalMinutes = currentDateUTC.getUTCMinutes();
      const originalSeconds = currentDateUTC.getUTCSeconds();
      for (let i = 1; i <= 7; i++) {
        const check = new Date(currentDateUTC);
        check.setUTCDate(check.getUTCDate() + i);
        if (targetDays.includes(check.getUTCDay())) {
          check.setUTCHours(originalHours, originalMinutes, originalSeconds);
          currentDateUTC = check;
          break;
        }
      }
    }
  }

  const maxDateUTC = new Date(maxDate.getTime());

  while (currentDateUTC <= maxDateUTC && count < maxInstances) {
    const instanceStart = new Date(currentDateUTC.getTime());
    instances.push({
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: instanceStart,
      end: new Date(instanceStart.getTime() + duration),
      rrule: null,
    });
    count++;

    if (rrule.freq === 'WEEKLY') {
      if (rrule.byday?.length) {
        const targetDays = parseBydays(rrule.byday);
        if (targetDays.length > 0) {
          let daysToAdd = 1;
          let found = false;
          for (let i = 1; i <= 14; i++) {
            const check = new Date(currentDateUTC);
            check.setUTCDate(check.getUTCDate() + i);
            if (targetDays.includes(check.getUTCDay())) {
              daysToAdd = i;
              found = true;
              break;
            }
          }
          currentDateUTC = new Date(currentDateUTC);
          currentDateUTC.setUTCDate(
            currentDateUTC.getUTCDate() + (found ? daysToAdd : (rrule.interval || 1) * 7),
          );
        } else {
          currentDateUTC = new Date(currentDateUTC);
          currentDateUTC.setUTCDate(currentDateUTC.getUTCDate() + (rrule.interval || 1) * 7);
        }
      } else {
        currentDateUTC = new Date(currentDateUTC);
        currentDateUTC.setUTCDate(currentDateUTC.getUTCDate() + (rrule.interval || 1) * 7);
      }
    } else if (rrule.freq === 'DAILY') {
      currentDateUTC = new Date(currentDateUTC);
      currentDateUTC.setUTCDate(currentDateUTC.getUTCDate() + (rrule.interval || 1));
    } else if (rrule.freq === 'MONTHLY') {
      currentDateUTC = new Date(currentDateUTC);
      currentDateUTC.setUTCMonth(currentDateUTC.getUTCMonth() + (rrule.interval || 1));
    } else if (rrule.freq === 'YEARLY') {
      currentDateUTC = new Date(currentDateUTC);
      currentDateUTC.setUTCFullYear(currentDateUTC.getUTCFullYear() + (rrule.interval || 1));
    } else {
      break;
    }

    if (rrule.count && count >= rrule.count) break;
    if (rrule.until && currentDateUTC > new Date(rrule.until)) break;
  }

  return instances;
}

function expandRecurringEvents(events: CalendarEvent[], maxDate: Date): CalendarEvent[] {
  const expanded: CalendarEvent[] = [];
  for (const event of events) {
    if (event.rrule && event.start) {
      expanded.push(...expandRRULE(event, maxDate));
    } else {
      expanded.push(event);
    }
  }
  return expanded;
}

async function fetchICalData(calendarId: string): Promise<string> {
  const calendarUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;

  try {
    const directResponse = await fetch(calendarUrl);
    if (directResponse.ok) {
      return await directResponse.text();
    }
  } catch {
    // Fall through to proxies
  }

  const proxies: {
    name: string;
    url: string;
    parse: (data: unknown) => string | null;
  }[] = [
    {
      name: 'allorigins.win',
      url: `https://api.allorigins.win/get?url=${encodeURIComponent(calendarUrl)}`,
      parse: (data) =>
        typeof data === 'object' && data && 'contents' in data
          ? String((data as { contents: string }).contents)
          : null,
    },
    {
      name: 'corsproxy.io',
      url: `https://corsproxy.io/?${encodeURIComponent(calendarUrl)}`,
      parse: (data) => (typeof data === 'string' ? data : null),
    },
  ];

  for (const proxy of proxies) {
    try {
      const response = await fetch(proxy.url, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!response.ok) continue;

      let proxyData: unknown;
      try {
        proxyData = await response.json();
      } catch {
        proxyData = await response.text();
      }

      let icalData = proxy.parse(proxyData);
      if (!icalData) continue;

      if (icalData.startsWith('data:')) {
        const base64Match = icalData.match(/base64,(.+)$/);
        if (base64Match?.[1]) {
          icalData = atob(base64Match[1]);
        } else {
          continue;
        }
      }

      return icalData;
    } catch {
      continue;
    }
  }

  throw new Error('Unable to load calendar feed. The calendar may need to be public.');
}

function createMapsUrl(location: string): string | null {
  if (!location || location === 'Location TBD') return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function formatEventDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: TIMEZONE,
  });
}

function formatEventTime(start: Date, end: Date | null): string {
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TIMEZONE,
  };
  const startTime = start.toLocaleTimeString('en-US', timeOptions);
  if (end) {
    return `${startTime} – ${end.toLocaleTimeString('en-US', timeOptions)}`;
  }
  return startTime;
}

function cleanDescriptionHTML(html: string): string {
  if (!html) return '';

  let decoded = decodeICalText(html);
  // Convert bare newlines to breaks when content is mostly plain text
  if (!/<[a-z][\s\S]*>/i.test(decoded)) {
    decoded = escapeHtml(decoded).replace(/\n/g, '<br />');
    return decoded;
  }

  let tempDiv: HTMLElement;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(decoded, 'text/html');
    if (doc.querySelector('parsererror')) {
      tempDiv = document.createElement('div');
      tempDiv.innerHTML = decoded;
    } else {
      tempDiv = doc.body;
    }
  } catch {
    tempDiv = document.createElement('div');
    tempDiv.innerHTML = decoded;
  }

  const textWalker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let textNode = textWalker.nextNode();
  while (textNode) {
    textNodes.push(textNode as Text);
    textNode = textWalker.nextNode();
  }

  for (const node of textNodes) {
    let text = node.textContent ?? '';
    text = text
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\n/g, ' ')
      .replace(/\\N/g, ' ')
      .replace(/\\\\/g, '\\')
      .replace(/Â/g, '')
      .replace(/\s{2,}/g, ' ');
    node.textContent = text;
  }

  return tempDiv.innerHTML
    .replace(/<p[^>]*>\s*<\/p>/g, '')
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<br\s*\/?>\s*<br\s*\/?>/g, '<br>');
}

function createEventCard(event: CalendarEvent): string {
  const dateStr = event.start ? formatEventDate(event.start) : '';
  const timeStr = event.start ? formatEventTime(event.start, event.end) : '';
  const locationStr = decodeICalText(event.location) || 'Location TBD';
  const mapsUrl = createMapsUrl(locationStr);
  const locationHtml = mapsUrl
    ? `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="upcoming-events__location-link">${escapeHtml(locationStr)}</a>`
    : escapeHtml(locationStr);

  return `
    <article class="upcoming-events__card" role="button" tabindex="0">
      <div class="upcoming-events__card-header">
        <h3 class="upcoming-events__card-title">${escapeHtml(event.summary || 'Untitled Event')}</h3>
        <span class="upcoming-events__card-date">${escapeHtml(dateStr)}</span>
      </div>
      <div class="upcoming-events__card-time">${escapeHtml(timeStr)}</div>
      <div class="upcoming-events__card-location">${locationHtml}</div>
    </article>
  `;
}

export function initUpcomingEvents(root: HTMLElement): void {
  const calendarId = root.dataset.calendarId;
  const daysAhead = Number(root.dataset.daysAhead || 90);
  const loadingEl = root.querySelector<HTMLElement>('[data-upcoming-loading]');
  const listEl = root.querySelector<HTMLElement>('[data-upcoming-list]');
  const modal = root.querySelector<HTMLDialogElement>('[data-upcoming-modal]');
  const modalTitle = root.querySelector<HTMLElement>('[data-modal-title]');
  const modalTime = root.querySelector<HTMLElement>('[data-modal-time]');
  const modalLocation = root.querySelector<HTMLElement>('[data-modal-location]');
  const modalDescription = root.querySelector<HTMLElement>('[data-modal-description]');
  const modalClose = root.querySelector<HTMLElement>('[data-modal-close]');

  if (!calendarId || !listEl || !modal || !modalTitle || !modalTime || !modalLocation || !modalDescription) {
    return;
  }

  let events: CalendarEvent[] = [];

  const setLoading = (active: boolean) => {
    loadingEl?.classList.toggle('is-active', active);
    loadingEl?.setAttribute('aria-hidden', active ? 'false' : 'true');
  };

  const showError = (message: string) => {
    listEl.innerHTML = `
      <div class="upcoming-events__empty">
        <p>${escapeHtml(message)}</p>
        <button type="button" class="btn btn--outline" data-upcoming-retry>Try again</button>
      </div>
    `;
    listEl.querySelector('[data-upcoming-retry]')?.addEventListener('click', () => {
      void loadEvents();
    });
  };

  const showModal = (event: CalendarEvent) => {
    modalTitle.textContent = event.summary || 'Untitled Event';
    modalTime.textContent =
      (event.start ? formatEventTime(event.start, event.end) : '') +
      (event.start ? ` (${formatEventDate(event.start)})` : '');

    const locationStr = decodeICalText(event.location) || 'Location TBD';
    const mapsUrl = createMapsUrl(locationStr);
    if (mapsUrl) {
      modalLocation.innerHTML = `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(locationStr)}</a>`;
    } else {
      modalLocation.textContent = locationStr;
    }

    modalDescription.innerHTML = cleanDescriptionHTML(
      event.description || 'No description available.',
    );
    modal.showModal();
  };

  const renderEvents = () => {
    if (events.length === 0) {
      listEl.innerHTML = `
        <div class="upcoming-events__empty">
          <p>No upcoming events in the next ${daysAhead} days. Check back soon, or view the full calendar.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = events.map((event) => createEventCard(event)).join('');
    listEl.querySelectorAll<HTMLElement>('.upcoming-events__card').forEach((card, index) => {
      const open = () => showModal(events[index]);
      card.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('a')) return;
        open();
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });
  };

  const loadEvents = async () => {
    setLoading(true);
    listEl.innerHTML = '';
    try {
      const icalData = await fetchICalData(calendarId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + daysAhead);
      endDate.setHours(23, 59, 59, 999);

      const parsed = parseICal(icalData);
      const expanded = expandRecurringEvents(parsed, endDate);
      events = expanded
        .filter((event): event is CalendarEvent & { start: Date } => Boolean(event.start))
        .filter((event) => event.start >= today && event.start <= endDate)
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      renderEvents();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load events. Please try again later.';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  modalClose?.addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });

  void loadEvents();
}

document.querySelectorAll<HTMLElement>('[data-upcoming-events]').forEach((root) => {
  initUpcomingEvents(root);
});
