// Search & Filter logic for UpcomingEvents component

interface CalendarEvent {
  summary: string;
  description: string;
  location: string;
  start: Date;
  end: Date | null;
  rrule: string | null;
}

type FilterState = {
  search: string;
  dateRange: string;
  location: string;
  type: string;
};

const DEFAULT_FILTERS: FilterState = {
  search: '',
  dateRange: 'all',
  location: 'all',
  type: 'all',
};

function getEventType(event: CalendarEvent): string {
  const title = event.summary.toLowerCase();
  const desc = event.description.toLowerCase();
  const combined = `${title} ${desc}`;

  if (combined.includes('workshop') || combined.includes('lesson') || combined.includes('class')) {
    return 'workshop';
  }
  if (
    combined.includes('weekender') ||
    combined.includes('amazing') ||
    combined.includes('anniversary') ||
    combined.includes('halloween') ||
    combined.includes('valentine') ||
    combined.includes('gratitude') ||
    combined.includes('harvest') ||
    combined.includes('pirate') ||
    combined.includes('wonderland') ||
    combined.includes('cinema') ||
    combined.includes('launch') ||
    combined.includes('potluck') ||
    combined.includes('dark') ||
    combined.includes('nature')
  ) {
    return 'special';
  }
  return 'social';
}

function extractLocation(event: CalendarEvent): string {
  return event.location || 'Location TBD';
}

function isEventInRange(event: CalendarEvent, range: string): boolean {
  if (!event.start) return false;
  if (range === 'all') return true;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDate = new Date(
    event.start.getFullYear(),
    event.start.getMonth(),
    event.start.getDate(),
  );

  switch (range) {
    case 'week': {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);
      return eventDate >= today && eventDate < weekEnd;
    }
    case 'month': {
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return eventDate >= today && eventDate <= monthEnd;
    }
    case 'next-month': {
      const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      return eventDate >= nextMonthStart && eventDate <= nextMonthEnd;
    }
    default:
      return true;
  }
}

function matchesSearch(event: CalendarEvent, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase().trim();
  const searchable = `${event.summary} ${event.description} ${event.location}`.toLowerCase();
  return searchable.includes(q);
}

function matchesFilters(event: CalendarEvent, filters: FilterState): boolean {
  return (
    matchesSearch(event, filters.search) &&
    isEventInRange(event, filters.dateRange) &&
    (filters.location === 'all' || extractLocation(event) === filters.location) &&
    (filters.type === 'all' || getEventType(event) === filters.type)
  );
}

function getUniqueLocations(events: CalendarEvent[]): string[] {
  const locations = new Set<string>();
  events.forEach((event) => {
    const loc = extractLocation(event);
    if (loc && loc !== 'Location TBD') locations.add(loc);
  });
  return Array.from(locations).sort();
}

function getUniqueTypes(events: CalendarEvent[]): string[] {
  const types = new Set<string>();
  events.forEach((event) => {
    types.add(getEventType(event));
  });
  return Array.from(types).sort();
}

function updateFilterPanelLocations(panel: HTMLElement, events: CalendarEvent[]): void {
  const select = panel.querySelector<HTMLSelectElement>('[data-filter="location"]');
  if (!select) return;

  const currentValue = select.value;
  const locations = getUniqueLocations(events);

  select.innerHTML = `
    <option value="all">All locations</option>
    ${locations.map((loc) => `<option value="${loc}">${loc}</option>`).join('')}
  `;

  if (locations.includes(currentValue)) {
    select.value = currentValue;
  }
}

function updateFilterPanelTypes(panel: HTMLElement, events: CalendarEvent[]): void {
  const select = panel.querySelector<HTMLSelectElement>('[data-filter="type"]');
  if (!select) return;

  const currentValue = select.value;
  const types = getUniqueTypes(events);

  const typeLabels: Record<string, string> = {
    social: 'Social dance',
    workshop: 'Workshop',
    special: 'Special event',
  };

  select.innerHTML = `
    <option value="all">All types</option>
    ${types.map((type) => `<option value="${type}">${typeLabels[type] || type}</option>`).join('')}
  `;

  if (types.includes(currentValue)) {
    select.value = currentValue;
  }
}

