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

function isDebugMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('debug')?.toLowerCase() === 'true';
}

function debug(...args: unknown[]): void {
  if (isDebugMode()) {
    console.log('[calendar-events debug]', ...args);
  }
}

function warn(...args: unknown[]): void {
  console.warn('[calendar-events]', ...args);
}

function error(...args: unknown[]): void {
  console.error('[calendar-events]', ...args);
}

function maskKey(value: string | undefined): string {
  if (!value) return '(not set)';
  if (value.length <= 8) return '*'.repeat(value.length);
  return value.slice(0, 4) + '...' + value.slice(-4);
}

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

export function parseICal(icalData: string): CalendarEvent[] {
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
    if (!key || value === undefined) continue;
    switch (key.toUpperCase()) {
      case 'FREQ':
        rrule.freq = value;
        break;
      case 'INTERVAL':
        rrule.interval = parseInt(value, 10) || 1;
        break;
      case 'COUNT':
        rrule.count = parseInt(value, 10) || undefined;
        break;
      case 'UNTIL':
        rrule.until = parseICalDate(value);
        break;
      case 'BYDAY':
        rrule.byday = value.split(',');
        break;
    }
  }
  if (!rrule.freq) return null;
  return rrule;
}

function getWeekdayOffset(dayCode: string): number {
  return DAY_MAP[dayCode.toUpperCase()] ?? -1;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function getNextWeekday(startDate: Date, targetDay: number): Date {
  const startDay = startDate.getDay();
  let diff = targetDay - startDay;
  if (diff <= 0) diff += 7;
  return addDays(startDate, diff);
}

export function expandRecurringEvents(events: CalendarEvent[], limitDate: Date): CalendarEvent[] {
  const expanded: CalendarEvent[] = [];
  for (const event of events) {
    if (!event.start) continue;
    if (event.rrule) {
      const rrule = parseRRULE(event.rrule);
      if (!rrule) {
        expanded.push(event);
        continue;
      }

      const duration = event.end
        ? event.end.getTime() - event.start.getTime()
        : 60 * 60 * 1000;
      const originalStart = new Date(event.start.getTime());
      let count = rrule.count ?? 100;
      let current = new Date(originalStart.getTime());
      const until = rrule.until || limitDate;

      while (count > 0 && current <= until && current <= limitDate) {
        if (rrule.byday && rrule.byday.length > 0) {
          for (const dayCode of rrule.byday) {
            const targetDay = getWeekdayOffset(dayCode);
            if (targetDay === -1) continue;
            const occurrence = getNextWeekday(current, targetDay);
            if (occurrence >= originalStart && occurrence <= until && occurrence <= limitDate) {
              expanded.push({
                ...event,
                start: new Date(occurrence.getTime()),
                end: new Date(occurrence.getTime() + duration),
              });
              count--;
              if (count <= 0) break;
            }
          }
        } else {
          expanded.push({
            ...event,
            start: new Date(current.getTime()),
            end: new Date(current.getTime() + duration),
          });
          count--;
        }

        switch (rrule.freq.toUpperCase()) {
          case 'DAILY':
            current = addDays(current, rrule.interval || 1);
            break;
          case 'WEEKLY':
            current = addDays(current, 7 * (rrule.interval || 1));
            break;
          case 'MONTHLY':
            current = addMonths(current, rrule.interval || 1);
            break;
          default:
            current = addDays(current, 7);
        }
      }
    } else {
      expanded.push(event);
    }
  }
  return expanded;
}

const FETCH_TIMEOUT_MS = 8000;
const FETCH_ROUNDS = 3;
const CACHE_PREFIX = 'calendar-events-ical:';

export type CalendarFetchOptions = {
  /** Inclusive lower bound for Google Calendar API (defaults to start of today). */
  timeMin?: Date;
  /** Exclusive-ish upper bound for Google Calendar API (optional). */
  timeMax?: Date;
  /** Distinguishes upcoming vs past caches for the same calendar. */
  cacheKey?: string;
};

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function cacheStorageKey(calendarId: string, cacheKey = 'upcoming'): string {
  return `${CACHE_PREFIX}${cacheKey}:${calendarId}`;
}

function readCachedICal(calendarId: string, cacheKey?: string): string | null {
  try {
    return sessionStorage.getItem(cacheStorageKey(calendarId, cacheKey));
  } catch {
    return null;
  }
}

function writeCachedICal(calendarId: string, data: string, cacheKey?: string): void {
  try {
    sessionStorage.setItem(cacheStorageKey(calendarId, cacheKey), data);
  } catch {
    // Storage unavailable or full; caching is optional
  }
}

function toRFC3339(date: Date): string {
  return date.toISOString();
}

type GoogleCalendarEvent = {
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

type GoogleCalendarResponse = {
  items?: GoogleCalendarEvent[];
};

function googleEventToICal(event: GoogleCalendarEvent): string | null {
  const summary = event.summary || '';
  if (!summary) return null;

  const startDateTime = event.start?.dateTime ?? event.start?.date ?? '';
  const endDateTime = event.end?.dateTime ?? event.end?.date ?? '';
  if (!startDateTime) return null;

  const formatDateTime = (value: string): string => {
    if (value.includes('T')) {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
      const iso = d.toISOString();
      return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    }
    return value.replace(/-/g, '');
  };

  const formatICalValue = (value: string): string => {
    return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  };

  const lines: string[] = [
    'BEGIN:VEVENT',
    `SUMMARY:${formatICalValue(summary)}`,
    `DTSTART${startDateTime.includes('T') ? '' : ';VALUE=DATE'}:${formatDateTime(startDateTime)}`,
  ];

  if (endDateTime) {
    lines.push(`DTEND${endDateTime.includes('T') ? '' : ';VALUE=DATE'}:${formatDateTime(endDateTime)}`);
  }

  if (event.description) {
    lines.push(`DESCRIPTION:${formatICalValue(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${formatICalValue(event.location)}`);
  }

  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

function isLocalHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

/** Build the Calendar events URL. On localhost, use the Vite proxy so the API key's production-only HTTP referrer restrictions still pass. */
function buildCalendarEventsUrl(
  calendarId: string,
  apiKey: string,
  timeMin: string,
  maxResults: number,
  timeMax?: string,
): string {
  let query =
    'key=' +
    encodeURIComponent(apiKey) +
    '&timeMin=' +
    encodeURIComponent(timeMin) +
    '&maxResults=' +
    String(maxResults) +
    '&singleEvents=true&orderBy=startTime';
  if (timeMax) {
    query += '&timeMax=' + encodeURIComponent(timeMax);
  }
  const path = 'calendars/' + encodeURIComponent(calendarId) + '/events?' + query;

  if (import.meta.env.DEV || isLocalHost()) {
    return '/api/google-calendar/' + path;
  }
  return 'https://www.googleapis.com/calendar/v3/' + path;
}

async function fetchGoogleCalendarEvents(
  calendarId: string,
  options: CalendarFetchOptions = {},
): Promise<string | null> {
  const apiKey = import.meta.env.PUBLIC_GOOGLE_CALENDAR_API_KEY;

  debug('Calendar ID:', calendarId);
  debug('PUBLIC_GOOGLE_CALENDAR_API_KEY:', maskKey(apiKey));

  if (!apiKey) {
    error('Calendar cannot load: PUBLIC_GOOGLE_CALENDAR_API_KEY is missing.');
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const timeMinDate = options.timeMin ?? today;
  const timeMin = toRFC3339(timeMinDate);
  const timeMax = options.timeMax ? toRFC3339(options.timeMax) : undefined;
  const maxResults = 250;
  const url = buildCalendarEventsUrl(calendarId, apiKey, timeMin, maxResults, timeMax);

  debug('Request URL (key masked):', url.replace(apiKey, '***'));
  debug('timeMin:', timeMin, 'timeMax:', timeMax ?? '(none)');

  try {
    const response = await fetchWithTimeout(url);
    if (!response?.ok) {
      let detail = '';
      try {
        const body: unknown = await response?.clone().json();
        if (body && typeof body === 'object' && 'error' in body) {
          const apiError = (body as { error?: { message?: string; status?: string } }).error;
          detail = apiError?.message || apiError?.status || '';
        }
      } catch {
        // ignore JSON parse errors; status text is enough
      }
      error(
        'Google Calendar API request failed:',
        response?.status,
        response?.statusText,
        detail || undefined,
      );
      return null;
    }
    const data: unknown = await response.json();
    if (typeof data !== 'object' || !data) {
      error('Google Calendar API returned invalid JSON');
      return null;
    }
    const items = (data as GoogleCalendarResponse).items ?? [];
    if (!Array.isArray(items)) {
      error('Google Calendar API response missing items array');
      return null;
    }
    debug('Raw API items count:', items.length);

    const events = items
      .map((event) => googleEventToICal(event))
      .filter((event): event is string => event !== null);

    debug('Parsed iCal events count:', events.length);

    if (events.length === 0) {
      warn('Google Calendar API returned no events for the requested range');
      // Empty calendar is a valid response; return an empty VCALENDAR so callers can show empty state.
      return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Unity Fusion//Google Calendar API//EN\r\nEND:VCALENDAR`;
    }
    debug('Loaded', events.length, 'events from Google Calendar API');
    return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Unity Fusion//Google Calendar API//EN\r\n${events.join('\r\n')}\r\nEND:VCALENDAR`;
  } catch (err) {
    error('Error fetching Google Calendar API:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function fetchICalData(
  calendarId: string,
  options: CalendarFetchOptions = {},
): Promise<string> {
  const cacheKey = options.cacheKey ?? 'upcoming';
  for (let round = 0; round < FETCH_ROUNDS; round++) {
    const data = await fetchGoogleCalendarEvents(calendarId, options);
    if (data) {
      writeCachedICal(calendarId, data, cacheKey);
      return data;
    }
    if (round < FETCH_ROUNDS - 1) {
      warn(`Retry ${round + 1}/${FETCH_ROUNDS - 1} after failure`);
      await new Promise((resolve) => setTimeout(resolve, 600 * (round + 1)));
    }
  }

  const cached = readCachedICal(calendarId, cacheKey);
  if (cached) {
    debug('Using cached calendar data from sessionStorage');
    return cached;
  }

  throw new Error('Unable to load calendar feed. The API key may be missing or the calendar may not be public.');
}

export function createMapsUrl(location: string): string | null {
  if (!location || location === 'Location TBD') return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function formatEventDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: TIMEZONE,
  });
}

export function formatEventTime(start: Date, end: Date | null): string {
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

export function cleanDescriptionHTML(html: string): string {
  if (!html) return '';

  let decoded = decodeICalText(html);
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
      .replace(/\\\\/g, '\\')
      .replace(/\\[nN]/g, '\n');
    node.textContent = text;
  }

  return tempDiv.innerHTML;
}

export function createEventCard(event: CalendarEvent): string {
  const title = escapeHtml(event.summary || 'Untitled Event');
  const timeStr = event.start
    ? `${formatEventTime(event.start, event.end)} (${formatEventDate(event.start)})`
    : 'Date TBD';
  const locationStr = decodeICalText(event.location) || 'Location TBD';
  const mapsUrl = createMapsUrl(locationStr);
  const locationHtml = mapsUrl
    ? `<a class="upcoming-events__location-link" href="${mapsUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(locationStr)}</a>`
    : escapeHtml(locationStr);

  return `
    <article class="upcoming-events__card" tabindex="0" role="button" aria-label="${title} — ${timeStr}">
      <div class="upcoming-events__card-header">
        <h3 class="upcoming-events__card-title">${title}</h3>
        <div class="upcoming-events__card-date">${escapeHtml(formatEventDate(event.start || new Date()))}</div>
      </div>
      <div class="upcoming-events__card-time">${escapeHtml(timeStr)}</div>
      <div class="upcoming-events__card-location">${locationHtml}</div>
    </article>
  `;
}

function renderDebugPanel(root: HTMLElement, allEvents: CalendarEvent[], filteredEvents: CalendarEvent[]): void {
  if (!isDebugMode()) return;

  const existing = root.querySelector('[data-calendar-debug]');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.dataset.calendarDebug = '';
  panel.className = 'upcoming-events__debug';
  panel.innerHTML = `
    <details open>
      <summary>Calendar debug</summary>
      <ul>
        <li><strong>Calendar ID:</strong> ${escapeHtml(root.dataset.calendarId || '(none)')}</li>
        <li><strong>API key:</strong> ${escapeHtml(maskKey(import.meta.env.PUBLIC_GOOGLE_CALENDAR_API_KEY))}</li>
        <li><strong>Debug mode:</strong> on</li>
        <li><strong>Total loaded events:</strong> ${allEvents.length}</li>
        <li><strong>Filtered events:</strong> ${filteredEvents.length}</li>
        <li><strong>URL:</strong> ${escapeHtml(window.location.href)}</li>
      </ul>
    </details>
  `;

  root.querySelector('[data-toolbar]')?.append(panel);
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
    error('Missing required calendar DOM elements');
    return;
  }

  debug('Initializing calendar for', calendarId);

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
      const allEvents = expanded
        .filter((event): event is CalendarEvent & { start: Date } => Boolean(event.start))
        .filter((event) => event.start >= today && event.start <= endDate)
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      events = allEvents;
      renderEvents();
      renderDebugPanel(root, allEvents, events);
      debug('Rendered', events.length, 'events in date range', today.toISOString(), 'to', endDate.toISOString());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load events. Please try again later.';
      error('Failed to load events:', message);
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

function eventDedupeKey(event: CalendarEvent & { start: Date }): string {
  return `${event.start.getTime()}|${event.summary || ''}|${event.location || ''}`;
}

export function initPastEvents(root: HTMLElement): void {
  const calendarId = root.dataset.calendarId;
  const monthsBack = Number(root.dataset.monthsBack || 6);
  const loadingEl = root.querySelector<HTMLElement>('[data-past-loading]');
  const loadingLabel = root.querySelector<HTMLElement>('[data-past-loading-label]');
  const listEl = root.querySelector<HTMLElement>('[data-past-list]');
  const moreEl = root.querySelector<HTMLElement>('[data-past-more]');
  const loadMoreBtn = root.querySelector<HTMLButtonElement>('[data-past-load-more]');
  const archiveEl = root.querySelector<HTMLElement>('[data-past-archive]');
  const modal = root.querySelector<HTMLDialogElement>('[data-past-modal]');
  const modalTitle = root.querySelector<HTMLElement>('[data-modal-title]');
  const modalTime = root.querySelector<HTMLElement>('[data-modal-time]');
  const modalLocation = root.querySelector<HTMLElement>('[data-modal-location]');
  const modalDescription = root.querySelector<HTMLElement>('[data-modal-description]');
  const modalClose = root.querySelector<HTMLElement>('[data-modal-close]');

  if (!calendarId || !listEl || !modal || !modalTitle || !modalTime || !modalLocation || !modalDescription) {
    error('Missing required past-events calendar DOM elements');
    return;
  }

  debug('Initializing past events for', calendarId, 'monthsBack:', monthsBack);

  let events: Array<CalendarEvent & { start: Date }> = [];
  const seenKeys = new Set<string>();
  /** Exclusive upper bound for the next older batch. */
  let nextRangeEnd = new Date();
  let loading = false;
  let hasMore = true;
  let archiveShown = false;

  const setLoading = (active: boolean, label = 'Loading past events…') => {
    loading = active;
    loadingEl?.classList.toggle('is-active', active);
    loadingEl?.setAttribute('aria-hidden', active ? 'false' : 'true');
    if (loadingLabel) loadingLabel.textContent = label;
    if (loadMoreBtn) {
      loadMoreBtn.disabled = active;
      loadMoreBtn.textContent = active ? 'Loading…' : 'Load more';
    }
  };

  const setHasMore = (value: boolean) => {
    hasMore = value;
    if (!moreEl) return;
    moreEl.hidden = !value;
  };

  const showArchive = () => {
    if (archiveShown || !archiveEl) return;
    archiveShown = true;
    archiveEl.hidden = false;
    debug('Showing 2023–2024 archived events');
  };

  const showError = (message: string) => {
    const empty = document.createElement('div');
    empty.className = 'past-events__empty';
    empty.innerHTML = `
      <p>${escapeHtml(message)}</p>
      <button type="button" class="btn btn--outline" data-past-retry>Try again</button>
    `;
    listEl.replaceChildren(empty);
    empty.querySelector('[data-past-retry]')?.addEventListener('click', () => {
      void loadNextBatch({ reset: true });
    });
    setHasMore(false);
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

  const attachCardListeners = (
    cards: NodeListOf<HTMLElement>,
    batch: Array<CalendarEvent & { start: Date }>,
  ) => {
    cards.forEach((card, index) => {
      const event = batch[index];
      if (!event) return;
      const open = () => showModal(event);
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

  const renderEmptyInitial = () => {
    listEl.innerHTML = `
      <div class="past-events__empty">
        <p>No events found in this period. Try loading more, or view the full calendar.</p>
      </div>
    `;
  };

  const appendEvents = (batch: Array<CalendarEvent & { start: Date }>) => {
    const empty = listEl.querySelector('.past-events__empty');
    if (empty) empty.remove();

    const wrapper = document.createElement('div');
    wrapper.innerHTML = batch.map((event) => createEventCard(event)).join('');
    const cards = wrapper.querySelectorAll<HTMLElement>('.upcoming-events__card');
    attachCardListeners(cards, batch);
    listEl.append(...Array.from(wrapper.children));
  };

  const loadNextBatch = async ({ reset = false }: { reset?: boolean } = {}) => {
    if (loading) return;
    if (!reset && !hasMore) return;

    if (reset) {
      events = [];
      seenKeys.clear();
      nextRangeEnd = new Date();
      hasMore = true;
      archiveShown = false;
      listEl.replaceChildren();
      if (archiveEl) archiveEl.hidden = true;
      setHasMore(false);
    }

    const rangeEnd = new Date(nextRangeEnd);
    const rangeStart = new Date(rangeEnd);
    rangeStart.setMonth(rangeStart.getMonth() - monthsBack);
    rangeStart.setHours(0, 0, 0, 0);

    const isInitial = events.length === 0;
    setLoading(true, isInitial ? 'Loading past events…' : 'Loading more events…');

    try {
      const cacheKey = `past-${rangeStart.toISOString().slice(0, 10)}_${rangeEnd.toISOString().slice(0, 10)}`;
      const icalData = await fetchICalData(calendarId, {
        timeMin: rangeStart,
        timeMax: rangeEnd,
        cacheKey,
      });

      const parsed = parseICal(icalData);
      // API already expands recurring instances via singleEvents=true.
      const batch = parsed
        .filter((event): event is CalendarEvent & { start: Date } => Boolean(event.start))
        .filter((event) => event.start >= rangeStart && event.start < rangeEnd)
        .filter((event) => {
          const key = eventDedupeKey(event);
          if (seenKeys.has(key)) return false;
          seenKeys.add(key);
          return true;
        })
        .sort((a, b) => b.start.getTime() - a.start.getTime());

      nextRangeEnd = rangeStart;

      if (batch.length === 0) {
        setHasMore(false);
        if (events.length === 0) {
          renderEmptyInitial();
        }
        showArchive();
        debug('No events in batch', rangeStart.toISOString(), 'to', rangeEnd.toISOString());
        return;
      }

      events = events.concat(batch);
      appendEvents(batch);
      setHasMore(true);
      renderDebugPanel(root, events, events);
      debug(
        'Appended',
        batch.length,
        'past events (total',
        events.length,
        ') range',
        rangeStart.toISOString(),
        'to',
        rangeEnd.toISOString(),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load events. Please try again later.';
      error('Failed to load past events:', message);
      if (events.length === 0) {
        showError(message);
      } else {
        // Keep existing events; surface failure on the button briefly.
        if (loadMoreBtn) loadMoreBtn.textContent = 'Try again';
        warn(message);
      }
    } finally {
      setLoading(false);
    }
  };

  loadMoreBtn?.addEventListener('click', () => {
    void loadNextBatch();
  });

  modalClose?.addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });

  void loadNextBatch({ reset: true });
}

document.querySelectorAll<HTMLElement>('[data-past-events]').forEach((root) => {
  if (root.dataset.calendarInitialized) return;
  root.dataset.calendarInitialized = 'true';
  try {
    initPastEvents(root);
  } catch (initError) {
    error(
      'Past events widget init failed:',
      initError instanceof Error ? initError.message : String(initError),
    );
  }
});

// UpcomingEvents initializes via upcoming-events-filters.ts; this module also
// auto-initializes past-events widgets when imported.
