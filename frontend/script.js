
const sampleItems = [
  {
    id: 1,
    name: "Black Backpack",
    status: "Found",
    category: "Bags",
    location: "Central Library",
    date: "2026-10-14",
    description: "A black backpack left near the study tables.",
    emoji: "🎒"
  },
  {
    id: 2,
    name: "Blue Water Bottle",
    status: "Lost",
    category: "Accessories",
    location: "Block C",
    date: "2026-10-13",
    description: "Blue reusable bottle with a silver lid.",
    emoji: "💧"
  },
  {
    id: 3,
    name: "Wireless Earbuds",
    status: "Found",
    category: "Electronics",
    location: "College Canteen",
    date: "2026-10-12",
    description: "A small earbuds case found on a canteen table.",
    emoji: "🎧"
  },
  {
    id: 4,
    name: "Engineering Mathematics Book",
    status: "Lost",
    category: "Books",
    location: "Academic Block",
    date: "2026-10-11",
    description: "A mathematics textbook that may have been left in class.",
    emoji: "📚"
  },
  {
    id: 5,
    name: "Student ID Holder",
    status: "Found",
    category: "Other",
    location: "Main Entrance",
    date: "2026-10-10",
    description: "A plain ID holder found close to the entrance.",
    emoji: "🪪"
  },
  {
    id: 6,
    name: "Laptop Charger",
    status: "Lost",
    category: "Electronics",
    location: "Computer Lab",
    date: "2026-10-09",
    description: "A charger possibly left beside a computer workstation.",
    emoji: "🔌"
  }
];

const emojiByCategory = {
  Electronics: "💻",
  Bags: "🎒",
  Accessories: "💧",
  Books: "📚",
  Clothing: "👕",
  "ID Cards": "🪪",
  Other: "📦"
};

const grid = document.getElementById("item-grid");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const categoryButtons = document.querySelectorAll(".category-chip");
const emptyMessage = document.getElementById("empty-message");
const reportForm = document.getElementById("report-form");
const formMessage = document.getElementById("form-message");

let activeCategory = "all";
let searchTerm = "";

// Load reports saved in this browser.
function loadSavedItems() {
  try {
    const saved = localStorage.getItem("findit-reports");
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Could not load saved reports:", error);
    return [];
  }
}

let userItems = loadSavedItems();

function getAllItems() {
  return [...userItems, ...sampleItems];
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function formatDate(dateString) {
  if (!dateString) return "Date not provided";

  const date = new Date(dateString + "T00:00:00");

  if (Number.isNaN(date.getTime())) {
    return "Date not provided";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function renderItems() {
  const allItems = getAllItems();

  const filteredItems = allItems.filter(item => {
    const searchableText = [
      item.name,
      item.category,
      item.location,
      item.description,
      item.status
    ].join(" ").toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm);
    const matchesStatus =
      statusFilter.value === "all" ||
      item.status === statusFilter.value;

    const matchesCategory =
      activeCategory === "all" ||
      item.category === activeCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  grid.innerHTML = filteredItems.map(item => {
    const emoji = emojiByCategory[item.category] || item.emoji || "📦";

    return `
      <article class="item-card">
        <div class="item-visual">
          <span class="item-status ${item.status.toLowerCase()}">
            ${escapeHTML(item.status)}
          </span>
          <span aria-hidden="true">${escapeHTML(emoji)}</span>
        </div>

        <div class="item-details">
          <h3>${escapeHTML(item.name)}</h3>
          <p>📍 ${escapeHTML(item.location)}</p>
          <p class="item-description">
            ${escapeHTML(item.description)}
          </p>

          <div class="item-meta">
            <span>${escapeHTML(item.category)}</span>
            <span>${escapeHTML(formatDate(item.date))}</span>
          </div>
        </div>
      </article>
    `;
  }).join("");

  emptyMessage.hidden = filteredItems.length !== 0;

  updateStats(allItems);
}

function updateStats(items) {
  document.getElementById("total-count").textContent = items.length;

  document.getElementById("lost-count").textContent =
    items.filter(item => item.status === "Lost").length;

  document.getElementById("found-count").textContent =
    items.filter(item => item.status === "Found").length;

  document.getElementById("recovered-count").textContent =
    items.filter(item => item.status === "Recovered").length;
}

// Search items.
searchForm.addEventListener("submit", event => {
  event.preventDefault();
  searchTerm = searchInput.value.trim().toLowerCase();
  renderItems();

  document.getElementById("items").scrollIntoView({
    behavior: "smooth"
  });
});

// Also update results while typing.
searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  renderItems();
});

// Filter Lost / Found reports.
statusFilter.addEventListener("change", renderItems);

// Filter by category.
categoryButtons.forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;

    categoryButtons.forEach(chip => {
      chip.classList.toggle("active", chip === button);
    });

    renderItems();
  });
});

// Submit a new report.
reportForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = document.getElementById("item-name").value.trim();
  const status = document.getElementById("item-status").value;
  const category = document.getElementById("item-category").value;
  const location = document.getElementById("item-location").value.trim();
  const date = document.getElementById("item-date").value;
  const description = document
    .getElementById("item-description")
    .value.trim();

  if (!name || !location || !date || !description) {
    formMessage.textContent = "Please complete all required fields.";
    return;
  }

  const newItem = {
    id: Date.now(),
    name,
    status,
    category,
    location,
    date,
    description,
    emoji: emojiByCategory[category] || "📦"
  };

  userItems.unshift(newItem);

  try {
    localStorage.setItem("findit-reports", JSON.stringify(userItems));
  } catch (error) {
    console.error("Could not save report:", error);
    userItems.shift();
    formMessage.textContent =
      "Could not save this report in your browser. Please try again.";
    return;
  }

  reportForm.reset();
  formMessage.textContent =
    "Report added successfully! It is saved in this browser.";

  // Show the newly submitted report.
  searchInput.value = "";
  searchTerm = "";
  statusFilter.value = "all";
  activeCategory = "all";

  categoryButtons.forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.category === "all"
    );
  });

  renderItems();

  document.getElementById("items").scrollIntoView({
    behavior: "smooth"
  });
});

// Initial page load.
renderItems();
