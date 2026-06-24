const STATE_NAMES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  FED: "Federal",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming"
};

const TILE_LAYOUT = [
  ["FED", 1, 1], ["AK", 2, 1], ["ME", 12, 1],
  ["VT", 10, 2], ["NH", 11, 2], ["WA", 2, 2], ["MT", 3, 2], ["ND", 4, 2], ["MN", 5, 2], ["WI", 6, 2], ["MI", 7, 2], ["NY", 9, 2], ["MA", 12, 2],
  ["OR", 2, 3], ["ID", 3, 3], ["SD", 4, 3], ["IA", 5, 3], ["IL", 6, 3], ["IN", 7, 3], ["OH", 8, 3], ["PA", 9, 3], ["NJ", 10, 3], ["CT", 11, 3], ["RI", 12, 3],
  ["CA", 2, 4], ["NV", 3, 4], ["WY", 4, 4], ["NE", 5, 4], ["MO", 6, 4], ["KY", 7, 4], ["WV", 8, 4], ["VA", 9, 4], ["MD", 10, 4], ["DE", 11, 4], ["DC", 12, 4],
  ["AZ", 3, 5], ["UT", 4, 5], ["CO", 5, 5], ["KS", 6, 5], ["AR", 7, 5], ["TN", 8, 5], ["NC", 9, 5], ["SC", 10, 5],
  ["HI", 1, 6], ["NM", 4, 6], ["OK", 6, 6], ["LA", 7, 6], ["MS", 8, 6], ["AL", 9, 6], ["GA", 10, 6],
  ["TX", 6, 7], ["FL", 11, 7]
];

const elements = {
  totalLetters: document.querySelector("#totalLetters"),
  totalStates: document.querySelector("#totalStates"),
  latestDate: document.querySelector("#latestDate"),
  stateMap: document.querySelector("#stateMap"),
  clearState: document.querySelector("#clearState"),
  selectedStateName: document.querySelector("#selectedStateName"),
  selectedStateCount: document.querySelector("#selectedStateCount"),
  stateLetters: document.querySelector("#stateLetters"),
  searchInput: document.querySelector("#searchInput"),
  stateFilter: document.querySelector("#stateFilter"),
  positionFilter: document.querySelector("#positionFilter"),
  topicFilter: document.querySelector("#topicFilter"),
  actionFilter: document.querySelector("#actionFilter"),
  yearFilter: document.querySelector("#yearFilter"),
  dateFromFilter: document.querySelector("#dateFromFilter"),
  dateToFilter: document.querySelector("#dateToFilter"),
  sortFilter: document.querySelector("#sortFilter"),
  clearFilters: document.querySelector("#clearFilters"),
  shareView: document.querySelector("#shareView"),
  resultCount: document.querySelector("#resultCount"),
  activeFilters: document.querySelector("#activeFilters"),
  loadMoreResults: document.querySelector("#loadMoreResults"),
  lettersBody: document.querySelector("#lettersBody")
};

let letters = [];
let selectedStateCodes = new Set();
let selectedTopics = new Set();
let sortKey = "submissionDate";
let sortDirection = "desc";
let visibleCount = 25;
const PAGE_SIZE = 25;
let visibleStateLetterCount = 5;
const STATE_PANEL_PAGE_SIZE = 5;
const DATA_VERSION = "20260623-policy-tracker-update";

