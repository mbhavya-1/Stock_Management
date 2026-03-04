const API_URL = "https://stock-management-1-vv3s.onrender.com/api/items";
const LOGS_URL = "https://stock-management-1-vv3s.onrender.com/api/logs";

let allItems = [];
let allLogs = [];
let currentEditId = null;
let currentView = "inventory";

async function fetchItems() {
    const res = await fetch(API_URL);
    allItems = await res.json();
    renderTable(allItems);
}


async function refreshAll() {
    await fetchItems();
    if (document.getElementById("alertBox").classList.contains("alert-panel-open")) {
        renderAlerts();
    }
    if (currentView === "logs") {
        await renderLogs();
    }
}

function renderTable(items) {
    const body = document.getElementById("inventoryBody");
    body.innerHTML = "";

    let low = 0;
    let out = 0;

    items.forEach(item => {
        const isLow = item.quantity_in_stock <= item.reorder_level;
        const isOut = item.quantity_in_stock === 0;

        if (isLow) low++;
        if (isOut) out++;

        const rowClass = isOut ? "row-out" : isLow ? "row-low" : "";

        body.innerHTML += `
            <tr class="${rowClass}">
                <td>${item.item_name}</td>
                <td>${item.category || "—"}</td>
                <td>
                    <span class="stock-badge ${isOut ? "badge-out" : isLow ? "badge-low" : "badge-ok"}">
                        ${item.quantity_in_stock}
                    </span>
                </td>
                <td>${item.reorder_level}</td>
                <td>${item.supplier || "—"}</td>
                <td class="action-cell">
                    <button class="btn-edit"   onclick="openUpdateModal('${item.id}')">Edit</button>
                    <button class="btn-delete" onclick="deleteItem('${item.id}')">Delete</button>
                </td>
            </tr>
        `;
    });

    document.getElementById("totalItems").innerText = items.length;
    document.getElementById("lowStock").innerText = low;
    document.getElementById("outStock").innerText = out;
}


async function deleteItem(id) {
    if (!confirm("Delete this item?")) return;
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    await refreshAll();
}

function openAddModal() {
    document.getElementById("addName").value = "";
    document.getElementById("addCategory").value = "";
    document.getElementById("addQuantity").value = "";
    document.getElementById("addReorder").value = "";
    document.getElementById("addSupplier").value = "";
    document.getElementById("addModal").style.display = "flex";
}

function closeAddModal() {
    document.getElementById("addModal").style.display = "none";
}

async function addItem() {
    const newItem = {
        item_name: addName.value.trim(),
        category: addCategory.value.trim(),
        quantity_in_stock: Number(addQuantity.value),
        reorder_level: Number(addReorder.value),
        supplier: addSupplier.value.trim()
    };

    if (!newItem.item_name) { alert("Item name is required."); return; }

    const duplicate = allItems.find(item =>
        item.item_name === newItem.item_name &&
        item.category === newItem.category &&
        item.supplier === newItem.supplier
    );

    if (duplicate) { alert("Item already exists."); return; }

    await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
    });

    closeAddModal();
    await refreshAll();
}


function openUpdateModal(id) {
    const item = allItems.find(i => i.id === id);
    if (!item) return;

    currentEditId = id;

    document.getElementById("updateModalTitle").textContent = "Update Stock";
    document.getElementById("updateModalSubtitle").textContent =
        `${item.item_name}${item.category ? " · " + item.category : ""}`;

    document.getElementById("updateQuantity").value = item.quantity_in_stock;
    document.getElementById("updateReorder").value = item.reorder_level;

    document.getElementById("updateModal").style.display = "flex";
}

function closeUpdateModal() {
    document.getElementById("updateModal").style.display = "none";
    currentEditId = null;
    document.getElementById("updateQuantity").value = "";
    document.getElementById("updateReorder").value = "";
}

