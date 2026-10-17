

const SUPABASE_URL = "https://kwkncazhptbtfrqpjmmg.supabase.co";
const SUPABASE_KEY = "sb_publishable_SJqRDzGTLXaoaeHrr7BMdA_oOKjSGXx";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

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

const campusSelect = document.getElementById("item-campus");
const campusFilter = document.getElementById("campus-filter");

async function loadCampuses() {
  if (!campusSelect) {
    console.error("Campus dropdown #item-campus was not found.");
    return;
  }

  campusSelect.disabled = true;
  campusSelect.innerHTML = '<option value="">Loading campuses...</option>';

  const { data, error } = await db
    .from("campuses")
    .select("id, name, city")
    .order("name");

  if (error) {
    console.error("Could not load campuses:", error);
    campusSelect.innerHTML =
      '<option value="">Could not load campuses</option>';
    formMessage.textContent =
      "Could not load campuses. Please refresh the page.";
    return;
  }

 
  campusSelect.innerHTML =
    '<option value="">Choose a campus</option>';

  if (campusFilter) {
    campusFilter.innerHTML =
      '<option value="all">All Campuses</option>';
  }

  data.forEach(campus => {
    const reportOption = document.createElement("option");
    reportOption.value = campus.id;
    reportOption.textContent = `${campus.name} — ${campus.city}`;
    campusSelect.appendChild(reportOption);

    if (campusFilter) {
      const filterOption = document.createElement("option");
      filterOption.value = campus.id;
      filterOption.textContent = `${campus.name} — ${campus.city}`;
      campusFilter.appendChild(filterOption);
    }
  });

  campusSelect.disabled = false;
}



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
let databaseItems = [];

async function loadReports() {
  formMessage.textContent = "Loading reports...";

  const { data, error } = await db
    .from("reports")
    .select(`
      id,
      owner_id,
      recovered_at, 
      item_name,
      status,
      category,
      location,
      item_date,
      description,
      recovery_status,
      campus_id,
      college_name,
      event_name,
      campuses(name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load reports:", error);
    formMessage.textContent =
      "Could not refresh reports. Check the browser console.";
    return;
  }

  databaseItems = data.map(report => ({
    id: report.id,
    ownerId: report.owner_id,
    recoveredAt: report.recovered_at,
    name: report.item_name,
    status: report.recovery_status === "Recovered"
      ? "Recovered"
      : report.status,
    category: report.category,
    location: report.location,
    date: report.item_date,
    description: report.description,
    campusId: report.campus_id,
    campusName: report.campuses?.name || report.college_name || "",
    eventName: report.event_name || "",
    emoji: emojiByCategory[report.category] || "📦"
  }));

  renderItems();
  formMessage.textContent = "";
}

function getAllItems() {
  return [...databaseItems, ...userItems, ...sampleItems];
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
  const currentUserId = window.currentFindItUserId || null;

  const filteredItems = allItems.filter(item => {
    const searchableText = [
      item.name,
      item.category,
      item.location,
      item.description,
      item.status,
      item.campusName,
      item.eventName
    ].join(" ").toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm);

    const matchesStatus =
      statusFilter.value === "all" ||
      item.status === statusFilter.value;

    const matchesCategory =
      activeCategory === "all" ||
      item.category === activeCategory;

    const matchesCampus =
      !campusFilter ||
      campusFilter.value === "all" ||
      item.campusId === campusFilter.value;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCategory &&
      matchesCampus
    );
  });


  grid.innerHTML = filteredItems.map(item => {
    const emoji =
      emojiByCategory[item.category] || item.emoji || "📦";

    const isOwner =
      item.ownerId &&
      item.ownerId === currentUserId &&
      !item.recoveredAt;

    return `
      <article class="item-card">
        <div class="item-visual">
          <span class="item-status ${escapeHTML(item.status.toLowerCase())}">
            ${escapeHTML(item.status)}
          </span>
          <span aria-hidden="true">${escapeHTML(emoji)}</span>
        </div>

        <div class="item-details">
          <h3>${escapeHTML(item.name)}</h3>
          <p>📍 ${escapeHTML(item.location)}</p>
          <p class="item-description">
            ${escapeHTML(item.description || "")}
          </p>

          <div class="item-meta">
            <span>${escapeHTML(item.category)}</span>
            <span>${escapeHTML(formatDate(item.date))}</span>
          </div>

          ${item.campusName ? `
            <p class="item-campus">
              🏫 ${escapeHTML(item.campusName)}
            </p>
          ` : ""}

          ${item.eventName ? `
            <p class="item-event">
              🎯 ${escapeHTML(item.eventName)}
            </p>
          ` : ""}

          ${isOwner ? `
            <div class="item-actions">
              <button type="button" onclick="editReport('${escapeHTML(item.id)}')">
                ✏️ Edit
              </button>
              <button type="button" onclick="deleteReport('${escapeHTML(item.id)}')">
                🗑️ Delete
              </button>
              <button type="button" onclick="markRecovered('${escapeHTML(item.id)}')">
                ✅ Mark as Recovered
              </button>
            </div>
          ` : ""}
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
if (campusFilter) {
  campusFilter.addEventListener("change", renderItems);
}

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



async function handleReportSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("item-name").value.trim();
  const status = document.getElementById("item-status").value;
  const category = document.getElementById("item-category").value;
  const campusId = campusSelect.value;
  const eventName = document.getElementById("item-event").value.trim();
  const location = document.getElementById("item-location").value.trim();
  const date = document.getElementById("item-date").value;
  const description = document
    .getElementById("item-description")
    .value.trim();

  if (
    !name || !status || !category || !campusId ||
    !location || !date || !description
  ) {
    formMessage.textContent = "Please complete all required fields.";
    return;
  }

  const submitButton = reportForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  formMessage.textContent = "Submitting your report...";

  try {
    // Get the signed-in anonymous user's ID
    const {
      data: { user },
      error: userError
    } = await db.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      throw new Error("No signed-in user. Please refresh and try again.");
    }

    const { error } = await db
      .from("reports")
      .insert({
        item_name: name,
        status: status,
        category: category,
        campus_id: campusId,
        college_name: campusSelect.selectedOptions[0].textContent.split(" — ")[0],
        event_name: eventName || null,
        location: location,
        item_date: date,
        description: description,
        owner_id: user.id
      });

    if (error) throw error;

    formMessage.textContent = "Report submitted successfully!";

    reportForm.reset();
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

    await loadReports();

  } catch (error) {
    console.error("Supabase submission failed:", error);
    formMessage.textContent =
      "Could not submit the report. Please check the browser console.";
  } finally {
    submitButton.disabled = false;
  }
}