function formatDate(value) {
  if (!value) return "Not dated";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function normalize(value) {
  return String(value || "").toLowerCase();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function optionMarkup(value) {
  return `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`;
}

function getFilterControls() {
  return [
    elements.searchInput,
    elements.stateFilter,
    elements.positionFilter,
    elements.topicFilter,
    elements.actionFilter,
    elements.yearFilter,
    elements.dateFromFilter,
    elements.dateToFilter
  ];
}

function getStateCodeFromName(stateName) {
  const found = letters.find((item) => item.state === stateName);
  return found ? found.stateCode : "";
}

function getStateLabelFromCode(code) {
  return STATE_NAMES[code] || code;
}

function getStateCodeFromParam(value) {
  if (STATE_NAMES[value]) return value;
  return getStateCodeFromName(value);
}

function compareValues(a, b, key) {
  const left = a[key] || "";
  const right = b[key] || "";
  if (key === "submissionDate") {
    return left.localeCompare(right);
  }
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
}

function sortRecords(records) {
  return [...records].sort((a, b) => {
    const result = compareValues(a, b, sortKey);
    return sortDirection === "asc" ? result : -result;
  });
}

function getActiveFilterItems() {
  const items = [];
  if (elements.searchInput.value) items.push({ key: "search", label: `Search: ${elements.searchInput.value}` });
  [...selectedStateCodes]
    .sort((a, b) => getStateLabelFromCode(a).localeCompare(getStateLabelFromCode(b)))
    .forEach((code) => {
      items.push({ key: "state", value: code, label: `State/Federal: ${getStateLabelFromCode(code)}` });
    });
  if (elements.positionFilter.value) items.push({ key: "position", label: `Position: ${elements.positionFilter.value}` });
  [...selectedTopics].sort().forEach((topic) => {
    items.push({ key: "topic", value: topic, label: `Topic: ${topic}` });
  });
  if (elements.actionFilter.value) items.push({ key: "action", label: `Action: ${elements.actionFilter.value}` });
  if (elements.yearFilter.value) items.push({ key: "year", label: `Year: ${elements.yearFilter.value}` });
  if (elements.dateFromFilter.value) items.push({ key: "from", label: `From: ${formatDate(elements.dateFromFilter.value)}` });
  if (elements.dateToFilter.value) items.push({ key: "to", label: `To: ${formatDate(elements.dateToFilter.value)}` });
  return items;
}

function renderActiveFilters() {
  const items = getActiveFilterItems();
  elements.activeFilters.innerHTML = items.length ? items.map((item) => `
    <button class="filter-chip" type="button" data-filter="${item.key}" data-value="${escapeHtml(item.value || "")}" aria-label="Remove ${escapeHtml(item.label)} filter">
      <span>${escapeHtml(item.label)}</span>
      <strong aria-hidden="true">x</strong>
    </button>
  `).join("") : "";
}

function updateUrlFromFilters() {
  const params = new URLSearchParams();
  if (elements.searchInput.value) params.set("q", elements.searchInput.value);
  [...selectedStateCodes].sort().forEach((code) => params.append("state", code));
  if (elements.positionFilter.value) params.set("position", elements.positionFilter.value);
  [...selectedTopics].sort().forEach((topic) => params.append("topic", topic));
  if (elements.actionFilter.value) params.set("action", elements.actionFilter.value);
  if (elements.yearFilter.value) params.set("year", elements.yearFilter.value);
  if (elements.dateFromFilter.value) params.set("from", elements.dateFromFilter.value);
  if (elements.dateToFilter.value) params.set("to", elements.dateToFilter.value);
  if (sortKey !== "submissionDate" || sortDirection !== "desc") params.set("sort", `${sortKey}:${sortDirection}`);

  const queryString = params.toString();
  const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", nextUrl);
}

function setSelectValue(select, value) {
  if ([...select.options].some((option) => option.value === value)) {
    select.value = value;
  }
}

function applyFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  elements.searchInput.value = params.get("q") || "";
  setSelectValue(elements.positionFilter, params.get("position") || "");
  setSelectValue(elements.actionFilter, params.get("action") || "");
  setSelectValue(elements.yearFilter, params.get("year") || "");
  elements.dateFromFilter.value = params.get("from") || "";
  elements.dateToFilter.value = params.get("to") || "";

  selectedStateCodes = new Set(
    params.getAll("state")
      .map(getStateCodeFromParam)
      .filter(Boolean)
  );
  selectedTopics = new Set(params.getAll("topic").filter(Boolean));
  elements.stateFilter.value = "";
  elements.topicFilter.value = "";

  const sortParam = params.get("sort");
  if (sortParam && [...elements.sortFilter.options].some((option) => option.value === sortParam)) {
    const [nextKey, nextDirection] = sortParam.split(":");
    sortKey = nextKey;
    sortDirection = nextDirection;
  }
}

function clearFilterByKey(key, value) {
  if (key === "search") elements.searchInput.value = "";
  if (key === "state") {
    if (value) {
      selectedStateCodes.delete(value);
    } else {
      selectedStateCodes.clear();
    }
    visibleStateLetterCount = STATE_PANEL_PAGE_SIZE;
    renderSelectedState();
  }
  if (key === "position") elements.positionFilter.value = "";
  if (key === "topic") {
    if (value) {
      selectedTopics.delete(value);
    } else {
      selectedTopics.clear();
    }
  }
  if (key === "action") elements.actionFilter.value = "";
  if (key === "year") elements.yearFilter.value = "";
  if (key === "from") elements.dateFromFilter.value = "";
  if (key === "to") elements.dateToFilter.value = "";
  visibleCount = PAGE_SIZE;
  renderTable();
}

async function copyViewLink() {
  updateUrlFromFilters();
  const viewUrl = window.location.href;
  try {
    await navigator.clipboard.writeText(viewUrl);
    elements.shareView.textContent = "Link copied";
    window.setTimeout(() => {
      elements.shareView.textContent = "Copy view link";
    }, 1800);
  } catch (error) {
    window.prompt("Copy this link:", viewUrl);
  }
}

function billNumberMarkup(item) {
  const label = item.billNumber || "Unlisted bill";
  return item.issueUrl
    ? `<a class="bill-link" href="${escapeHtml(item.issueUrl)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`
    : escapeHtml(label);
}

function positionClass(value) {
  const position = normalize(value);
  if (position.includes("oppose")) return "position position-oppose";
  if (position.includes("support")) return "position position-support";
  return "position position-neutral";
}

function positionMarkup(value) {
  const label = value || "Not listed";
  return `<span class="${positionClass(label)}">${escapeHtml(label)}</span>`;
}

function buildSummary() {
  const statesWithLetters = new Set(letters.map((item) => item.stateCode).filter(Boolean));
  const newest = [...letters].sort((a, b) => (b.submissionDate || "").localeCompare(a.submissionDate || ""))[0];
  elements.totalLetters.textContent = letters.length.toLocaleString();
  elements.totalStates.textContent = statesWithLetters.size.toLocaleString();
  elements.latestDate.textContent = newest ? formatDate(newest.submissionDate) : "--";
}

function buildFilters() {
  const states = [...new Set(letters.map((item) => item.state).filter(Boolean))].sort();
  const positions = [...new Set(letters.map((item) => item.anaPosition).filter(Boolean))].sort();
  const topics = [...new Set(letters.map((item) => item.billTopic).filter(Boolean))].sort();
  const actions = [...new Set(letters.map((item) => item.sourceAction).filter(Boolean))].sort();
  const years = [...new Set(letters.map((item) => (item.submissionDate || "").slice(0, 4)).filter(Boolean))].sort((a, b) => b.localeCompare(a));

  elements.stateFilter.insertAdjacentHTML("beforeend", states.map(optionMarkup).join(""));
  elements.positionFilter.insertAdjacentHTML("beforeend", positions.map(optionMarkup).join(""));
  elements.topicFilter.insertAdjacentHTML("beforeend", topics.map(optionMarkup).join(""));
  elements.actionFilter.insertAdjacentHTML("beforeend", actions.map(optionMarkup).join(""));
  elements.yearFilter.insertAdjacentHTML("beforeend", years.map(optionMarkup).join(""));
}

function buildMap() {
  const counts = letters.reduce((acc, item) => {
    acc[item.stateCode] = (acc[item.stateCode] || 0) + 1;
    return acc;
  }, {});

  elements.stateMap.innerHTML = TILE_LAYOUT.map(([code, col, row]) => {
    const count = counts[code] || 0;
    const title = `${STATE_NAMES[code]}: ${count} ${count === 1 ? "letter" : "letters"}`;
    return `
      <button
        class="state-tile ${count ? "has-letters" : ""}"
        style="grid-column:${col};grid-row:${row}"
        type="button"
        data-state-code="${code}"
        title="${title}"
        aria-label="${title}"
      >${code}</button>
    `;
  }).join("");
}

function getFilteredLetters() {
  const query = normalize(elements.searchInput.value);
  const position = elements.positionFilter.value;
  const action = elements.actionFilter.value;
  const year = elements.yearFilter.value;
  const dateFrom = elements.dateFromFilter.value;
  const dateTo = elements.dateToFilter.value;

  return letters.filter((item) => {
    const haystack = normalize(Object.values(item).join(" "));
    const matchesQuery = !query || haystack.includes(query);
    const matchesState = !selectedStateCodes.size || selectedStateCodes.has(item.stateCode);
    const matchesPosition = !position || item.anaPosition === position;
    const matchesTopic = !selectedTopics.size || selectedTopics.has(item.billTopic);
    const matchesAction = !action || item.sourceAction === action;
    const matchesYear = !year || (item.submissionDate || "").startsWith(year);
    const matchesFrom = !dateFrom || (item.submissionDate || "") >= dateFrom;
    const matchesTo = !dateTo || (item.submissionDate || "") <= dateTo;
    return matchesQuery && matchesState && matchesPosition && matchesTopic && matchesAction && matchesYear && matchesFrom && matchesTo;
  });
}

function updateSortControls() {
  const sortValue = `${sortKey}:${sortDirection}`;
  if ([...elements.sortFilter.options].some((option) => option.value === sortValue)) {
    elements.sortFilter.value = sortValue;
  }

  document.querySelectorAll("th button[data-sort]").forEach((button) => {
    const isActive = button.dataset.sort === sortKey;
    button.classList.toggle("active-sort", isActive);
    button.classList.toggle("asc", isActive && sortDirection === "asc");
    button.classList.toggle("desc", isActive && sortDirection === "desc");
    button.setAttribute("aria-sort", isActive ? (sortDirection === "asc" ? "ascending" : "descending") : "none");
  });
}

function renderTable() {
  const filtered = sortRecords(getFilteredLetters());
  const visibleRecords = filtered.slice(0, visibleCount);
  const totalLabel = `${filtered.length.toLocaleString()} ${filtered.length === 1 ? "record" : "records"}`;
  elements.resultCount.textContent = filtered.length > visibleRecords.length
    ? `Showing ${visibleRecords.length.toLocaleString()} of ${totalLabel}`
    : totalLabel;
  elements.loadMoreResults.hidden = visibleRecords.length >= filtered.length;
  elements.loadMoreResults.textContent = `Load ${Math.min(PAGE_SIZE, Math.max(filtered.length - visibleRecords.length, 0)).toLocaleString()} more results`;
  updateSortControls();
  renderActiveFilters();
  updateUrlFromFilters();
  elements.lettersBody.innerHTML = visibleRecords.map((item) => `
    <tr>
      <td>${escapeHtml(item.state || "")}</td>
      <td><strong>${billNumberMarkup(item)}</strong></td>
      <td>${escapeHtml(item.billTopic || "")}</td>
      <td>${positionMarkup(item.anaPosition)}</td>
      <td data-sort-value="${item.submissionDate || ""}">${formatDate(item.submissionDate)}</td>
      <td>${escapeHtml(item.submittedTo || "Not listed")}</td>
      <td>${item.pdfUrl ? `<a href="${escapeHtml(item.pdfUrl)}" target="_blank" rel="noopener">Open PDF</a>` : `<span class="pdf-missing">PDF unavailable</span>`}</td>
    </tr>
  `).join("");
}

function renderSelectedState() {
  document.querySelectorAll(".state-tile").forEach((button) => {
    button.classList.toggle("active", selectedStateCodes.has(button.dataset.stateCode));
  });

  if (!selectedStateCodes.size) {
    elements.selectedStateName.textContent = "All states";
    elements.selectedStateCount.textContent = "Select a highlighted state to view letters.";
    elements.stateLetters.innerHTML = "";
    return;
  }

  const stateLetters = letters
    .filter((item) => selectedStateCodes.has(item.stateCode))
    .sort((a, b) => (b.submissionDate || "").localeCompare(a.submissionDate || ""));
  const visibleStateLetters = stateLetters.slice(0, visibleStateLetterCount);
  const remainingStateLetters = stateLetters.length - visibleStateLetters.length;

  const selectedLabels = [...selectedStateCodes]
    .map(getStateLabelFromCode)
    .sort();
  elements.selectedStateName.textContent = selectedLabels.length === 1 ? selectedLabels[0] : `${selectedLabels.length} selected areas`;
  elements.selectedStateCount.textContent = `${stateLetters.length} ${stateLetters.length === 1 ? "letter" : "letters"} submitted`;
  elements.stateLetters.innerHTML = stateLetters.length ? `
    ${visibleStateLetters.map((item) => `
    <article class="letter-card">
      <strong>${billNumberMarkup(item)}</strong>
      <span>${escapeHtml(item.state || "No state listed")} - ${escapeHtml(item.billTopic || "No topic listed")}</span>
      <dl>
        <dt>Position</dt><dd>${escapeHtml(item.anaPosition || "Not listed")}</dd>
        <dt>Date</dt><dd>${formatDate(item.submissionDate)}</dd>
        <dt>To</dt><dd>${escapeHtml(item.submittedTo || "Not listed")}</dd>
      </dl>
      ${item.pdfUrl ? `<a href="${escapeHtml(item.pdfUrl)}" target="_blank" rel="noopener">Open PDF</a>` : `<span class="pdf-missing">PDF unavailable</span>`}
    </article>
    `).join("")}
    ${remainingStateLetters > 0 ? `
      <button id="loadMoreStateLetters" class="ghost-button state-load-more" type="button">
        Load ${Math.min(STATE_PANEL_PAGE_SIZE, remainingStateLetters).toLocaleString()} more results
      </button>
    ` : ""}
  ` : `<p class="muted">No letters are listed for this state yet.</p>`;
}

function setSelectedState(code) {
  if (selectedStateCodes.has(code)) {
    selectedStateCodes.delete(code);
  } else {
    selectedStateCodes.add(code);
  }
  visibleCount = PAGE_SIZE;
  visibleStateLetterCount = STATE_PANEL_PAGE_SIZE;
  elements.stateFilter.value = "";
  renderSelectedState();
  renderTable();
}

function bindEvents() {
  elements.stateMap.addEventListener("click", (event) => {
    const button = event.target.closest(".state-tile");
    if (!button) return;
    setSelectedState(button.dataset.stateCode);
  });

  elements.clearState.addEventListener("click", () => {
    selectedStateCodes.clear();
    elements.stateFilter.value = "";
    visibleCount = PAGE_SIZE;
    visibleStateLetterCount = STATE_PANEL_PAGE_SIZE;
    renderSelectedState();
    renderTable();
  });

  elements.clearFilters.addEventListener("click", () => {
    selectedStateCodes.clear();
    selectedTopics.clear();
    elements.searchInput.value = "";
    elements.stateFilter.value = "";
    elements.positionFilter.value = "";
    elements.topicFilter.value = "";
    elements.actionFilter.value = "";
    elements.yearFilter.value = "";
    elements.dateFromFilter.value = "";
    elements.dateToFilter.value = "";
    sortKey = "submissionDate";
    sortDirection = "desc";
    visibleCount = PAGE_SIZE;
    visibleStateLetterCount = STATE_PANEL_PAGE_SIZE;
    renderSelectedState();
    renderTable();
  });

  getFilterControls().forEach((control) => {
    control.addEventListener("input", () => {
      if (control === elements.stateFilter) {
        const nextStateCode = getStateCodeFromName(control.value);
        if (nextStateCode) selectedStateCodes.add(nextStateCode);
        elements.stateFilter.value = "";
        visibleStateLetterCount = STATE_PANEL_PAGE_SIZE;
        renderSelectedState();
      }
      if (control === elements.topicFilter) {
        if (control.value) selectedTopics.add(control.value);
        elements.topicFilter.value = "";
      }
      visibleCount = PAGE_SIZE;
      renderTable();
    });
  });

  elements.sortFilter.addEventListener("change", () => {
    const [nextKey, nextDirection] = elements.sortFilter.value.split(":");
    sortKey = nextKey;
    sortDirection = nextDirection;
    visibleCount = PAGE_SIZE;
    renderTable();
  });

  elements.loadMoreResults.addEventListener("click", () => {
    visibleCount += PAGE_SIZE;
    renderTable();
  });

  elements.stateLetters.addEventListener("click", (event) => {
    const button = event.target.closest("#loadMoreStateLetters");
    if (!button) return;
    visibleStateLetterCount += STATE_PANEL_PAGE_SIZE;
    renderSelectedState();
  });

  elements.activeFilters.addEventListener("click", (event) => {
    const button = event.target.closest(".filter-chip");
    if (!button) return;
    clearFilterByKey(button.dataset.filter, button.dataset.value);
  });

  elements.shareView.addEventListener("click", copyViewLink);

  document.querySelectorAll("th button[data-sort]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextKey = button.dataset.sort;
      if (sortKey === nextKey) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
      } else {
        sortKey = nextKey;
        sortDirection = nextKey === "submissionDate" ? "desc" : "asc";
      }
      visibleCount = PAGE_SIZE;
      renderTable();
    });
  });
}

async function init() {
  try {
    const response = await fetch(`data/letters.json?v=${DATA_VERSION}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load letter data.");
    letters = await response.json();
    buildSummary();
    buildFilters();
    buildMap();
    applyFiltersFromUrl();
    renderSelectedState();
    renderTable();
    bindEvents();
  } catch (error) {
    elements.lettersBody.innerHTML = `<tr><td colspan="7">Letter data could not be loaded. Run the site from a local web server or static host.</td></tr>`;
    console.error(error);
  }
}

init();