async function submitUpdate() {
    if (!currentEditId) return;

    const newQty = Number(document.getElementById("updateQuantity").value);
    const newReorder = Number(document.getElementById("updateReorder").value);

    if (newQty < 0) { alert("Stock cannot go below zero."); return; }

    const res = await fetch(`${API_URL}/${currentEditId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity_in_stock: newQty, reorder_level: newReorder })
    });

    if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to update item.");
        return;
    }

    closeUpdateModal();
    await refreshAll();
}

function toggleAlerts() {
    const panel = document.getElementById("alertBox");
    if (panel.classList.contains("alert-panel-open")) {
        closeAlerts();
    } else {
        renderAlerts();
        panel.classList.add("alert-panel-open");
    }
}

function closeAlerts() {
    document.getElementById("alertBox").classList.remove("alert-panel-open");
}

function renderAlerts() {
    const list = document.getElementById("alertList");
    const lowItems = allItems.filter(item => item.quantity_in_stock <= item.reorder_level);

    if (lowItems.length === 0) {
        list.innerHTML = `<div class="alert-empty">All items are sufficiently stocked.</div>`;
        return;
    }

    list.innerHTML = lowItems.map(item => {
        const isOut = item.quantity_in_stock === 0;
        return `
            <div class="alert-item ${isOut ? "alert-item-out" : "alert-item-low"}">
                <div class="alert-item-name">${item.item_name}</div>
                <div class="alert-item-meta">
                    Stock: <strong>${item.quantity_in_stock}</strong> &nbsp;/&nbsp; Reorder at: <strong>${item.reorder_level}</strong>
                </div>
                <span class="alert-tag">${isOut ? "Out of Stock" : "Low Stock"}</span>
            </div>
        `;
    }).join("");
}

async function toggleView() {
    const inventoryView = document.getElementById("inventoryView");
    const logsView = document.getElementById("logsView");
    const btn = document.getElementById("viewToggleBtn");

    if (currentView === "inventory") {
        
        inventoryView.style.display = "none";
        logsView.style.display = "block";
        btn.textContent = "Item List";
        currentView = "logs";
        document.getElementById("searchInput").placeholder = "Search logs by item name";
        document.getElementById("searchInput").value = "";
        await renderLogs();
    } else {
        
        logsView.style.display = "none";
        inventoryView.style.display = "block";
        btn.textContent = "Activity Log";
        currentView = "inventory";
        document.getElementById("searchInput").placeholder = "Search by item name";
        document.getElementById("searchInput").value = "";
    }
}

async function renderLogs(filterValue = "") {
    
    if (!filterValue) {
        const res = await fetch(LOGS_URL);
        allLogs = await res.json();
    }

    const filtered = filterValue
        ? allLogs.filter(log => log.item_name.toLowerCase().includes(filterValue))
        : allLogs;

    renderLogsTable(filtered);
}

function renderLogsTable(logs) {
    const body = document.getElementById("logsBody");

    if (logs.length === 0) {
        body.innerHTML = `<tr><td colspan="8" class="logs-empty">No matching log entries.</td></tr>`;
        return;
    }

    body.innerHTML = logs.map(log => `
        <tr>
            <td><span class="log-tag log-tag-${log.tag}">${log.tag}</span></td>
            <td>${log.item_name}</td>
            <td>${log.category}</td>
            <td>${log.supplier}</td>
            <td class="log-mono">${log.quantity_changed}</td>
            <td class="log-mono">${log.reorder_threshold_changed}</td>
            <td class="log-desc">${log.description}</td>
            <td class="log-mono">${formatTimestamp(log.timestamp)}</td>
        </tr>
    `).join("");
}

function formatTimestamp(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        + " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}


function searchItem() {
    const value = document.getElementById("searchInput").value.toLowerCase().trim();

    if (currentView === "inventory") {
        const filtered = allItems.filter(item => item.item_name.toLowerCase().includes(value));
        renderTable(filtered);
    } else {
        renderLogsTable(
            allLogs.filter(log => log.item_name.toLowerCase().includes(value))
        );
    }
}

function resetSearch() {
    document.getElementById("searchInput").value = "";
    if (currentView === "inventory") {
        renderTable(allItems);
    } else {
        renderLogsTable(allLogs);
    }
}

function handleModalBackdropClick(event, modalId) {
    if (event.target.id === modalId) {
        document.getElementById(modalId).style.display = "none";
        if (modalId === "updateModal") currentEditId = null;
    }
}

fetchItems();
