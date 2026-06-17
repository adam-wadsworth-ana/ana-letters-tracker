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
  resultCount: document.querySelector("#resultCount"),
  lettersBody: document.querySelector("#lettersBody")
};

let letters = [];
let selectedState = "";
let sortKey = "submissionDate";
let sortDirection = "desc";
const DATA_VERSION = "20260617-issue-links";

function formatDate(value) {
  if (!value) return "Not dated";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function normalize(value) {
  return String(value || "").toLowerCase();
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

function billNumberMarkup(item) {
  const label = item.billNumber || "Unlisted bill";
  return item.issueUrl
    ? `<a class="bill-link" href="${item.issueUrl}" target="_blank" rel="noopener">${label}</a>`
    : label;
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

  elements.stateFilter.insertAdjacentHTML("beforeend", states.map((state) => `<option value="${state}">${state}</option>`).join(""));
  elements.positionFilter.insertAdjacentHTML("beforeend", positions.map((position) => `<option value="${position}">${position}</option>`).join(""));
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
  const state = elements.stateFilter.value;
  const position = elements.positionFilter.value;

  return letters.filter((item) => {
    const haystack = normalize(Object.values(item).join(" "));
    const matchesQuery = !query || haystack.includes(query);
    const matchesState = !state || item.state === state;
    const matchesPosition = !position || item.anaPosition === position;
    const matchesSelected = !selectedState || item.stateCode === selectedState;
    return matchesQuery && matchesState && matchesPosition && matchesSelected;
  });
}

function renderTable() {
  const filtered = sortRecords(getFilteredLetters());
  elements.resultCount.textContent = `${filtered.length.toLocaleString()} ${filtered.length === 1 ? "record" : "records"}`;
  elements.lettersBody.innerHTML = filtered.map((item) => `
    <tr>
      <td>${item.state || ""}</td>
      <td><strong>${billNumberMarkup(item)}</strong></td>
      <td>${item.billTopic || ""}</td>
      <td><span class="position">${item.anaPosition || "Not listed"}</span></td>
      <td data-sort-value="${item.submissionDate || ""}">${formatDate(item.submissionDate)}</td>
      <td>${item.submittedTo || "Not listed"}</td>
      <td>${item.pdfUrl ? `<a href="${item.pdfUrl}" target="_blank" rel="noopener">Open PDF</a>` : `<span class="pdf-missing">PDF unavailable</span>`}</td>
    </tr>
  `).join("");
}

function renderSelectedState() {
  document.querySelectorAll(".state-tile").forEach((button) => {
    button.classList.toggle("active", button.dataset.stateCode === selectedState);
  });

  if (!selectedState) {
    elements.selectedStateName.textContent = "All states";
    elements.selectedStateCount.textContent = "Select a highlighted state to view letters.";
    elements.stateLetters.innerHTML = "";
    return;
  }

  const stateLetters = letters
    .filter((item) => item.stateCode === selectedState)
    .sort((a, b) => (b.submissionDate || "").localeCompare(a.submissionDate || ""));

  const stateName = STATE_NAMES[selectedState] || selectedState;
  elements.selectedStateName.textContent = stateName;
  elements.selectedStateCount.textContent = `${stateLetters.length} ${stateLetters.length === 1 ? "letter" : "letters"} submitted`;
  elements.stateLetters.innerHTML = stateLetters.length ? stateLetters.map((item) => `
    <article class="letter-card">
      <strong>${billNumberMarkup(item)}</strong>
      <span>${item.billTopic || "No topic listed"}</span>
      <dl>
        <dt>Position</dt><dd>${item.anaPosition || "Not listed"}</dd>
        <dt>Date</dt><dd>${formatDate(item.submissionDate)}</dd>
        <dt>To</dt><dd>${item.submittedTo || "Not listed"}</dd>
      </dl>
      ${item.pdfUrl ? `<a href="${item.pdfUrl}" target="_blank" rel="noopener">Open PDF</a>` : `<span class="pdf-missing">PDF unavailable</span>`}
    </article>
  `).join("") : `<p class="muted">No letters are listed for this state yet.</p>`;
}

function setSelectedState(code) {
  selectedState = code;
  const stateName = STATE_NAMES[code] || "";
  elements.stateFilter.value = stateName && letters.some((item) => item.state === stateName) ? stateName : "";
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
    selectedState = "";
    elements.stateFilter.value = "";
    renderSelectedState();
    renderTable();
  });

  [elements.searchInput, elements.stateFilter, elements.positionFilter].forEach((control) => {
    control.addEventListener("input", () => {
      if (control === elements.stateFilter) {
        const found = letters.find((item) => item.state === control.value);
        selectedState = found ? found.stateCode : "";
        renderSelectedState();
      }
      renderTable();
    });
  });

  document.querySelectorAll("th button[data-sort]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextKey = button.dataset.sort;
      if (sortKey === nextKey) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
      } else {
        sortKey = nextKey;
        sortDirection = nextKey === "submissionDate" ? "desc" : "asc";
      }
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
    renderSelectedState();
    renderTable();
    bindEvents();
  } catch (error) {
    elements.lettersBody.innerHTML = `<tr><td colspan="7">Letter data could not be loaded. Run the site from a local web server or static host.</td></tr>`;
    console.error(error);
  }
}

init();