reportForm.addEventListener("submit", handleReportSubmit);

async function editReport(id) {
  const item = databaseItems.find(report => report.id === id);

  if (!item || item.ownerId !== window.currentFindItUserId) {
    alert("You can only edit your own reports.");
    return;
  }

  if (item.recoveredAt) {
    alert("Recovered reports cannot be edited.");
    return;
  }

  const name = prompt("Item name:", item.name);
  if (name === null) return;

  const location = prompt("Location:", item.location);
  if (location === null) return;

  const description = prompt("Description:", item.description);
  if (description === null) return;

  const status = prompt(
    "Enter Lost or Found:",
    item.status
  );

  if (status === null) return;

  const cleanName = name.trim();
  const cleanLocation = location.trim();
  const cleanDescription = description.trim();
  const cleanStatus = status.trim();

  if (
    !cleanName ||
    !cleanLocation ||
    !cleanDescription ||
    !["Lost", "Found"].includes(cleanStatus)
  ) {
    alert("Enter valid details. Status must be Lost or Found.");
    return;
  }

  const { error } = await db
    .from("reports")
    .update({
      item_name: cleanName,
      location: cleanLocation,
      description: cleanDescription,
      status: cleanStatus
    })
    .eq("id", id)
    .eq("owner_id", window.currentFindItUserId)
    .is("recovered_at", null);

  if (error) {
    console.error("Edit failed:", error);
    alert("Could not edit the report.");
    return;
  }

  await loadReports();
  alert("Report updated!");
}

async function deleteReport(id) {
  const item = databaseItems.find(report => report.id === id);

  if (!item || item.ownerId !== window.currentFindItUserId) {
    alert("You can only delete your own reports.");
    return;
  }

  if (!confirm("Permanently delete this report?")) return;

  const { error } = await db
    .from("reports")
    .delete()
    .eq("id", id)
    .eq("owner_id", window.currentFindItUserId);

  if (error) {
    console.error("Delete failed:", error);
    alert("Could not delete the report.");
    return;
  }

  await loadReports();
  alert("Report deleted.");
}

async function markRecovered(id) {
  const item = databaseItems.find(report => report.id === id);

  if (!item || item.ownerId !== window.currentFindItUserId) {
    alert("Only the original poster can mark this recovered.");
    return;
  }

  if (item.recoveredAt) {
    alert("This report is already marked as recovered.");
    return;
  }

  if (!confirm("Mark this item as recovered? It will be scheduled for automatic deletion in about 2–3 minutes.")) {
    return;
  }

  const { error } = await db
    .from("reports")
    .update({
      recovery_status: "Recovered",
      recovered_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("owner_id", window.currentFindItUserId)
    .is("recovered_at", null);

  if (error) {
    console.error("Recovery update failed:", error);
    alert("Could not mark the item as recovered.");
    return;
  }

  await loadReports();
  alert("Marked as recovered! Automatic cleanup will remove it after the recovery period.");
}

window.editReport = editReport;
window.deleteReport = deleteReport;
window.markRecovered = markRecovered;



async function ensureAnonymousSession() {
  const { data: { session }, error: sessionError } =
    await db.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    const { error } = await db.auth.signInAnonymously();

    if (error) {
      throw error;
    }
  }
    const {
    data: { user },
    error: userError
  } = await db.auth.getUser();

  if (userError) throw userError;

  window.currentFindItUserId = user ? user.id : null;
}

async function initializeFindIt() {
  try {
    await ensureAnonymousSession();
    await loadCampuses();
    await loadReports();
  } catch (error) {
    console.error("FindIt initialization failed:", error);
    alert("Unable to connect to FindIt. Please refresh and try again.");
  }
}

initializeFindIt();