function updateFilterCount(
  panel: HTMLElement,
  filterCount: number,
  events: CalendarEvent[],
): void {
  const countEl = panel.querySelector<HTMLElement>('.upcoming-events__filter-count');
  const toggle = panel.querySelector<HTMLButtonElement>('[data-filter-toggle]');
  if (!countEl || !toggle) return;

  if (filterCount > 0) {
    countEl.textContent = String(filterCount);
    countEl.hidden = false;
  } else {
    countEl.hidden = true;
  }
}

function applyFilters(
  root: HTMLElement,
  allEvents: CalendarEvent[],
  filters: FilterState,
): CalendarEvent[] {
  const filtered = allEvents.filter((event) => matchesFilters(event, filters));

  const listEl = root.querySelector<HTMLElement>('[data-upcoming-list]');
  const emptyEl = root.querySelector<HTMLElement>('[data-upcoming-empty]');
  const countEl = root.querySelector<HTMLElement>('[data-results-count]');
  const panel = root.querySelector<HTMLElement>('[data-filters] .upcoming-events__filter-panel');

  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${allEvents.length} event${allEvents.length !== 1 ? 's' : ''}`;
    countEl.hidden = false;
  }

  if (panel) {
    updateFilterCount(panel, filtered.length, allEvents);
  }

  if (listEl) {
    if (filtered.length === 0) {
      listEl.innerHTML = '';
      listEl.hidden = true;
      if (emptyEl) emptyEl.hidden = false;
    } else {
      listEl.hidden = false;
      if (emptyEl) emptyEl.hidden = true;
      listEl.innerHTML = filtered.map((event) => createEventCard(event)).join('');
      attachCardListeners(listEl, filtered);
    }
  }

  return filtered;
}

function createEventCard(event: CalendarEvent): string {
  const dateStr = event.start
    ? event.start.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Los_Angeles',
      })
    : '';
  const timeStr = event.start
    ? event.start.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Los_Angeles',
      }) +
      (event.end
        ? ` – ${event.end.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Los_Angeles',
          })}`
        : '')
    : '';
  const locationStr = extractLocation(event);
  const mapsUrl = createMapsUrl(locationStr);
  const locationHtml = mapsUrl
    ? `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="upcoming-events__location-link">${escapeHtml(locationStr)}</a>`
    : escapeHtml(locationStr);

  return `
    <article class="upcoming-events__card" role="button" tabindex="0" data-event-id="${escapeHtml(event.summary + event.start?.toISOString())}">
      <div class="upcoming-events__card-header">
        <h3 class="upcoming-events__card-title">${escapeHtml(event.summary || 'Untitled Event')}</h3>
        <span class="upcoming-events__card-date">${escapeHtml(dateStr)}</span>
      </div>
      <div class="upcoming-events__card-time">${escapeHtml(timeStr)}</div>
      <div class="upcoming-events__card-location">${locationHtml}</div>
    </article>
  `;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function createMapsUrl(location: string): string | null {
  if (!location || location === 'Location TBD') return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function attachCardListeners(listEl: HTMLElement, events: CalendarEvent[]): void {
  listEl.querySelectorAll<HTMLElement>('.upcoming-events__card').forEach((card, index) => {
    const open = () => {
      const modal = listEl.closest('.upcoming-events')?.querySelector<HTMLDialogElement>('[data-upcoming-modal]');
      if (!modal) return;

      const modalTitle = modal.querySelector<HTMLElement>('[data-modal-title]');
      const modalTime = modal.querySelector<HTMLElement>('[data-modal-time]');
      const modalLocation = modal.querySelector<HTMLElement>('[data-modal-location]');
      const modalDescription = modal.querySelector<HTMLElement>('[data-modal-description]');
      if (!modalTitle || !modalTime || !modalLocation || !modalDescription) return;

      const event = events[index];
      modalTitle.textContent = event.summary || 'Untitled Event';
      modalTime.textContent =
        (event.start
          ? event.start.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: 'America/Los_Angeles',
            }) +
            (event.end
              ? ` – ${event.end.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                  timeZone: 'America/Los_Angeles',
                })}`
              : '') +
            ` (${event.start.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'America/Los_Angeles',
            })})`
          : '');

      const locationStr = extractLocation(event);
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
}

function decodeICalText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .replace(/\\[nN]/g, '\n');
}

function cleanDescriptionHTML(html: string): string {
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

function initFilters(root: HTMLElement, allEvents: CalendarEvent[]): void {
  const searchInput = root.querySelector<HTMLInputElement>('#event-search');
  const filterToggle = root.querySelector<HTMLButtonElement>('[data-filter-toggle]');
  const filterPanel = root.querySelector<HTMLElement>('.upcoming-events__filter-panel');
  const filterClear = root.querySelector<HTMLButtonElement>('[data-filter-clear]');
  const filterSelects = root.querySelectorAll<HTMLSelectElement>('[data-filter]');
  const filtersReset = root.querySelector<HTMLButtonElement>('[data-filters-reset]');

  let filters: FilterState = { ...DEFAULT_FILTERS };
  let debounceTimer: ReturnType<typeof setTimeout>;

  const apply = () => {
    applyFilters(root, allEvents, filters);
  };

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    filters[key] = value;
    apply();
  };

  // Search input with debounce
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setFilter('search', searchInput.value);
      }, 150);
    });
  }

  // Filter toggle
  if (filterToggle && filterPanel) {
    filterToggle.addEventListener('click', () => {
      const expanded = filterToggle.getAttribute('aria-expanded') === 'true';
      filterToggle.setAttribute('aria-expanded', String(!expanded));
      filterPanel.hidden = expanded;
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (
        filterPanel.hidden === false &&
        !filterPanel.contains(e.target as Node) &&
        !filterToggle.contains(e.target as Node)
      ) {
        filterToggle.setAttribute('aria-expanded', 'false');
        filterPanel.hidden = true;
      }
    });
  }

  // Filter selects
  filterSelects.forEach((select) => {
    select.addEventListener('change', () => {
      const filterType = select.dataset.filter as keyof FilterState;
      if (filterType) setFilter(filterType, select.value as FilterState[keyof FilterState]);
    });
  });

  // Clear all filters
  if (filterClear) {
    filterClear.addEventListener('click', () => {
      filters = { ...DEFAULT_FILTERS };
      if (searchInput) searchInput.value = '';
      filterSelects.forEach((select) => (select.value = 'all'));
      apply();
    });
  }

  if (filtersReset) {
    filtersReset.addEventListener('click', () => {
      filters = { ...DEFAULT_FILTERS };
      if (searchInput) searchInput.value = '';
      filterSelects.forEach((select) => (select.value = 'all'));
      apply();
    });
  }

  // Populate filter options after events load
  if (filterPanel) {
    updateFilterPanelLocations(filterPanel, allEvents);
    updateFilterPanelTypes(filterPanel, allEvents);
  }
}

// Export for the main calendar-events script
export function initUpcomingEventsWithFilters(root: HTMLElement): void {
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

  let allEvents: CalendarEvent[] = [];

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
      (event.start
        ? event.start.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Los_Angeles',
          }) +
          (event.end
            ? ` – ${event.end.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/Los_Angeles',
              })}`
            : '') +
          ` (${event.start.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'America/Los_Angeles',
          })})`
        : '');

    const locationStr = extractLocation(event);
    const mapsUrl = createMapsUrl(locationStr);
    if (mapsUrl) {
      modalLocation.innerHTML = `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(locationStr)}</a>`;
    } else {
      modalLocation.textContent = locationStr;
    }

    modalDescription.innerHTML = cleanDescriptionHTML(event.description || 'No description available.');
    modal.showModal();
  };

  const renderEvents = (events: CalendarEvent[]) => {
    if (events.length === 0) {
      listEl.innerHTML = `
        <div class="upcoming-events__empty">
          <p>No upcoming events in the next ${daysAhead} days. Check back soon, or view the full calendar.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = events.map((event) => createEventCard(event)).join('');
    attachCardListeners(listEl, events);
  };

  const loadEvents = async () => {
    setLoading(true);
    listEl.innerHTML = '';
    try {
      // Import the fetch functions from calendar-events
      const { fetchICalData, parseICal, expandRecurringEvents } = await import('./calendar-events');
      const icalData = await fetchICalData(calendarId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + daysAhead);
      endDate.setHours(23, 59, 59, 999);

      const parsed = parseICal(icalData);
      const expanded = expandRecurringEvents(parsed, endDate);
      allEvents = expanded
        .filter((event): event is CalendarEvent & { start: Date } => Boolean(event.start))
        .filter((event) => event.start >= today && event.start <= endDate)
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      renderEvents(allEvents);
      initFilters(root, allEvents);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load events. Please try again later.';
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
  initUpcomingEventsWithFilters(root);
});