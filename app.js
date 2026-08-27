/* =========================================================
   PROJECT MANAGEMENT
   APP.JS
========================================================= */


/* =========================================================
   LOCAL STORAGE
========================================================= */

const STORAGE_KEYS = {
    clients: "pm_clients",
    projects: "pm_projects",
    vendors: "pm_vendors",
    payments: "pm_client_payments",
    vendorPayments: "pm_vendor_payments",
    schedules: "pm_schedules",
    invoices: "pm_invoices",
    checklists: "pm_checklists",
    packages: "pm_packages",
    vendorCatalog: "pm_vendor_catalog"
};


/* =========================================================
   DATA
========================================================= */

let appData = {
    clients: loadData(STORAGE_KEYS.clients),
    projects: loadData(STORAGE_KEYS.projects),
    vendors: loadData(STORAGE_KEYS.vendors),
    payments: loadData(STORAGE_KEYS.payments),
    vendorPayments: loadData(STORAGE_KEYS.vendorPayments),
    schedules: loadData(STORAGE_KEYS.schedules),
    invoices: loadData(STORAGE_KEYS.invoices),
    checklists: loadData(STORAGE_KEYS.checklists),
    packages: loadData(STORAGE_KEYS.packages),
    vendorCatalog: loadData(STORAGE_KEYS.vendorCatalog)
};

let currentVendorHistoryId = null;


/* =========================================================
   LOAD DATA
========================================================= */

function loadData(key) {

    try {

        const data = localStorage.getItem(key);

        return data ? JSON.parse(data) : [];

    } catch (error) {

        console.error(`Gagal membaca ${key}:`, error);

        return [];

    }

}


/* =========================================================
   SAVE DATA
========================================================= */

function saveData(key, data) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(data)
        );
    } catch (error) {
        console.error(`Gagal menyimpan ${key}:`, error);
    }
}


/* =========================================================
   NAVIGATION
========================================================= */

function showPage(pageId) {
    const pages = document.querySelectorAll(".page");
    const menuItems = document.querySelectorAll(".menu-item");

    /* Hide all pages */
    pages.forEach(page => {
        page.classList.remove("active");
    });

    /* Remove active menu */
    menuItems.forEach(item => {
        item.classList.remove("active");
    });

    /* Show selected page */
    const selectedPage = document.getElementById(pageId);
    if (!selectedPage) return;

    selectedPage.classList.add("active");

    /* Active menu */
    const selectedMenu = document.querySelector(
        `.sidebar-menu .menu-item[onclick="showPage('${pageId}')"]`
    );
    if (selectedMenu) {
        selectedMenu.classList.add("active");
    }

    /* Update header */
    updatePageHeader(pageId);

    if (pageId === "dashboard") {
        updateDashboard();
        renderUpcomingSchedules();
        renderRecentPayments();
    } else if (pageId === "clients") {
        renderClients();
    } else if (pageId === "projects") {
        renderProjects();
    } else if (pageId === "payments") {
        renderPayments();
        updatePaymentSummary();
    } else if (pageId === "vendors") {
        renderVendors();
    } else if (pageId === "settings") {
        renderPackages();
    }

    /* Update URL hash */
    const currentHash = window.location.hash.replace("#", "").trim();
    if (currentHash !== pageId) {
        history.replaceState(
            null,
            "",
            `#${pageId}`
        );
    }
}


/* =========================================================
   PAGE HEADER
========================================================= */

const pageInfo = {
payments: {
    title: "Pembayaran",
    subtitle: "Kelola DP, cicilan, dan pelunasan klien"
},
    dashboard: {
        title: "Dashboard",
        subtitle: "Ringkasan seluruh proyek kamu"
    },

    clients: {
        title: "Data Klien",
        subtitle: "Kelola seluruh data klien dan pelanggan"
    },

    projects: {
        title: "Proyek",
        subtitle: "Kelola proyek dan pekerjaan klien"
    },

    vendors: {
        title: "Vendor",
        subtitle: "Kelola vendor yang terlibat dalam proyek"
    },

    invoices: {
        title: "Invoice",
        subtitle: "Kelola invoice dan tagihan klien"
    },

    schedules: {
        title: "Jadwal",
        subtitle: "Survey, fitting, technical meeting, dan agenda lainnya"
    },

    checklist: {
        title: "Checklist",
        subtitle: "Pantau pekerjaan yang harus diselesaikan"
    },

    settings: {
        title: "Setting",
        subtitle: "Kelola paket layanan yang tersedia untuk klien"
    }

};


function updatePageHeader(pageId) {

    const info = pageInfo[pageId];

    if (!info) return;


    const title =
        document.getElementById("pageTitle");

    const subtitle =
        document.getElementById("pageSubtitle");


    if (title) {

        title.textContent = info.title;

    }

    if (subtitle) {

        subtitle.textContent = info.subtitle;

    }

}


/* =========================================================
   PACKAGE MANAGEMENT
========================================================= */

function openPackageModal(packageId = null) {
    const modal = document.getElementById("packageModal");
    const form = document.getElementById("packageForm");
    if (!modal || !form) return;

    form.reset();
    document.getElementById("packageId").value = "";

    if (packageId) {
        const packageItem = appData.packages.find(item => item.id === packageId);
        if (!packageItem) return;

        document.getElementById("packageModalTitle").textContent = "Edit Paket";
        document.getElementById("packageId").value = packageItem.id;
        document.getElementById("packageName").value = packageItem.name || "";
        setCurrencyInputValue("packagePrice", packageItem.price);
        document.getElementById("packageCapacity").value = packageItem.capacity || "";
        document.getElementById("packageDescription").value = packageItem.description || "";
        document.getElementById("packageServices").value = (packageItem.services || []).join("\n");
    } else {
        document.getElementById("packageModalTitle").textContent = "Tambah Paket";
    }

    modal.classList.add("show");
}

function closePackageModal() {
    const modal = document.getElementById("packageModal");
    if (modal) modal.classList.remove("show");
}

function savePackage(event) {
    event.preventDefault();

    const id = document.getElementById("packageId").value;
    const packageData = {
        id: id || `package_${Date.now()}`,
        name: document.getElementById("packageName").value.trim(),
        price: getCurrencyInputValue("packagePrice"),
        capacity: Number(document.getElementById("packageCapacity").value) || 0,
        description: document.getElementById("packageDescription").value.trim(),
        services: document.getElementById("packageServices").value
            .split("\n")
            .map(service => service.trim())
            .filter(Boolean)
    };

    const existingIndex = appData.packages.findIndex(item => item.id === id);
    if (existingIndex >= 0) {
        appData.packages[existingIndex] = packageData;
    } else {
        appData.packages.push(packageData);
    }

    saveData(STORAGE_KEYS.packages, appData.packages);
    renderPackages();
    closePackageModal();
}

function deletePackage(packageId) {
    const packageItem = appData.packages.find(item => item.id === packageId);
    if (!packageItem || !confirm(`Hapus paket "${packageItem.name}"?`)) return;

    appData.packages = appData.packages.filter(item => item.id !== packageId);
    saveData(STORAGE_KEYS.packages, appData.packages);
    renderPackages();
}

function renderPackages() {
    const grid = document.getElementById("packagesGrid");
    const emptyState = document.getElementById("packagesEmpty");
    const count = document.getElementById("packageCount");
    const search = (document.getElementById("packageSearch")?.value || "").toLowerCase().trim();
    if (!grid || !emptyState || !count) return;

    const packages = appData.packages.filter(packageItem => {
        const servicesText = (packageItem.services || []).join(" ");
        const searchable = `${packageItem.name || ""} ${packageItem.description || ""} ${servicesText}`.toLowerCase();
        return searchable.includes(search);
    });

    count.textContent = `${packages.length} paket`;
    grid.innerHTML = packages.map(packageItem => `
        <article class="package-card">
            <div class="package-card-top">
                <div>
                    <span class="package-label">PAKET LAYANAN</span>
                    <h3>${escapeHTML(packageItem.name)}</h3>
                </div>
                <div class="table-actions">
                    <button class="action-button" type="button" onclick="openPackageModal('${packageItem.id}')">Edit</button>
                    <button class="action-button delete" type="button" onclick="deletePackage('${packageItem.id}')">Hapus</button>
                </div>
            </div>
            <strong class="package-price">${formatRupiah(packageItem.price)}</strong>
            <p class="package-description">${escapeHTML(packageItem.description || "Paket layanan untuk kebutuhan acara kamu.")}</p>
            ${packageItem.capacity ? `<span class="package-capacity">♙ Hingga ${packageItem.capacity} tamu</span>` : ""}
            <ul class="package-services">${(packageItem.services || []).map(service => `<li>${escapeHTML(service)}</li>`).join("")}</ul>
        </article>
    `).join("");

    emptyState.style.display = packages.length ? "none" : "flex";
}


/* =========================================================
   VENDOR COST MANAGEMENT
========================================================= */

function updateVendorProjectDropdown(selectedProject = "") {
    const select = document.getElementById("vendorProject");
    if (!select) return;

    select.innerHTML = `<option value="">Pilih Proyek</option>`;
    appData.projects.forEach(project => {
        const option = document.createElement("option");
        option.value = project.id;
        option.textContent = project.name;
        select.appendChild(option);
    });
    select.value = selectedProject;
}

function openVendorModal(vendorId = null) {
    const modal = document.getElementById("vendorModal");
    const form = document.getElementById("vendorForm");
    if (!modal || !form) return;

    form.reset();
    document.getElementById("vendorId").value = "";
    updateVendorProjectDropdown();

    if (vendorId) {
        const vendor = appData.vendors.find(item => item.id === vendorId);
        if (!vendor) return;

        document.getElementById("vendorModalTitle").textContent = "Edit Vendor";
        document.getElementById("vendorId").value = vendor.id;
        document.getElementById("vendorName").value = vendor.name || "";
        updateVendorProjectDropdown(vendor.projectId || "");
        setCurrencyInputValue("vendorCost", vendor.cost);
        document.getElementById("vendorNotes").value = vendor.notes || "";
    } else {
        document.getElementById("vendorModalTitle").textContent = "Tambah Vendor";
    }

    modal.classList.add("show");
}

function closeVendorModal() {
    const modal = document.getElementById("vendorModal");
    if (modal) modal.classList.remove("show");
}

function saveVendor(event) {
    event.preventDefault();

    const id = document.getElementById("vendorId").value;
    const existingVendor = appData.vendors.find(item => item.id === id);
    const vendorData = {
        id: id || `vendor_${Date.now()}`,
        name: document.getElementById("vendorName").value.trim(),
        projectId: document.getElementById("vendorProject").value,
        cost: getCurrencyInputValue("vendorCost"),
        dp: existingVendor?.dp || 0,
        settlement: existingVendor?.settlement || 0,
        notes: document.getElementById("vendorNotes").value.trim()
    };

    const existingIndex = appData.vendors.findIndex(item => item.id === id);
    if (existingIndex >= 0) {
        appData.vendors[existingIndex] = vendorData;
    } else {
        appData.vendors.push(vendorData);
    }

    saveData(STORAGE_KEYS.vendors, appData.vendors);
    renderVendors();
    updateDashboard();
    closeVendorModal();
}

function deleteVendor(vendorId) {
    const vendor = appData.vendors.find(item => item.id === vendorId);
    if (!vendor || !confirm(`Hapus vendor "${vendor.name}"?`)) return;

    appData.vendors = appData.vendors.filter(item => item.id !== vendorId);
    saveData(STORAGE_KEYS.vendors, appData.vendors);
    renderVendors();
    updateDashboard();
}

function renderVendors() {
    const tableBody = document.getElementById("vendorsTableBody");
    const emptyState = document.getElementById("vendorsEmpty");
    if (!tableBody || !emptyState) return;

    let totalCost = 0;
    let totalRemaining = 0;

    tableBody.innerHTML = appData.vendors.map(vendor => {
        const ledgerPaid = appData.vendorPayments
            .filter(payment => payment.vendorId === vendor.id)
            .reduce((total, payment) => total + (Number(payment.amount) || 0), 0);
      const paid =
    ledgerPaid +
    (Number(vendor.dp) || 0) +
    (Number(vendor.settlement) || 0);
        const remaining = Math.max((Number(vendor.cost) || 0) - paid, 0);
        const project = appData.projects.find(item => item.id === vendor.projectId);
        totalCost += Number(vendor.cost) || 0;
        totalRemaining += remaining;

        return `
            <tr>
                <td><strong>${escapeHTML(vendor.name)}</strong><span class="client-sub">${escapeHTML(vendor.notes || "Vendor proyek")}</span></td>
                <td>${escapeHTML(project?.name || "Proyek tidak ditemukan")}</td>
                <td>${formatRupiah(vendor.cost)}</td>
                <td>${formatRupiah(paid)}</td>
                <td>${formatRupiah(remaining)}</td>
                <td><div class="table-actions"><button class="action-button" type="button" onclick="openVendorModal('${vendor.id}')">Edit</button><button class="action-button" type="button" onclick="openVendorPaymentModal('${vendor.id}')">Bayar</button><button class="action-button" type="button" onclick="openVendorHistoryModal('${vendor.id}')">Riwayat</button><button class="action-button delete" type="button" onclick="deleteVendor('${vendor.id}')">Hapus</button></div></td>
            </tr>
        `;
    }).join("");

    document.getElementById("totalVendors").textContent = appData.vendors.length;
    document.getElementById("totalVendorCost").textContent = formatRupiah(totalCost);
    document.getElementById("totalVendorRemaining").textContent = formatRupiah(totalRemaining);
    emptyState.style.display = appData.vendors.length ? "none" : "flex";
}

function openVendorHistoryModal(vendorId) {
    const vendor = appData.vendors.find(item => item.id === vendorId);
    const modal = document.getElementById("vendorHistoryModal");
    if (!vendor || !modal) return;

    currentVendorHistoryId = vendorId;
    document.getElementById("vendorHistoryTitle").textContent = `Riwayat ${vendor.name}`;
    renderVendorHistory(vendorId);
    modal.classList.add("show");
}

function closeVendorHistoryModal() {
    const modal = document.getElementById("vendorHistoryModal");
    if (modal) modal.classList.remove("show");
    currentVendorHistoryId = null;
}

function renderVendorHistory(vendorId) {
    const tableBody = document.getElementById("vendorHistoryTableBody");
    const emptyState = document.getElementById("vendorHistoryEmpty");
    if (!tableBody || !emptyState) return;

    const payments = appData.vendorPayments
        .filter(payment => payment.vendorId === vendorId)
        .slice()
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    tableBody.innerHTML = payments
        .map(payment => {
            const proof = payment.proof?.data
                ? (payment.proof.data.startsWith("data:image/")
                    ? `<a href="${payment.proof.data}" download="${escapeHTML(payment.proof.name || "bukti-pembayaran.jpg")}" target="_blank" rel="noopener"><img class="proof-thumbnail" src="${payment.proof.data}" alt="Bukti pembayaran"></a>`
                    : `<a class="proof-link" href="${payment.proof.data}" download="${escapeHTML(payment.proof.name || "bukti-pembayaran")}" target="_blank" rel="noopener">Download bukti</a>`)
                : "-";
            return `
                <tr>
                    <td>${formatDate(payment.date)}</td>
                    <td><span class="status-badge proses">${escapeHTML(payment.type || "-")}</span></td>
                    <td class="payment-value">${formatRupiah(payment.amount)}</td>
                    <td>${escapeHTML(payment.method || "-")}</td>
                    <td>${proof}</td>
                    <td><button class="action-button delete" type="button" onclick="deleteVendorPayment('${payment.id}')">Hapus</button></td>
                </tr>
            `;
        }).join("");

    emptyState.style.display = payments.length ? "none" : "flex";
}

function deleteVendorPayment(paymentId) {
    if (!confirm("Hapus transaksi pembayaran vendor ini?")) return;
    appData.vendorPayments = appData.vendorPayments.filter(item => item.id !== paymentId);
    saveData(STORAGE_KEYS.vendorPayments, appData.vendorPayments);
    renderVendors();
    updateDashboard();
    if (currentVendorHistoryId) renderVendorHistory(currentVendorHistoryId);
}

function getFinanceTransactions() {
    const income = appData.payments.map(payment => {
        const project = appData.projects.find(item => item.id === payment.projectId);
        return { date: payment.date, type: `Customer - ${payment.type}`, amount: Number(payment.amount) || 0, project: project?.name || "-", party: "Customer", proof: payment.proof?.name || "" };
    });
    const expense = appData.vendorPayments.map(payment => {
        const vendor = appData.vendors.find(item => item.id === payment.vendorId);
        const project = appData.projects.find(item => item.id === vendor?.projectId);
        return { date: payment.date, type: `Vendor - ${payment.type}`, amount: Number(payment.amount) || 0, project: project?.name || "-", party: vendor?.name || "-", proof: payment.proof?.name || "" };
    });
    return [...income, ...expense];
}

function getFilteredFinanceTransactions() {
    const year = document.getElementById("financeYear")?.value;
    const start = document.getElementById("financeStart")?.value;
    const end = document.getElementById("financeEnd")?.value;
    return getFinanceTransactions().filter(transaction => {
        if (start && transaction.date < start) return false;
        if (end && transaction.date > end) return false;
        if (!start && !end && year && !(transaction.date || "").startsWith(year)) return false;
        return true;
    });
}

function populateFinanceYears() {
    const yearSelect = document.getElementById("financeYear");
    if (!yearSelect) return;

    const currentSelected = yearSelect.value;
    const years = new Set(getFinanceTransactions().map(item => item.date?.slice(0, 4)).filter(Boolean));
    years.add(String(new Date().getFullYear()));

    const sortedYears = [...years].sort().reverse();
    yearSelect.innerHTML = sortedYears.map(year => `<option value="${year}">${year}</option>`).join("");

    if (currentSelected && sortedYears.includes(currentSelected)) {
        yearSelect.value = currentSelected;
    }
}

function renderFinanceReport() {
    populateFinanceYears();

    const transactions = getFilteredFinanceTransactions();
    const income = transactions.filter(item => item.party === "Customer").reduce((sum, item) => sum + item.amount, 0);
    const expense = transactions.filter(item => item.party !== "Customer").reduce((sum, item) => sum + item.amount, 0);
    document.getElementById("financeIncome").textContent = formatRupiah(income);
    document.getElementById("financeExpense").textContent = formatRupiah(expense);
    document.getElementById("financeNet").textContent = formatRupiah(income - expense);

  const vendorDebt = appData.vendors.reduce((sum, vendor) => {
    const paid = appData.vendorPayments
        .filter(item => item.vendorId === vendor.id)
        .reduce(
            (total, item) => total + (Number(item.amount) || 0),
            0
        );

    const totalPaid =
        paid +
        (Number(vendor.dp) || 0) +
        (Number(vendor.settlement) || 0);

    return sum + Math.max(
        (Number(vendor.cost) || 0) - totalPaid,
        0
    );
}, 0);
    document.getElementById("dashboardVendorDebt").textContent = formatRupiah(vendorDebt);

    const months = Array.from({ length: 12 }, (_, index) => ({ label: new Date(2000, index, 1).toLocaleDateString("id-ID", { month: "short" }), income: 0, expense: 0 }));
    transactions.forEach(transaction => {
        const month = Number(transaction.date?.slice(5, 7)) - 1;
        if (month >= 0) months[month][transaction.party === "Customer" ? "income" : "expense"] += transaction.amount;
    });
    const max = Math.max(...months.map(month => Math.max(month.income, month.expense)), 1);
    document.getElementById("financeChart").innerHTML = months.map(month => `
        <div class="chart-month"><div class="chart-bars"><i class="chart-income" style="height:${(month.income / max) * 100}%" title="${formatRupiah(month.income)}"></i><i class="chart-expense" style="height:${(month.expense / max) * 100}%" title="${formatRupiah(month.expense)}"></i></div><span>${month.label}</span></div>
    `).join("");
}

function clearFinanceDates() {
    document.getElementById("financeStart").value = "";
    document.getElementById("financeEnd").value = "";
    renderFinanceReport();
}

function exportFinanceCSV() {
    const transactions = getFilteredFinanceTransactions();
    const income = transactions.filter(item => item.party === "Customer");
    const expense = transactions.filter(item => item.party !== "Customer");
    const rows = [
        ["LAPORAN KEUANGAN"],
        ["Filter", getFinanceReportLabel()],
        [],
        ["PEMASUKAN"],
        ["Transaksi Pembayaran Customer"],
        ["Tanggal", "Jenis Pembayaran", "Proyek", "Customer", "Nominal", "Bukti"]
    ];

    income.forEach(item => rows.push([item.date || "", item.type.replace("Customer - ", ""), item.project, item.party, formatRupiah(item.amount), item.proof]));
    rows.push([], ["Subtotal Pemasukan", "", "", "", formatRupiah(income.reduce((sum, item) => sum + item.amount, 0))], [], ["PENGELUARAN"], ["Transaksi Pembayaran Vendor"], ["Tanggal", "Jenis Pembayaran", "Proyek", "Vendor", "Nominal", "Bukti"]);
    expense.forEach(item => rows.push([item.date || "", item.type.replace("Vendor - ", ""), item.project, item.party, formatRupiah(item.amount), item.proof]));
    rows.push([], ["Subtotal Pengeluaran", "", "", "", formatRupiah(expense.reduce((sum, item) => sum + item.amount, 0))]);

    const csv = rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    link.download = `laporan-keuangan-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function getFinanceReportLabel() {
    const start = document.getElementById("financeStart")?.value;
    const end = document.getElementById("financeEnd")?.value;
    if (start || end) return `${start || "awal"} sampai ${end || "sekarang"}`;
    return `Tahun ${document.getElementById("financeYear")?.value || new Date().getFullYear()}`;
}

function openProjectPaymentHistory(projectId) {
    const project = appData.projects.find(item => item.id === projectId);
    const modal = document.getElementById("projectPaymentHistoryModal");
    const body = document.getElementById("projectPaymentHistoryBody");
    const empty = document.getElementById("projectPaymentHistoryEmpty");
    if (!project || !modal || !body || !empty) return;
    document.getElementById("projectPaymentHistoryTitle").textContent = `Riwayat ${project.name}`;
    const payments = appData.payments.filter(item => item.projectId === projectId).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    body.innerHTML = payments.map(payment => {
        const proof = payment.proof?.data
            ? (payment.proof.data.startsWith("data:image/")
                ? `<a href="${payment.proof.data}" download="${escapeHTML(payment.proof.name || "bukti-pembayaran.jpg")}" target="_blank" rel="noopener"><img class="proof-thumbnail" src="${payment.proof.data}" alt="Bukti"></a>`
                : `<a class="proof-link" href="${payment.proof.data}" download="${escapeHTML(payment.proof.name || "bukti-pembayaran")}" target="_blank" rel="noopener">Download bukti</a>`)
            : "-";
        return `<tr><td>${formatDate(payment.date)}</td><td><span class="status-badge proses">${escapeHTML(payment.type || "-")}</span></td><td class="payment-value">${formatRupiah(payment.amount)}</td><td>${proof}</td><td>${escapeHTML(payment.notes || "-")}</td></tr>`;
    }).join("");
    empty.style.display = payments.length ? "none" : "flex";
    modal.classList.add("show");
}

function closeProjectPaymentHistory() {
    document.getElementById("projectPaymentHistoryModal")?.classList.remove("show");
}

function openProjectPaymentModal(projectId) {
    openPaymentModal();
    const projectSelect = document.getElementById("paymentProject");
    if (projectSelect) projectSelect.value = projectId;
}

function openVendorPaymentModal(vendorId) {
    const vendor = appData.vendors.find(item => item.id === vendorId);
    const modal = document.getElementById("vendorPaymentModal");
    const form = document.getElementById("vendorPaymentForm");
    if (!vendor || !modal || !form) return;

    form.reset();
    document.getElementById("vendorPaymentId").value = "";
    document.getElementById("vendorPaymentVendor").value = vendor.id;
    document.getElementById("vendorPaymentVendorName").value = vendor.name;
    document.getElementById("vendorPaymentDate").value = new Date().toISOString().split("T")[0];
    modal.classList.add("show");
}

function closeVendorPaymentModal() {
    const modal = document.getElementById("vendorPaymentModal");
    if (modal) modal.classList.remove("show");
}

function readFileAsData(file) {
    return new Promise((resolve) => {
        if (!file) {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, data: reader.result });
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

async function saveVendorPayment(event) {
    event.preventDefault();

    const proofFile = document.getElementById("vendorPaymentProof").files[0];
    const proof = await readFileAsData(proofFile);

    const payment = {
        id: `vendor_payment_${Date.now()}`,
        vendorId: document.getElementById("vendorPaymentVendor").value,
        date: document.getElementById("vendorPaymentDate").value,
        type: document.getElementById("vendorPaymentType").value,
        amount: getCurrencyInputValue("vendorPaymentAmount"),
        method: document.getElementById("vendorPaymentMethod").value,
        proof,
        notes: document.getElementById("vendorPaymentNotes").value.trim()
    };

    appData.vendorPayments.push(payment);
    saveData(STORAGE_KEYS.vendorPayments, appData.vendorPayments);
    renderVendors();
    updateDashboard();
    if (currentVendorHistoryId) renderVendorHistory(currentVendorHistoryId);
    closeVendorPaymentModal();
}


/* =========================================================
   CURRENCY
========================================================= */

function formatRupiah(value) {

    const number =
        Number(value) || 0;


    return `Rp. ${new Intl.NumberFormat("id-ID").format(number)}`;

}

function parseRupiah(value) {
    return Number(String(value || "").replace(/\D/g, "")) || 0;
}

function getCurrencyInputValue(inputId) {
    return parseRupiah(document.getElementById(inputId)?.value);
}

function setCurrencyInputValue(inputId, value) {
    const input = document.getElementById(inputId);
    if (input) input.value = value ? new Intl.NumberFormat("id-ID").format(value) : "";
}

function formatCurrencyInput(event) {
    const input = event.target;
    const digits = input.value.replace(/\D/g, "");
    input.value = digits ? new Intl.NumberFormat("id-ID").format(Number(digits)) : "";
}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    renderFinanceReport();

    /* =========================
       TOTAL CLIENT
    ========================== */

    const totalClients =
        appData.clients.length;


    /* =========================
       TOTAL PROJECT
    ========================== */

    const totalProjects =
        appData.projects.length;


    /* =========================
       CLIENT PAYMENT
    ========================== */

    const totalClientPayment =
        appData.payments.reduce(
            (total, payment) => {

                return total +
                    (Number(payment.amount) || 0);

            },
            0
        );


    /* =========================
       RECEIVABLE
    ========================== */

    const totalProjectValue =
        appData.projects.reduce(
            (total, project) => {

                return total +
                    (Number(project.total) || 0);

            },
            0
        );


    const totalReceivable =
        Math.max(
            totalProjectValue -
            totalClientPayment,
            0
        );


    /* =========================
       RENDER
    ========================== */

    const clientsElement =
        document.getElementById("totalClients");

    const projectsElement =
        document.getElementById("totalProjects");

    const paymentElement =
        document.getElementById("totalClientPayment");

    const receivableElement =
        document.getElementById("totalReceivable");


    if (clientsElement) {

        clientsElement.textContent =
            totalClients;

    }


    if (projectsElement) {

        projectsElement.textContent =
            totalProjects;

    }


    if (paymentElement) {

        paymentElement.textContent =
            formatRupiah(totalClientPayment);

    }


    if (receivableElement) {

        receivableElement.textContent =
            formatRupiah(totalReceivable);

    }

}


/* =========================================================
   UPCOMING SCHEDULES
========================================================= */

function renderUpcomingSchedules() {

    const container =
        document.getElementById(
            "upcomingSchedules"
        );

    if (!container) return;


    if (appData.schedules.length === 0) {

        container.innerHTML = `
            <div class="empty-icon">
                ◷
            </div>

            <strong>
                Belum ada jadwal
            </strong>

            <span>
                Jadwal proyek akan muncul di sini.
            </span>
        `;

        return;

    }


    const schedules =
        [...appData.schedules]
            .filter(item => item.date)
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            )
            .slice(0, 5);


    container.innerHTML = "";


    schedules.forEach(item => {

        const row =
            document.createElement("div");

        row.style.width = "100%";
        row.style.padding = "10px 0";
        row.style.borderBottom =
            "1px solid var(--border)";


        row.innerHTML = `
            <strong style="font-size:12px;">
                ${escapeHTML(item.title || "Agenda")}
            </strong>

            <span style="display:block;margin-top:4px;">
                ${formatDate(item.date)}
                ${item.time ? ` • ${escapeHTML(item.time)}` : ""}
            </span>
        `;


        container.appendChild(row);

    });

}


/* =========================================================
   RECENT PAYMENTS
========================================================= */

function renderRecentPayments() {

    const container =
        document.getElementById(
            "recentPayments"
        );

    if (!container) return;


    if (appData.payments.length === 0) {

        container.innerHTML = `
            <div class="empty-icon">
                Rp
            </div>

            <strong>
                Belum ada transaksi
            </strong>

            <span>
                Pembayaran klien akan muncul di sini.
            </span>
        `;

        return;

    }


    const payments =
        [...appData.payments]
            .sort(
                (a, b) =>
                    new Date(b.date || 0) -
                    new Date(a.date || 0)
            )
            .slice(0, 5);


    container.innerHTML = "";


    payments.forEach(payment => {

        const row =
            document.createElement("div");

        row.style.width = "100%";
        row.style.padding = "10px 0";
        row.style.borderBottom =
            "1px solid var(--border)";


        row.innerHTML = `
            <strong style="font-size:12px;">
                ${escapeHTML(payment.type || "Pembayaran")}
            </strong>

            <strong
                style="
                    display:block;
                    margin-top:4px;
                    font-size:12px;
                "
            >
                ${formatRupiah(payment.amount)}
            </strong>

            <span>
                ${payment.date ? formatDate(payment.date) : "-"}
            </span>
        `;


        container.appendChild(row);

    });

}


/* =========================================================
   DATE
========================================================= */

function formatDate(date) {

    if (!date) return "-";


    const parsed =
        new Date(date);


    if (Number.isNaN(parsed.getTime())) {

        return date;

    }


    return parsed.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   REFRESH APP
========================================================= */

function refreshApp() {

    updateDashboard();

    renderUpcomingSchedules();

    renderRecentPayments();

}


/* =========================================================
   INITIALIZE
========================================================= */

function initializeApp() {
    renderClients();
    renderProjects();
    renderPayments();
    updatePaymentSummary();
    renderPackages();
    renderVendors();
    refreshApp();

    const hash =
        window.location.hash
            .replace("#", "")
            .trim();

    if (hash && pageInfo[hash]) {
        showPage(hash);
    } else {
        showPage("dashboard");
    }
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);

/* =========================================================
   CLIENT MODULE
========================================================= */


/* =========================================================
   OPEN CLIENT MODAL
========================================================= */

function openClientModal(clientId = null) {

    const modal =
        document.getElementById("clientModal");

    const form =
        document.getElementById("clientForm");

    const title =
        document.getElementById("clientModalTitle");

    if (!modal || !form) return;

    form.reset();

    document.getElementById("clientId").value = "";


    /* =========================
       EDIT
    ========================== */

    if (clientId) {

        const client =
            appData.clients.find(
                item => item.id === clientId
            );

        if (!client) return;

        title.textContent = "Edit Klien";

        document.getElementById("clientId").value =
            client.id;

        document.getElementById("clientName").value =
            client.name || "";

        document.getElementById("clientPhone").value =
            client.phone || "";

        document.getElementById("clientEmail").value =
            client.email || "";

        document.getElementById("clientEvent").value =
            client.event || "";

        document.getElementById("clientEventDate").value =
            client.eventDate || "";

        document.getElementById("clientStatus").value =
            client.status || "aktif";

        document.getElementById("clientLocation").value =
            client.location || "";

        document.getElementById("clientAddress").value =
            client.address || "";

        document.getElementById("clientPIC").value =
            client.pic || "";

        document.getElementById("clientNotes").value =
            client.notes || "";

    } else {

        title.textContent = "Tambah Klien";

    }


    modal.classList.add("show");

}


/* =========================================================
   CLOSE CLIENT MODAL
========================================================= */

function closeClientModal() {

    const modal =
        document.getElementById("clientModal");

    if (!modal) return;

    modal.classList.remove("show");

}


/* =========================================================
   SAVE CLIENT
========================================================= */

function saveClient(event) {

    event.preventDefault();


    const id =
        document.getElementById("clientId").value;


    const clientData = {

        name:
            document
                .getElementById("clientName")
                .value
                .trim(),

        phone:
            document
                .getElementById("clientPhone")
                .value
                .trim(),

        email:
            document
                .getElementById("clientEmail")
                .value
                .trim(),

        event:
            document
                .getElementById("clientEvent")
                .value
                .trim(),

        eventDate:
            document
                .getElementById("clientEventDate")
                .value,

        location:
            document
                .getElementById("clientLocation")
                .value
                .trim(),

        address:
            document
                .getElementById("clientAddress")
                .value
                .trim(),

        pic:
            document
                .getElementById("clientPIC")
                .value
                .trim(),

        notes:
            document
                .getElementById("clientNotes")
                .value
                .trim(),

        status:
            document
                .getElementById("clientStatus")
                .value || "aktif"

    };


    /* =========================
       EDIT
    ========================== */

    if (id) {

        const index =
            appData.clients.findIndex(
                item => item.id === id
            );

        if (index !== -1) {

            appData.clients[index] = {

                ...appData.clients[index],

                ...clientData,

                updatedAt:
                    new Date().toISOString()

            };

        }

    }


    /* =========================
       TAMBAH
    ========================== */

    else {

        appData.clients.push({

            id: generateClientId(),

            ...clientData,

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()

        });

    }

    const savedClient = id
        ? appData.clients.find(item => item.id === id)
        : appData.clients[appData.clients.length - 1];

    if (savedClient) {
        appData.projects.forEach(project => {
            if (project.clientId === savedClient.id) {
                project.eventStatus = savedClient.status || "aktif";
                project.updatedAt = new Date().toISOString();
            }
        });
        saveData(STORAGE_KEYS.projects, appData.projects);
    }


    /* =========================
       SAVE
    ========================== */

    saveData(
        STORAGE_KEYS.clients,
        appData.clients
    );


    /* =========================
       REFRESH
    ========================== */

    renderClients();

    renderProjects();

    renderInvoices();

    renderScheduleViews();

    updateDashboard();

    closeClientModal();

}


/* =========================================================
   RENDER CLIENTS
========================================================= */

function renderClients() {

    const tbody =
        document.getElementById(
            "clientsTableBody"
        );

    const empty =
        document.getElementById(
            "clientsEmpty"
        );

    const searchInput =
        document.getElementById(
            "clientSearch"
        );


    if (!tbody) return;


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const clients =
        appData.clients.filter(client => {

            const searchableText = [

                client.name,
                client.phone,
                client.email,
                client.event,
                client.location,
                client.pic

            ]
                .join(" ")
                .toLowerCase();


            const statusMatch =
                clientStatusFilter === "all" ||
                (client.status || "aktif") === clientStatusFilter;

            return statusMatch && searchableText.includes(search);

        });


    tbody.innerHTML = "";


    /* =========================
       TIDAK ADA DATA
    ========================== */

    if (clients.length === 0) {

        empty.style.display = "flex";

        return;

    }


    empty.style.display = "none";


    /* =========================
       RENDER
    ========================== */

    clients.forEach(client => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>

                <div class="client-name">
                    ${escapeHTML(client.name)}
                </div>

                <span class="client-sub">
                    ${escapeHTML(client.email || "-")}
                </span>

            </td>


            <td>
                ${escapeHTML(client.event || "-")}
            </td>


            <td>
                ${formatDate(client.eventDate)}
            </td>


            <td>
                ${escapeHTML(client.location || "-")}
            </td>


            <td>
                ${escapeHTML(client.phone || "-")}
            </td>

            <td>
                <span class="status-badge ${(client.status || "aktif") === "selesai" ? "lunas" : (client.status || "aktif") === "cancel" ? "belum" : "proses"}">
                    ${(client.status || "aktif") === "selesai" ? "Selesai" : (client.status || "aktif") === "cancel" ? "Cancel" : "Aktif"}
                </span>
            </td>


            <td>

                <div class="table-actions">

                    <button
                        class="action-button"
                        onclick="openClientModal('${client.id}')">

                        Edit

                    </button>


                    <button
                        class="action-button"
                        onclick="toggleClientVendors('${client.id}')">

                        Vendor

                    </button>


                    <button
                        class="action-button delete"
                        onclick="deleteClient('${client.id}')">

                        Hapus

                    </button>

                </div>

            </td>

        `;


        tbody.appendChild(row);

        const detailRow = document.createElement("tr");
        detailRow.id = `client-vendors-${client.id}`;
        detailRow.className = "client-detail-row";
        detailRow.innerHTML = `<td colspan="7"><div class="client-vendor-details">${renderClientVendorDetails(client.id)}</div></td>`;
        tbody.appendChild(detailRow);

    });

}

function renderClientVendorDetails(clientId) {
    const projects = appData.projects.filter(project => project.clientId === clientId);
    const vendors = appData.vendors.filter(vendor => projects.some(project => project.id === vendor.projectId));

    if (!vendors.length) {
        return `<span class="detail-muted">Belum ada vendor yang terhubung ke proyek client ini.</span>`;
    }

    return vendors.map(vendor => {
        const project = projects.find(item => item.id === vendor.projectId);
        const ledgerPaid = appData.vendorPayments
            .filter(payment => payment.vendorId === vendor.id)
            .reduce((total, payment) => total + (Number(payment.amount) || 0), 0);
       const paid =
    ledgerPaid +
    (Number(vendor.dp) || 0) +
    (Number(vendor.settlement) || 0);
        const remaining = Math.max((Number(vendor.cost) || 0) - paid, 0);
        return `<div class="client-vendor-item"><div><strong>${escapeHTML(vendor.name)}</strong><span>${escapeHTML(project?.name || "-")}</span></div><div><strong>${formatRupiah(vendor.cost)}</strong><span>Sisa ${formatRupiah(remaining)}</span></div></div>`;
    }).join("");
}

function toggleClientVendors(clientId) {
    const row = document.getElementById(`client-vendors-${clientId}`);
    if (row) row.classList.toggle("show");
}


/* =========================================================
   DELETE CLIENT
========================================================= */

function deleteClient(clientId) {

    const client =
        appData.clients.find(
            item => item.id === clientId
        );


    if (!client) return;


    const confirmed =
        confirm(
            `Hapus data klien "${client.name}"?`
        );


    if (!confirmed) return;


    appData.clients =
        appData.clients.filter(
            item => item.id !== clientId
        );


    saveData(
        STORAGE_KEYS.clients,
        appData.clients
    );


    renderClients();

    updateDashboard();

}


/* =========================================================
   CLIENT ID
========================================================= */

function generateClientId() {

    return (
        "CL-" +
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 7)
    ).toUpperCase();

}



/* =========================================================
   PROJECT MODULE
========================================================= */


/* =========================================================
   OPEN PROJECT MODAL
========================================================= */

function openProjectModal(projectId = null) {

    const modal =
        document.getElementById("projectModal");

    const form =
        document.getElementById("projectForm");

    const title =
        document.getElementById("projectModalTitle");

    if (!modal || !form) return;

    form.reset();

    document.getElementById("projectId").value = "";

    updateProjectClientDropdown();
    updateProjectPackageDropdown();


    if (projectId) {

        const project =
            appData.projects.find(
                item => item.id === projectId
            );

        if (!project) return;

        title.textContent = "Edit Proyek";

        document.getElementById("projectId").value =
            project.id;

        document.getElementById("projectClient").value =
            project.clientId || "";

        document.getElementById("projectName").value =
            project.name || "";

        document.getElementById("projectEvent").value =
            project.event || "";

        updateProjectPackageDropdown(project.package || "");

        setCurrencyInputValue("projectTotal", project.total);

        document.getElementById("projectIncludes").value =
            project.includes || "";

        setCurrencyInputValue("projectDP", project.dp);

        setCurrencyInputValue("projectInstallment", project.installment);

        setCurrencyInputValue("projectSettlement", project.settlement);

        document.getElementById("projectNotes").value =
            project.notes || "";

    } else {

        title.textContent = "Tambah Proyek";

    }


    modal.classList.add("show");

}


/* =========================================================
   CLOSE
========================================================= */

function closeProjectModal() {

    const modal =
        document.getElementById("projectModal");

    if (!modal) return;

    modal.classList.remove("show");

}


/* =========================================================
   CLIENT DROPDOWN
========================================================= */

function updateProjectClientDropdown() {

    const select =
        document.getElementById("projectClient");

    if (!select) return;

    select.innerHTML = `
        <option value="">
            Pilih Klien
        </option>
    `;


    appData.clients.forEach(client => {

        const option =
            document.createElement("option");

        option.value = client.id;

        option.textContent =
            `${client.name} — ${client.event || "Acara"}`;

        select.appendChild(option);

    });

}


function updateProjectPackageDropdown(selectedPackage = "") {
    const select = document.getElementById("projectPackage");
    if (!select) return;

    select.innerHTML = `
        <option value="">
            Pilih Paket
        </option>
    `;

    appData.packages.forEach(packageItem => {
        const option = document.createElement("option");
        option.value = packageItem.name;
        option.dataset.packageId = packageItem.id;
        option.textContent = packageItem.name;
        select.appendChild(option);
    });

    if (selectedPackage && !appData.packages.some(item => item.name === selectedPackage)) {
        const legacyOption = document.createElement("option");
        legacyOption.value = selectedPackage;
        legacyOption.textContent = `${selectedPackage} (paket lama)`;
        select.appendChild(legacyOption);
    }

    select.value = selectedPackage;
}


function updateProjectPackageDetails() {
    const select = document.getElementById("projectPackage");
    const includes = document.getElementById("projectIncludes");
    if (!select) return;

    const packageItem = appData.packages.find(item => item.name === select.value);
    if (!packageItem) return;

    setCurrencyInputValue("projectTotal", packageItem.price);
    if (includes && Array.isArray(packageItem.services) && packageItem.services.length) {
        includes.value = packageItem.services.map(service => `- ${service}`).join("\n");
    }
}


/* =========================================================
   SAVE PROJECT
========================================================= */

function saveProject(event) {

    event.preventDefault();


    const id =
        document.getElementById("projectId").value;


    const total = getCurrencyInputValue("projectTotal");

const clientId =
    document.getElementById("projectClient").value;

const projectData = {

    clientId,

    name:
        document
            .getElementById("projectName")
            .value
            .trim(),

    event:
        document
            .getElementById("projectEvent")
            .value
            .trim(),

    package:
        document
            .getElementById("projectPackage")
            .value
            .trim(),

    total,

    includes:
        document
            .getElementById("projectIncludes")
            .value
            .trim(),

    dp:
        getCurrencyInputValue("projectDP"),

    installment:
        getCurrencyInputValue("projectInstallment"),

    settlement:
        getCurrencyInputValue("projectSettlement"),

    notes:
        document
            .getElementById("projectNotes")
            .value
            .trim(),

    updatedAt:
        new Date().toISOString()
};

    /* =========================
       EDIT
    ========================== */

    if (id) {

        const index =
            appData.projects.findIndex(
                item => item.id === id
            );

        if (index !== -1) {

            appData.projects[index] = {

                ...appData.projects[index],

                ...projectData

            };

        }

    }


    /* =========================
       TAMBAH
    ========================== */

    else {

        appData.projects.push({

            id: generateProjectId(),

            ...projectData,

            createdAt:
                new Date().toISOString()

        });

    }


    saveData(
        STORAGE_KEYS.projects,
        appData.projects
    );


    renderProjects();

    updateDashboard();

    closeProjectModal();

}


/* =========================================================
   GET PROJECT PAID
========================================================= */
function getProjectPaid(project) {
    const ledgerPaid = appData.payments
        .filter(payment => payment.projectId === project.id)
        .reduce(
            (total, payment) =>
                total + (Number(payment.amount) || 0),
            0
        );

    if (ledgerPaid > 0) return ledgerPaid;

    return (Number(project.dp) || 0) +
        (Number(project.installment) || 0) +
        (Number(project.settlement) || 0);
}

/* =========================================================
   PROJECT STATUS
========================================================= */

function getProjectStatus(project) {

    const total =
        Number(project.total) || 0;

    const paid =
        getProjectPaid(project);


    if (total <= 0) {

        return "belum";

    }


    if (paid >= total) {

        return "lunas";

    }


    if (paid > 0) {

        return "proses";

    }


    return "belum";

}


/* =========================================================
   RENDER PROJECTS
========================================================= */

function renderProjects() {

    const tbody =
        document.getElementById(
            "projectsTableBody"
        );

    const empty =
        document.getElementById(
            "projectsEmpty"
        );

    const searchInput =
        document.getElementById(
            "projectSearch"
        );


    if (!tbody) return;


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const projects =
        appData.projects.filter(project => {

            const client =
                appData.clients.find(
                    item => item.id === project.clientId
                );


            const searchable = [

                project.name,

                project.event,

                project.package,

                appData.vendors
                    .filter(vendor => vendor.projectId === project.id)
                    .map(vendor => vendor.name)
                    .join(" "),

                client?.name,

                client?.phone

            ]
                .join(" ")
                .toLowerCase();


            return searchable.includes(search);

        });


    tbody.innerHTML = "";


    if (projects.length === 0) {

        empty.style.display = "flex";

        return;

    }


    empty.style.display = "none";


    projects.forEach(project => {

        const client =
            appData.clients.find(
                item => item.id === project.clientId
            );

        const projectVendors =
            appData.vendors
                .filter(vendor => vendor.projectId === project.id)
                .map(vendor => vendor.name);


        const paid =
            getProjectPaid(project);


        const remaining =
            Math.max(
                (Number(project.total) || 0) - paid,
                0
            );


        const status =
            getProjectStatus(project);


        let statusText = "Belum Bayar";

        if (status === "proses") {
            statusText = "Berjalan";
        }

        if (status === "lunas") {
            statusText = "Lunas";
        }


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>

                <div class="project-name">
                    ${escapeHTML(project.name)}
                </div>

                <span class="project-sub">
                    ${escapeHTML(project.event || "-")}
                </span>

            </td>


            <td>
                ${escapeHTML(client?.name || "-")}
            </td>


            <td>
                ${escapeHTML(project.package || "-")}
            </td>


            <td>
                ${escapeHTML(projectVendors.join(", ") || "-")}
            </td>


            <td>
                ${formatRupiah(project.total)}
            </td>


            <td class="payment-value">
                ${formatRupiah(paid)}
            </td>


            <td class="payment-remaining">
                ${formatRupiah(remaining)}
            </td>


            <td>

                <span
                    class="status-badge ${status}">

                    ${statusText}

                </span>

            </td>


            <td>

                <div class="table-actions">

                    <button
                        class="action-button"
                        onclick="openProjectModal('${project.id}')">

                        Edit

                    </button>

                    <button
                        class="action-button"
                        onclick="openProjectPaymentHistory('${project.id}')">

                        Riwayat

                    </button>

                    <button
                        class="action-button"
                        onclick="openProjectPaymentModal('${project.id}')">

                        Bayar

                    </button>


                    <button
                        class="action-button delete"
                        onclick="deleteProject('${project.id}')">

                        Hapus

                    </button>

                </div>

            </td>

        `;


        tbody.appendChild(row);

    });

}


/* =========================================================
   DELETE PROJECT
========================================================= */

function deleteProject(projectId) {

    const project =
        appData.projects.find(
            item => item.id === projectId
        );


    if (!project) return;


    if (
        !confirm(
            `Hapus proyek "${project.name}"?`
        )
    ) {

        return;

    }


    appData.projects =
        appData.projects.filter(
            item => item.id !== projectId
        );


    saveData(
        STORAGE_KEYS.projects,
        appData.projects
    );


    renderProjects();

    updateDashboard();

}


/* =========================================================
   PROJECT ID
========================================================= */

function generateProjectId() {

    return (
        "PR-" +
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 7)
    ).toUpperCase();

}


/* =========================================================
   PAYMENT MODULE
========================================================= */


/* =========================================================
   OPEN MODAL
========================================================= */

function openPaymentModal(paymentId = null) {

    const modal =
        document.getElementById("paymentModal");

    const form =
        document.getElementById("paymentForm");

    const title =
        document.getElementById("paymentModalTitle");

    if (!modal || !form) return;

    form.reset();
    document.getElementById("paymentProof").required = true;

    document.getElementById("paymentId").value = "";

    updatePaymentProjectDropdown();


    /* DEFAULT DATE */

    document.getElementById("paymentDate").value =
        new Date().toISOString().split("T")[0];


    if (paymentId) {

        const payment =
            appData.payments.find(
                item => item.id === paymentId
            );

        if (!payment) return;

        title.textContent =
            "Edit Pembayaran";

        document.getElementById("paymentId").value =
            payment.id;

        document.getElementById("paymentProject").value =
            payment.projectId || "";

        document.getElementById("paymentDate").value =
            payment.date || "";

        document.getElementById("paymentType").value =
            payment.type || "";

        setCurrencyInputValue("paymentAmount", payment.amount);
        document.getElementById("paymentProof").required = false;

        document.getElementById("paymentMethod").value =
            payment.method || "";

        document.getElementById("paymentNotes").value =
            payment.notes || "";

    } else {

        title.textContent =
            "Tambah Pembayaran";

    }

    updatePaymentAmountState();
    modal.classList.add("show");

}


/* =========================================================
   CLOSE
========================================================= */

function closePaymentModal() {

    const modal =
        document.getElementById("paymentModal");

    if (!modal) return;

    modal.classList.remove("show");

}


/* =========================================================
   PROJECT DROPDOWN
========================================================= */

function updatePaymentProjectDropdown() {

    const select =
        document.getElementById("paymentProject");

    if (!select) return;


    select.innerHTML = `
        <option value="">
            Pilih Proyek
        </option>
    `;


    appData.projects.forEach(project => {

        const client =
            appData.clients.find(
                item => item.id === project.clientId
            );


        const option =
            document.createElement("option");

        option.value =
            project.id;

        option.textContent =
            `${project.name} — ${client?.name || "Tanpa Klien"}`;

        select.appendChild(option);

    });

}


/* =========================================================
   SAVE PAYMENT
========================================================= */

async function savePayment(event) {

    event.preventDefault();


    const id =
        document.getElementById("paymentId").value;


    const proofFile = document.getElementById("paymentProof").files[0];
    const proof = await readFileAsData(proofFile);
    const paymentData = {

        projectId:
            document
                .getElementById("paymentProject")
                .value,

        date:
            document
                .getElementById("paymentDate")
                .value,

        type:
            document
                .getElementById("paymentType")
                .value,

        amount: getCurrencyInputValue("paymentAmount"),

        proof,

        method:
            document
                .getElementById("paymentMethod")
                .value,

        notes:
            document
                .getElementById("paymentNotes")
                .value
                .trim(),

        updatedAt:
            new Date().toISOString()

    };


    /* EDIT */

    if (id) {

        const index =
            appData.payments.findIndex(
                item => item.id === id
            );


        if (index !== -1) {

            appData.payments[index] = {

                ...appData.payments[index],

                ...paymentData,

                proof: proof || appData.payments[index].proof || null

            };

        }

    }


    /* TAMBAH */

    else {

        appData.payments.push({

            id:
                generatePaymentId(),

            ...paymentData,

            createdAt:
                new Date().toISOString()

        });

    }


    saveData(
        STORAGE_KEYS.payments,
        appData.payments
    );


    renderPayments();

    renderProjects();
    renderRecentPayments();

    updatePaymentSummary();

    updateDashboard();

    closePaymentModal();

}


/* =========================================================
   RENDER
========================================================= */

function renderPayments() {

    const tbody =
        document.getElementById(
            "paymentsTableBody"
        );

    const empty =
        document.getElementById(
            "paymentsEmpty"
        );

    const searchInput =
        document.getElementById(
            "paymentSearch"
        );


    if (!tbody) return;


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const payments =
        appData.payments
            .filter(payment => {

                const project =
                    appData.projects.find(
                        item =>
                            item.id === payment.projectId
                    );


                const client =
                    appData.clients.find(
                        item =>
                            item.id === project?.clientId
                    );


                const searchable = [

                    project?.name,

                    client?.name,

                    payment.type,

                    payment.method,

                    payment.notes

                ]
                    .join(" ")
                    .toLowerCase();


                return searchable.includes(search);

            })
            .sort(
                (a, b) =>
                    new Date(b.date || 0) -
                    new Date(a.date || 0)
            );


    tbody.innerHTML = "";


    if (payments.length === 0) {

        empty.style.display = "flex";

        return;

    }


    empty.style.display = "none";


    payments.forEach(payment => {

        const project =
            appData.projects.find(
                item =>
                    item.id === payment.projectId
            );


        const client =
            appData.clients.find(
                item =>
                    item.id === project?.clientId
            );


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${formatDate(payment.date)}
            </td>


            <td>

                <div class="project-name">
                    ${escapeHTML(
                        project?.name || "-"
                    )}
                </div>

            </td>


            <td>
                ${escapeHTML(
                    client?.name || "-"
                )}
            </td>


            <td>

                <span class="status-badge proses">
                    ${escapeHTML(
                        payment.type || "-"
                    )}
                </span>

            </td>


            <td class="payment-value">

                ${formatRupiah(
                    payment.amount
                )}

            </td>


            <td>
                ${escapeHTML(
                    payment.method || "-"
                )}
            </td>


            <td>
                ${payment.proof?.data
                    ? `<a class="proof-link" href="${payment.proof.data}" download="${escapeHTML(payment.proof.name || "bukti-pembayaran")}" target="_blank" rel="noopener">Download bukti</a>`
                    : "-"}
            </td>


            <td>
                ${escapeHTML(
                    payment.notes || "-"
                )}
            </td>


            <td>

                <div class="table-actions">

                    <button
                        class="action-button"
                        onclick="openPaymentModal('${payment.id}')">

                        Edit

                    </button>


                    <button
                        class="action-button delete"
                        onclick="deletePayment('${payment.id}')">

                        Hapus

                    </button>

                </div>

            </td>

        `;


        tbody.appendChild(row);

    });

}


/* =========================================================
   SUMMARY
========================================================= */

function updatePaymentSummary() {

    const total =
        appData.payments.reduce(
            (sum, item) =>
                sum +
                (Number(item.amount) || 0),
            0
        );


    const dp =
        appData.payments
            .filter(
                item => item.type === "DP"
            )
            .reduce(
                (sum, item) =>
                    sum +
                    (Number(item.amount) || 0),
                0
            );


    const installment =
        appData.payments
            .filter(
                item => item.type === "Cicilan"
            )
            .reduce(
                (sum, item) =>
                    sum +
                    (Number(item.amount) || 0),
                0
            );


    const settlement =
        appData.payments
            .filter(
                item => item.type === "Pelunasan"
            )
            .reduce(
                (sum, item) =>
                    sum +
                    (Number(item.amount) || 0),
                0
            );


    const totalElement =
        document.getElementById(
            "paymentTotal"
        );

    const dpElement =
        document.getElementById(
            "paymentDP"
        );

    const installmentElement =
        document.getElementById(
            "paymentInstallment"
        );

    const settlementElement =
        document.getElementById(
            "paymentSettlement"
        );


    if (totalElement)
        totalElement.textContent =
            formatRupiah(total);


    if (dpElement)
        dpElement.textContent =
            formatRupiah(dp);


    if (installmentElement)
        installmentElement.textContent =
            formatRupiah(installment);


    if (settlementElement)
        settlementElement.textContent =
            formatRupiah(settlement);

}


/* =========================================================
   DELETE
========================================================= */

function deletePayment(paymentId) {

    const payment =
        appData.payments.find(
            item => item.id === paymentId
        );


    if (!payment) return;


    if (
        !confirm(
            "Hapus transaksi pembayaran ini?"
        )
    ) {

        return;

    }


    appData.payments =
        appData.payments.filter(
            item => item.id !== paymentId
        );


    saveData(
        STORAGE_KEYS.payments,
        appData.payments
    );


    renderPayments();

    renderProjects();
    renderRecentPayments();

    updatePaymentSummary();

    updateDashboard();

}


/* =========================================================
   ID
========================================================= */

function generatePaymentId() {

    return (
        "PAY-" +
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 7)
    ).toUpperCase();

}


/* =========================================================
   OUTSIDE CLICK
========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const modal = document.getElementById("paymentModal");
        const packageModal = document.getElementById("packageModal");


        if (
            modal &&
            event.target === modal
        ) {

            closePaymentModal();

        }

        if (packageModal && event.target === packageModal) {
            closePackageModal();
        }

        const vendorModal = document.getElementById("vendorModal");
        if (vendorModal && event.target === vendorModal) {
            closeVendorModal();
        }

        const vendorPaymentModal = document.getElementById("vendorPaymentModal");
        if (vendorPaymentModal && event.target === vendorPaymentModal) {
            closeVendorPaymentModal();
        }

        const vendorHistoryModal = document.getElementById("vendorHistoryModal");
        if (vendorHistoryModal && event.target === vendorHistoryModal) {
            closeVendorHistoryModal();
        }

        const projectPaymentHistoryModal = document.getElementById("projectPaymentHistoryModal");
        if (projectPaymentHistoryModal && event.target === projectPaymentHistoryModal) {
            closeProjectPaymentHistory();
        }

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        renderPayments();

        updatePaymentSummary();

        renderPackages();

        renderVendors();

        const yearSelect = document.getElementById("financeYear");
        if (yearSelect) {
            const years = new Set(getFinanceTransactions().map(item => item.date?.slice(0, 4)).filter(Boolean));
            years.add(String(new Date().getFullYear()));
            yearSelect.innerHTML = [...years].sort().reverse().map(year => `<option value="${year}">${year}</option>`).join("");
        }
        renderFinanceReport();

        document.querySelectorAll(".currency-input input").forEach(input => {
            input.addEventListener("input", formatCurrencyInput);
        });

    }
);

/* =========================================================
   CONNECTED WORKFLOW OVERRIDES
   Project packages -> vendors -> invoices -> schedules/checklist
========================================================= */

let clientStatusFilter = "aktif";
let projectStatusFilter = "aktif";
let invoiceStatusFilter = "all";
let checklistStatusFilter = "all";
let calendarCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

function normalizeConnectedData() {
    appData.vendorCatalog = Array.isArray(appData.vendorCatalog) ? appData.vendorCatalog : [];

    appData.clients.forEach(client => {
        if (!client.status) {
            const linkedProject = appData.projects.find(project => project.clientId === client.id && project.eventStatus);
            client.status = linkedProject?.eventStatus || "aktif";
        }
    });

    appData.vendors.forEach(vendor => {
        if (!vendor.vendorMasterId && vendor.name) {
            let master = appData.vendorCatalog.find(item => item.name.toLowerCase() === vendor.name.toLowerCase());
            if (!master) {
                master = { id: `VM-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase(), name: vendor.name, category: "", contact: "" };
                appData.vendorCatalog.push(master);
            }
            vendor.vendorMasterId = master.id;
        }
        vendor.type = vendor.type || "utama";
    });

    appData.projects.forEach(project => {
        if (!Array.isArray(project.packages)) {
            project.packages = project.package
                ? [{ packageId: "", name: project.package, price: Number(project.packagePrice) || Number(project.total) || 0 }]
                : [];
        }
        project.additionals = Array.isArray(project.additionals) ? project.additionals : [];
        project.discount = Number(project.discount) || 0;
        const client = appData.clients.find(item => item.id === project.clientId);
        project.eventStatus = client?.status || project.eventStatus || "aktif";
    });

    appData.schedules.forEach(schedule => {
        if (typeof schedule.completed !== "boolean") {
            const tasks = Array.isArray(schedule.tasks) ? schedule.tasks : [];
            schedule.completed = tasks.length > 0 && tasks.every(task => task.completed);
        }
    });

    saveData(STORAGE_KEYS.vendorCatalog, appData.vendorCatalog);
    saveData(STORAGE_KEYS.clients, appData.clients);
    saveData(STORAGE_KEYS.vendors, appData.vendors);
    saveData(STORAGE_KEYS.projects, appData.projects);
    saveData(STORAGE_KEYS.schedules, appData.schedules);
}

function getProjectPackages(project) {
    if (Array.isArray(project?.packages) && project.packages.length) return project.packages;
    return project?.package ? [{ name: project.package, price: Number(project.packagePrice) || Number(project.total) || 0 }] : [];
}

function getProjectAdditionals(project) {
    return Array.isArray(project?.additionals) ? project.additionals : [];
}

function addProjectPackageRow(packageData = {}) {
    const container = document.getElementById("projectPackagesContainer");
    if (!container) return;
    const row = document.createElement("div");
    row.className = "additional-row project-package-row";
    const selectedId = packageData.packageId || "";
    const selectedName = packageData.name || "";
    const options = appData.packages.map(item => `<option value="${escapeHTML(item.id)}" ${item.id === selectedId || (!selectedId && item.name === selectedName) ? "selected" : ""}>${escapeHTML(item.name)}</option>`).join("");
    const hasLegacy = selectedName && !appData.packages.some(item => item.id === selectedId || item.name === selectedName);
    row.innerHTML = `
        <select class="project-package-select" onchange="onProjectPackageRowChange(this)" required>
            <option value="">Pilih Paket</option>${options}
            ${hasLegacy ? `<option value="legacy:${escapeHTML(selectedName)}" selected>${escapeHTML(selectedName)} (data lama)</option>` : ""}
        </select>
        <div class="currency-input"><span>Rp</span><input class="project-package-price" type="text" inputmode="numeric" value="${Number(packageData.price) ? Number(packageData.price).toLocaleString("id-ID") : ""}" placeholder="Harga dasar" oninput="formatCurrencyInput(event); calculateProjectModalTotal()" required></div>
        <button type="button" class="action-button delete" onclick="removeProjectPackageRow(this)">Hapus</button>`;
    container.appendChild(row);
    calculateProjectModalTotal();
}

function onProjectPackageRowChange(select) {
    const item = appData.packages.find(packageItem => packageItem.id === select.value);
    const priceInput = select.closest(".project-package-row")?.querySelector(".project-package-price");
    if (item && priceInput) priceInput.value = Number(item.price || 0).toLocaleString("id-ID");
    calculateProjectModalTotal();
}

function removeProjectPackageRow(button) {
    const container = document.getElementById("projectPackagesContainer");
    button.closest(".project-package-row")?.remove();
    if (container && !container.children.length) addProjectPackageRow();
    calculateProjectModalTotal();
}

function addProjectAdditionalRow(item = {}) {
    const container = document.getElementById("projectAdditionalContainer");
    if (!container) return;
    const row = document.createElement("div");
    row.className = "additional-row project-additional-row";
    row.innerHTML = `
        <input class="additional-name" type="text" value="${escapeHTML(item.name || "")}" placeholder="Nama additional, contoh: Photobooth" oninput="updateProjectIncludes()" required>
        <div class="currency-input"><span>Rp</span><input class="additional-price" type="text" inputmode="numeric" value="${Number(item.amount) ? Number(item.amount).toLocaleString("id-ID") : ""}" placeholder="Nominal" oninput="formatCurrencyInput(event); calculateProjectModalTotal()" required></div>
        <button type="button" class="action-button delete" onclick="this.closest('.project-additional-row').remove(); calculateProjectModalTotal()">Hapus</button>`;
    container.appendChild(row);
    calculateProjectModalTotal();
}

function collectProjectPackages() {
    return [...document.querySelectorAll(".project-package-row")].map(row => {
        const select = row.querySelector(".project-package-select");
        const packageItem = appData.packages.find(item => item.id === select.value);
        const legacyName = select.value.startsWith("legacy:") ? select.value.slice(7) : "";
        return { packageId: packageItem?.id || "", name: packageItem?.name || legacyName, price: parseRupiah(row.querySelector(".project-package-price")?.value) };
    }).filter(item => item.name);
}

function collectProjectAdditionals() {
    return [...document.querySelectorAll(".project-additional-row")].map(row => ({
        name: row.querySelector(".additional-name")?.value.trim() || "",
        amount: parseRupiah(row.querySelector(".additional-price")?.value)
    })).filter(item => item.name);
}

function updateProjectIncludes() {
    const packageSections = [...document.querySelectorAll(".project-package-row")].map(row => {
        const select = row.querySelector(".project-package-select");
        const packageItem = appData.packages.find(item => item.id === select?.value);
        if (!packageItem) return "";
        const services = Array.isArray(packageItem.services)
            ? packageItem.services.filter(Boolean)
            : [];
        return [`Paket ${packageItem.name}`, ...services.map(service => `- ${service}`)].join("\n");
    }).filter(Boolean);

    const additionalLines = [...document.querySelectorAll(".project-additional-row")]
        .map(row => row.querySelector(".additional-name")?.value.trim())
        .filter(Boolean)
        .map(name => `- ${name}`);

    const packageField = document.getElementById("projectPackageIncludes");
    const additionalField = document.getElementById("projectAdditionalIncludes");
    if (packageField) packageField.value = packageSections.join("\n\n");
    if (additionalField) additionalField.value = additionalLines.join("\n");
}

function calculateProjectModalTotal() {
    const packageTotal = [...document.querySelectorAll(".project-package-price")].reduce((sum, input) => sum + parseRupiah(input.value), 0);
    const additionalTotal = [...document.querySelectorAll(".additional-price")].reduce((sum, input) => sum + parseRupiah(input.value), 0);
    const discount = getCurrencyInputValue("projectDiscount");
    const total = Math.max(packageTotal + additionalTotal - discount, 0);
    const hidden = document.getElementById("projectTotal");
    if (hidden) hidden.value = total;
    if (document.getElementById("projectSummaryPackage")) document.getElementById("projectSummaryPackage").textContent = formatRupiah(packageTotal);
    if (document.getElementById("projectSummaryAdditional")) document.getElementById("projectSummaryAdditional").textContent = `+ ${formatRupiah(additionalTotal)}`;
    if (document.getElementById("projectSummaryDiscount")) document.getElementById("projectSummaryDiscount").textContent = `- ${formatRupiah(discount)}`;
    if (document.getElementById("projectSummaryTotal")) document.getElementById("projectSummaryTotal").textContent = formatRupiah(total);
    updateProjectIncludes();
    return total;
}

function updateProjectPackageDetails() { calculateProjectModalTotal(); }

function onProjectClientChange() {
    const client = appData.clients.find(item => item.id === document.getElementById("projectClient")?.value);
    if (!client) return;
    const status = document.getElementById("projectEventStatus");
    const event = document.getElementById("projectEvent");
    if (status) status.value = client.status || "aktif";
    if (event && !event.value.trim()) event.value = client.event || "";
}

function openProjectModal(projectId = null) {
    const modal = document.getElementById("projectModal");
    const form = document.getElementById("projectForm");
    if (!modal || !form) return;
    form.reset();
    document.getElementById("projectId").value = "";
    document.getElementById("projectPackagesContainer").innerHTML = "";
    document.getElementById("projectAdditionalContainer").innerHTML = "";
    updateProjectClientDropdown();

    const project = projectId ? appData.projects.find(item => item.id === projectId) : null;
    document.getElementById("projectModalTitle").textContent = project ? "Edit Proyek" : "Tambah Proyek";
    if (project) {
        document.getElementById("projectId").value = project.id;
        document.getElementById("projectClient").value = project.clientId || "";
        document.getElementById("projectName").value = project.name || "";
        document.getElementById("projectEvent").value = project.event || "";
        const client = appData.clients.find(item => item.id === project.clientId);
        document.getElementById("projectEventStatus").value = client?.status || project.eventStatus || "aktif";
        setCurrencyInputValue("projectDiscount", project.discount);
        document.getElementById("projectNotes").value = project.notes || "";
        getProjectPackages(project).forEach(addProjectPackageRow);
        getProjectAdditionals(project).forEach(addProjectAdditionalRow);
    } else {
        addProjectPackageRow();
    }
    calculateProjectModalTotal();
    if (project) {
        const packageField = document.getElementById("projectPackageIncludes");
        const additionalField = document.getElementById("projectAdditionalIncludes");
        if (packageField && !packageField.value) packageField.value = project.packageIncludes || project.includes || "";
        if (additionalField && !additionalField.value) additionalField.value = project.additionalIncludes || "";
    }
    modal.classList.add("show");
}

function saveProject(event) {
    event.preventDefault();
    const id = document.getElementById("projectId").value;
    const packages = collectProjectPackages();
    if (!packages.length) return alert("Pilih minimal satu paket.");
    const additionals = collectProjectAdditionals();
    const eventStatus = document.getElementById("projectEventStatus").value;
    const packageIncludes = document.getElementById("projectPackageIncludes").value.trim();
    const additionalIncludes = document.getElementById("projectAdditionalIncludes").value.trim();
    const projectData = {
        clientId: document.getElementById("projectClient").value,
        name: document.getElementById("projectName").value.trim(),
        event: document.getElementById("projectEvent").value.trim(),
        eventStatus,
        packages,
        package: packages.map(item => item.name).join(", "),
        packagePrice: packages.reduce((sum, item) => sum + Number(item.price || 0), 0),
        additionals,
        discount: getCurrencyInputValue("projectDiscount"),
        total: calculateProjectModalTotal(),
        packageIncludes,
        additionalIncludes,
        includes: [packageIncludes, additionalIncludes].filter(Boolean).join("\n\nAdditional:\n"),
        notes: document.getElementById("projectNotes").value.trim(),
        updatedAt: new Date().toISOString()
    };
    if (id) {
        const index = appData.projects.findIndex(item => item.id === id);
        if (index >= 0) appData.projects[index] = { ...appData.projects[index], ...projectData };
    } else {
        appData.projects.push({ id: generateProjectId(), ...projectData, createdAt: new Date().toISOString() });
    }

    const client = appData.clients.find(item => item.id === projectData.clientId);
    if (client) {
        client.status = eventStatus;
        client.updatedAt = new Date().toISOString();
        appData.projects.forEach(project => {
            if (project.clientId === client.id) project.eventStatus = eventStatus;
        });
        saveData(STORAGE_KEYS.clients, appData.clients);
    }
    saveData(STORAGE_KEYS.projects, appData.projects);
    closeProjectModal();
    renderClients(); renderProjects(); renderInvoices(); renderScheduleViews(); updateDashboard();
}

function setProjectStatusFilter(status) {
    projectStatusFilter = status;
    document.querySelectorAll("#projectStatusTabs .filter-tab").forEach(button => button.classList.toggle("active", button.getAttribute("onclick")?.includes(`'${status}'`)));
    renderProjects();
}

function renderProjects() {
    const tbody = document.getElementById("projectsTableBody");
    const empty = document.getElementById("projectsEmpty");
    if (!tbody) return;
    const search = (document.getElementById("projectSearch")?.value || "").toLowerCase().trim();
    const projects = appData.projects.filter(project => {
        const client = appData.clients.find(item => item.id === project.clientId);
        const vendors = appData.vendors.filter(item => item.projectId === project.id).map(item => item.name).join(" ");
        const statusMatch = projectStatusFilter === "all" || (project.eventStatus || "aktif") === projectStatusFilter;
        return statusMatch && `${project.name} ${project.event} ${getProjectPackages(project).map(item => item.name).join(" ")} ${client?.name || ""} ${vendors}`.toLowerCase().includes(search);
    });
    tbody.innerHTML = projects.map(project => {
        const client = appData.clients.find(item => item.id === project.clientId);
        const paid = getProjectPaid(project);
        const remaining = Math.max(Number(project.total || 0) - paid, 0);
        const payStatus = getProjectStatus(project);
        const statusText = payStatus === "lunas" ? "Lunas" : payStatus === "proses" ? "Sebagian" : "Belum Bayar";
        const eventStatus = project.eventStatus || "aktif";
        const eventText = eventStatus === "selesai" ? "Selesai" : eventStatus === "cancel" ? "Cancel" : "Aktif";
        return `<tr>
            <td><div class="project-name">${escapeHTML(project.name)}</div><span class="project-sub">${escapeHTML(project.event || "-")}</span></td>
            <td>${escapeHTML(client?.name || "-")}</td>
            <td>${getProjectPackages(project).map(item => `<span class="item-pill">${escapeHTML(item.name)} · ${formatRupiah(item.price)}</span>`).join("") || "-"}</td>
            <td>${formatRupiah(project.total)}</td><td class="payment-value">${formatRupiah(paid)}</td><td class="payment-remaining">${formatRupiah(remaining)}</td>
            <td><span class="status-badge ${payStatus}">${statusText}</span></td><td><span class="status-badge ${eventStatus === "selesai" ? "lunas" : eventStatus === "cancel" ? "belum" : "proses"}">${eventText}</span></td>
            <td><div class="table-actions"><button class="action-button" onclick="openProjectModal('${project.id}')">Edit</button><button class="action-button" onclick="openProjectPaymentHistory('${project.id}')">Riwayat</button><button class="action-button" onclick="openProjectPaymentModal('${project.id}')">Bayar</button><button class="action-button delete" onclick="deleteProject('${project.id}')">Hapus</button></div></td>
        </tr>`;
    }).join("");
    if (empty) empty.style.display = projects.length ? "none" : "flex";
}

/* Vendor master and project vendor assignment */
function openVendorMasterModal(id = null) {
    const form = document.getElementById("vendorMasterForm");
    form?.reset();
    const item = id ? appData.vendorCatalog.find(vendor => vendor.id === id) : null;
    document.getElementById("vendorMasterId").value = item?.id || "";
    document.getElementById("vendorMasterName").value = item?.name || "";
    document.getElementById("vendorMasterCategory").value = item?.category || "";
    document.getElementById("vendorMasterContact").value = item?.contact || "";
    document.getElementById("vendorMasterModalTitle").textContent = item ? "Edit Nama Vendor" : "Tambah Nama Vendor";
    document.getElementById("vendorMasterModal")?.classList.add("show");
}
function closeVendorMasterModal() { document.getElementById("vendorMasterModal")?.classList.remove("show"); }
function saveVendorMaster(event) {
    event.preventDefault();
    const id = document.getElementById("vendorMasterId").value;
    const data = { id: id || `VM-${Date.now().toString(36)}`.toUpperCase(), name: document.getElementById("vendorMasterName").value.trim(), category: document.getElementById("vendorMasterCategory").value.trim(), contact: document.getElementById("vendorMasterContact").value.trim() };
    const index = appData.vendorCatalog.findIndex(item => item.id === id);
    if (index >= 0) appData.vendorCatalog[index] = data; else appData.vendorCatalog.push(data);
    saveData(STORAGE_KEYS.vendorCatalog, appData.vendorCatalog); closeVendorMasterModal(); renderVendorMasters();
}
function deleteVendorMaster(id) {
    const item = appData.vendorCatalog.find(vendor => vendor.id === id);
    if (!item || !confirm(`Hapus nama vendor "${item.name}" dari daftar?`)) return;
    if (appData.vendors.some(vendor => vendor.vendorMasterId === id)) return alert("Vendor ini masih dipakai pada proyek dan belum bisa dihapus.");
    appData.vendorCatalog = appData.vendorCatalog.filter(vendor => vendor.id !== id);
    saveData(STORAGE_KEYS.vendorCatalog, appData.vendorCatalog); renderVendorMasters();
}
function renderVendorMasters() {
    const list = document.getElementById("vendorMasterList");
    const empty = document.getElementById("vendorMasterEmpty");
    if (!list) return;
    list.innerHTML = appData.vendorCatalog.map(item => `<div class="vendor-master-item"><div><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(item.category || "Tanpa kategori")}${item.contact ? ` · ${escapeHTML(item.contact)}` : ""}</span></div><div class="table-actions"><button class="action-button" onclick="openVendorMasterModal('${item.id}')">Edit</button><button class="action-button delete" onclick="deleteVendorMaster('${item.id}')">Hapus</button></div></div>`).join("");
    if (empty) empty.style.display = appData.vendorCatalog.length ? "none" : "flex";
}
function updateVendorNameDropdown(selectedId = "") {
    const select = document.getElementById("vendorName");
    if (!select) return;
    select.innerHTML = `<option value="">Pilih Nama Vendor</option>${appData.vendorCatalog.map(item => `<option value="${escapeHTML(item.id)}" ${item.id === selectedId ? "selected" : ""}>${escapeHTML(item.name)}${item.category ? ` — ${escapeHTML(item.category)}` : ""}</option>`).join("")}`;
}
function openVendorModal(vendorId = null) {
    const form = document.getElementById("vendorForm"); form?.reset();
    const vendor = vendorId ? appData.vendors.find(item => item.id === vendorId) : null;
    document.getElementById("vendorId").value = vendor?.id || "";
    updateVendorProjectDropdown(vendor?.projectId || "");
    updateVendorNameDropdown(vendor?.vendorMasterId || "");
    if (vendor) {
        setCurrencyInputValue("vendorCost", vendor.cost);
        document.getElementById("vendorType").value = vendor.type || "utama";
        document.getElementById("vendorNotes").value = vendor.notes || "";
    }
    document.getElementById("vendorModalTitle").textContent = vendor ? "Edit Vendor Proyek" : "Tambah Vendor Proyek";
    if (!appData.vendorCatalog.length) alert("Tambahkan nama vendor di menu Setting terlebih dahulu.");
    document.getElementById("vendorModal")?.classList.add("show");
}
function saveVendor(event) {
    event.preventDefault();
    const id = document.getElementById("vendorId").value;
    const masterId = document.getElementById("vendorName").value;
    const master = appData.vendorCatalog.find(item => item.id === masterId);
    if (!master) return alert("Pilih nama vendor dari daftar Setting.");
    const existing = appData.vendors.find(item => item.id === id);
    const data = { id: id || `vendor_${Date.now()}`, vendorMasterId: masterId, name: master.name, projectId: document.getElementById("vendorProject").value, type: document.getElementById("vendorType").value, cost: getCurrencyInputValue("vendorCost"), notes: document.getElementById("vendorNotes").value.trim(), createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    const index = appData.vendors.findIndex(item => item.id === id);
    if (index >= 0) appData.vendors[index] = { ...existing, ...data }; else appData.vendors.push(data);
    saveData(STORAGE_KEYS.vendors, appData.vendors); closeVendorModal(); renderVendors(); renderProjects();
}
function renderVendors() {
    const body = document.getElementById("vendorsTableBody"), empty = document.getElementById("vendorsEmpty");
    if (!body) return;
    let totalCost = 0, totalRemaining = 0;
    body.innerHTML = appData.vendors.map(vendor => {
        const paid = appData.vendorPayments.filter(item => item.vendorId === vendor.id).reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const remaining = Math.max(Number(vendor.cost || 0) - paid, 0); totalCost += Number(vendor.cost || 0); totalRemaining += remaining;
        const project = appData.projects.find(item => item.id === vendor.projectId);
        return `<tr><td><strong>${escapeHTML(vendor.name)}</strong><span class="client-sub"><span class="status-badge ${vendor.type === "additional" ? "proses" : "lunas"}">${vendor.type === "additional" ? "Additional" : "Utama"}</span> ${escapeHTML(vendor.notes || "-")}</span></td><td>${escapeHTML(project?.name || "-")}</td><td>${formatRupiah(vendor.cost)}</td><td class="payment-value">${formatRupiah(paid)}</td><td class="payment-remaining">${formatRupiah(remaining)}</td><td><div class="table-actions"><button class="action-button" onclick="openVendorModal('${vendor.id}')">Edit</button><button class="action-button" onclick="openVendorPaymentModal('${vendor.id}')">Bayar</button><button class="action-button" onclick="openVendorHistoryModal('${vendor.id}')">Riwayat</button><button class="action-button delete" onclick="deleteVendor('${vendor.id}')">Hapus</button></div></td></tr>`;
    }).join("");
    if (document.getElementById("totalVendors")) document.getElementById("totalVendors").textContent = appData.vendors.length;
    if (document.getElementById("totalVendorCost")) document.getElementById("totalVendorCost").textContent = formatRupiah(totalCost);
    if (document.getElementById("totalVendorRemaining")) document.getElementById("totalVendorRemaining").textContent = formatRupiah(totalRemaining);
    if (empty) empty.style.display = appData.vendors.length ? "none" : "flex";
}

/* Payments: settlement always equals the exact remaining balance. */
function updatePaymentAmountState() {
    const projectId = document.getElementById("paymentProject")?.value;
    const type = document.getElementById("paymentType")?.value;
    const input = document.getElementById("paymentAmount");
    if (!input) return;
    if (type !== "Pelunasan" || !projectId) { input.readOnly = false; input.classList.remove("input-locked"); return; }
    const project = appData.projects.find(item => item.id === projectId);
    const editingId = document.getElementById("paymentId")?.value;
    const ledgerOther = appData.payments.filter(item => item.projectId === projectId && item.id !== editingId).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const hasLedger = appData.payments.some(item => item.projectId === projectId);
    const legacyPaid = hasLedger ? 0 : (Number(project?.dp) || 0) + (Number(project?.installment) || 0) + (Number(project?.settlement) || 0);
    const remaining = Math.max(Number(project?.total || 0) - ledgerOther - legacyPaid, 0);
    input.value = remaining.toLocaleString("id-ID"); input.readOnly = true; input.classList.add("input-locked");
}
function openProjectPaymentModal(projectId) { openPaymentModal(); document.getElementById("paymentProject").value = projectId; updatePaymentAmountState(); }

/* Automatic invoice register: one invoice per project, due date editable. */
function getInvoiceMeta(project) {
    return appData.invoices.find(item => item.projectId === project.id) || { id: `INV-${project.id}`, projectId: project.id, number: `INV-${String(project.createdAt || "").slice(0, 10).replace(/-/g, "") || new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${project.id.slice(-4)}`, date: String(project.createdAt || new Date().toISOString()).slice(0, 10), dueDate: "", bankInfo: "", notes: "" };
}
function getInvoiceStatus(project) { const paid = getProjectPaid(project), total = Number(project.total || 0); return total > 0 && paid >= total ? "lunas" : paid > 0 ? "sebagian" : "belum"; }
function setInvoiceStatusFilter(status) {
    invoiceStatusFilter = status;
    document.querySelectorAll("#invoiceStatusTabs .filter-tab").forEach(button => button.classList.toggle("active", button.getAttribute("onclick")?.includes(`'${status}'`)));
    renderInvoices();
}
function renderInvoices() {
    const body = document.getElementById("invoicesTableBody"), empty = document.getElementById("invoicesEmpty"); if (!body) return;
    const search = (document.getElementById("invoiceSearch")?.value || "").toLowerCase().trim();
    const rows = appData.projects.filter(project => {
        const client = appData.clients.find(item => item.id === project.clientId), meta = getInvoiceMeta(project), status = getInvoiceStatus(project);
        return (invoiceStatusFilter === "all" || status === invoiceStatusFilter) && `${meta.number} ${project.name} ${client?.name || ""}`.toLowerCase().includes(search);
    });
    body.innerHTML = rows.map(project => {
        const client = appData.clients.find(item => item.id === project.clientId), meta = getInvoiceMeta(project), paid = getProjectPaid(project), remaining = Math.max(Number(project.total || 0) - paid, 0), status = getInvoiceStatus(project);
        const label = status === "lunas" ? "Lunas" : status === "sebagian" ? "Sebagian" : "Belum Bayar";
        return `<tr><td><strong>${escapeHTML(meta.number)}</strong></td><td>${escapeHTML(project.name)}</td><td>${escapeHTML(client?.name || "-")}</td><td>${formatDate(meta.date)}</td><td>${meta.dueDate ? formatDate(meta.dueDate) : "Belum diatur"}</td><td>${formatRupiah(project.total)}</td><td class="payment-value">${formatRupiah(paid)}</td><td class="payment-remaining">${formatRupiah(remaining)}</td><td><span class="status-badge ${status === "sebagian" ? "proses" : status}">${label}</span></td><td><div class="table-actions"><button class="action-button" onclick="openInvoiceModal('${project.id}')">Edit Jatuh Tempo</button><button class="action-button" onclick="viewInvoice('${project.id}')">Lihat</button><button class="action-button" onclick="downloadInvoicePDF('${project.id}')">Download PDF</button></div></td></tr>`;
    }).join("");
    const statuses = appData.projects.map(getInvoiceStatus);
    if (document.getElementById("totalInvoicesCount")) document.getElementById("totalInvoicesCount").textContent = appData.projects.length;
    if (document.getElementById("totalInvoicesPaidCount")) document.getElementById("totalInvoicesPaidCount").textContent = statuses.filter(item => item === "lunas").length;
    if (document.getElementById("totalInvoicesUnpaidCount")) document.getElementById("totalInvoicesUnpaidCount").textContent = statuses.filter(item => item !== "lunas").length;
    if (document.getElementById("totalInvoicesAmount")) document.getElementById("totalInvoicesAmount").textContent = formatRupiah(appData.projects.reduce((sum, item) => sum + Number(item.total || 0), 0));
    if (empty) empty.style.display = rows.length ? "none" : "flex";
}
function populateInvoiceProjects(selected = "") {
    const select = document.getElementById("invoiceProject"); if (!select) return;
    select.innerHTML = `<option value="">Pilih Proyek</option>${appData.projects.map(project => { const client = appData.clients.find(item => item.id === project.clientId); return `<option value="${project.id}" ${project.id === selected ? "selected" : ""}>${escapeHTML(project.name)} — ${escapeHTML(client?.name || "Tanpa klien")}</option>`; }).join("")}`;
}
function openInvoiceModal(projectId = "") {
    const project = appData.projects.find(item => item.id === projectId); if (!project) return;
    const meta = getInvoiceMeta(project); document.getElementById("invoiceForm")?.reset(); populateInvoiceProjects(projectId);
    document.getElementById("invoiceProject").disabled = true; document.getElementById("invoiceId").value = meta.id;
    document.getElementById("invoiceNumber").value = meta.number; document.getElementById("invoiceNumber").readOnly = true;
    document.getElementById("invoiceDate").value = meta.date; document.getElementById("invoiceDate").readOnly = true;
    document.getElementById("invoiceDueDate").value = meta.dueDate || ""; document.getElementById("invoiceBankInfo").value = meta.bankInfo || ""; document.getElementById("invoiceNotes").value = meta.notes || "";
    document.getElementById("invoiceModalTitle").textContent = "Edit Invoice & Jatuh Tempo"; onInvoiceProjectChange(); document.getElementById("invoiceModal")?.classList.add("show");
}
function closeInvoiceModal() { const select = document.getElementById("invoiceProject"); if (select) select.disabled = false; document.getElementById("invoiceModal")?.classList.remove("show"); }
function onInvoiceProjectChange() {
    const project = appData.projects.find(item => item.id === document.getElementById("invoiceProject")?.value); if (!project) return;
    const client = appData.clients.find(item => item.id === project.clientId), paid = getProjectPaid(project), remaining = Math.max(Number(project.total || 0) - paid, 0);
    document.getElementById("invoiceClientPreview").innerHTML = `<strong>${escapeHTML(client?.name || "-")}</strong><span>${escapeHTML(project.name)} · ${getProjectPackages(project).map(item => escapeHTML(item.name)).join(", ")}</span>`;
    const packageTotal = getProjectPackages(project).reduce((sum, item) => sum + Number(item.price || 0), 0), additionalTotal = getProjectAdditionals(project).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    document.getElementById("invSummaryPackage").textContent = formatRupiah(packageTotal); document.getElementById("invSummaryAdditional").textContent = `+ ${formatRupiah(additionalTotal)}`; document.getElementById("invSummaryDiscount").textContent = `- ${formatRupiah(project.discount)}`; document.getElementById("invSummaryTotal").textContent = formatRupiah(project.total); document.getElementById("invSummaryPaid").textContent = formatRupiah(paid); document.getElementById("invSummaryRemaining").textContent = formatRupiah(remaining);
}
function saveInvoice(event) {
    event.preventDefault(); const projectId = document.getElementById("invoiceProject").value, project = appData.projects.find(item => item.id === projectId); if (!project) return;
    const old = getInvoiceMeta(project), data = { ...old, id: old.id, projectId, number: old.number, date: old.date, dueDate: document.getElementById("invoiceDueDate").value, bankInfo: document.getElementById("invoiceBankInfo").value.trim(), notes: document.getElementById("invoiceNotes").value.trim(), updatedAt: new Date().toISOString() };
    const index = appData.invoices.findIndex(item => item.projectId === projectId); if (index >= 0) appData.invoices[index] = data; else appData.invoices.push(data);
    saveData(STORAGE_KEYS.invoices, appData.invoices); closeInvoiceModal(); renderInvoices();
}
function viewInvoice(projectId) {
    const project = appData.projects.find(item => item.id === projectId); if (!project) return; const client = appData.clients.find(item => item.id === project.clientId), meta = getInvoiceMeta(project), paid = getProjectPaid(project), remaining = Math.max(Number(project.total || 0) - paid, 0);
    document.getElementById("invoicePrintArea").innerHTML = `<div class="invoice-document"><div class="invoice-doc-header"><div><span class="eyebrow">INVOICE</span><h2>${escapeHTML(meta.number)}</h2></div><div><strong>Tanggal</strong><p>${formatDate(meta.date)}</p><strong>Jatuh tempo</strong><p>${meta.dueDate ? formatDate(meta.dueDate) : "Belum diatur"}</p></div></div><div class="invoice-party"><span>Ditagihkan kepada</span><h3>${escapeHTML(client?.name || "-")}</h3><p>${escapeHTML(project.name)}</p></div><table class="data-table"><thead><tr><th>Rincian</th><th>Jenis</th><th>Nominal</th></tr></thead><tbody>${getProjectPackages(project).map(item => `<tr><td>${escapeHTML(item.name)}</td><td>Paket</td><td>${formatRupiah(item.price)}</td></tr>`).join("")}${getProjectAdditionals(project).map(item => `<tr><td>${escapeHTML(item.name)}</td><td>Additional</td><td>${formatRupiah(item.amount)}</td></tr>`).join("")}${project.discount ? `<tr><td>Potongan harga</td><td>Diskon</td><td>- ${formatRupiah(project.discount)}</td></tr>` : ""}</tbody></table><div class="invoice-totals"><p>Total <strong>${formatRupiah(project.total)}</strong></p><p>Terbayar <strong>${formatRupiah(paid)}</strong></p><p>Sisa <strong>${formatRupiah(remaining)}</strong></p></div>${meta.bankInfo ? `<p><strong>Pembayaran:</strong> ${escapeHTML(meta.bankInfo)}</p>` : ""}${meta.notes ? `<p>${escapeHTML(meta.notes)}</p>` : ""}</div>`;
    const modal = document.getElementById("invoiceViewModal");
    if (modal) {
        modal.dataset.invoiceNumber = meta.number;
        modal.dataset.projectId = project.id;
        modal.classList.add("show");
    }
}
function closeInvoiceViewModal() { document.getElementById("invoiceViewModal")?.classList.remove("show"); }

function toPdfAscii(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\x20-\x7E]/g, "-")
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");
}

function wrapPdfText(value, maxLength = 72) {
    const result = [];
    String(value ?? "").split(/\r?\n/).forEach(paragraph => {
        const words = paragraph.trim().split(/\s+/).filter(Boolean);
        if (!words.length) { result.push(""); return; }
        let line = "";
        words.forEach(word => {
            const candidate = line ? `${line} ${word}` : word;
            if (candidate.length > maxLength && line) {
                result.push(line);
                line = word;
            } else {
                line = candidate;
            }
        });
        if (line) result.push(line);
    });
    return result;
}

function buildInvoicePdf(projectId) {
    const project = appData.projects.find(item => item.id === projectId);
    if (!project) throw new Error("Proyek invoice tidak ditemukan.");
    const client = appData.clients.find(item => item.id === project.clientId);
    const meta = getInvoiceMeta(project);
    const paid = getProjectPaid(project);
    const remaining = Math.max(Number(project.total || 0) - paid, 0);
    const items = [
        ...getProjectPackages(project).map(item => ({ name: item.name, type: "Paket", amount: item.price })),
        ...getProjectAdditionals(project).map(item => ({ name: item.name, type: "Additional", amount: item.amount }))
    ];
    if (project.discount) {
        items.push({ name: "Diskon keseluruhan", type: "Diskon", amount: -Number(project.discount || 0) });
    }

    if (!items.length) items.push({ name: "Biaya proyek", type: "Proyek", amount: Number(project.total || 0) });
    const itemsPerPage = 9;
    const itemPages = [];
    for (let index = 0; index < items.length; index += itemsPerPage) {
        itemPages.push(items.slice(index, index + itemsPerPage));
    }

    const pages = itemPages.map(() => []);
    const navy = [0.055, 0.09, 0.16];
    const slate = [0.28, 0.33, 0.4];
    const muted = [0.43, 0.48, 0.55];
    const light = [0.96, 0.97, 0.98];
    const border = [0.86, 0.88, 0.91];
    const accent = [0.82, 0.62, 0.25];
    const white = [1, 1, 1];
    const status = remaining <= 0
        ? { label: "LUNAS", color: [0.08, 0.55, 0.32], background: [0.88, 0.97, 0.92] }
        : paid > 0
            ? { label: "TERBAYAR SEBAGIAN", color: [0.75, 0.43, 0.04], background: [1, 0.95, 0.83] }
            : { label: "BELUM BAYAR", color: [0.75, 0.15, 0.16], background: [1, 0.91, 0.91] };

    const color = values => values.join(" ");
    const textWidth = (text, size, bold = false) => toPdfAscii(text).replace(/\\[()\\]/g, "x").length * size * (bold ? 0.56 : 0.51);
    const drawText = (page, text, x, y, size = 10, options = {}) => {
        const font = options.bold ? "F2" : "F1";
        const textColor = options.color || navy;
        page.push(`${color(textColor)} rg BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${toPdfAscii(text)}) Tj ET`);
    };
    const drawRightText = (page, text, rightX, y, size = 10, options = {}) => {
        drawText(page, text, Math.max(42, rightX - textWidth(text, size, options.bold)), y, size, options);
    };
    const fillRect = (page, x, y, width, height, fillColor) => {
        page.push(`${color(fillColor)} rg ${x} ${y} ${width} ${height} re f`);
    };
    const strokeRect = (page, x, y, width, height, strokeColor = border) => {
        page.push(`${color(strokeColor)} RG 0.7 w ${x} ${y} ${width} ${height} re S`);
    };
    const line = (page, x1, y1, x2, y2, lineColor = border, width = 0.7) => {
        page.push(`${color(lineColor)} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
    };
    const drawWrapped = (page, text, x, startY, maxLength, size = 9, maxLines = 4, options = {}) => {
        const lines = wrapPdfText(text, maxLength).slice(0, maxLines);
        lines.forEach((entry, index) => drawText(page, entry, x, startY - (index * (size + 4)), size, options));
    };

    pages.forEach((page, pageIndex) => {
        const firstPage = pageIndex === 0;
        const lastPage = pageIndex === pages.length - 1;

        if (firstPage) {
            fillRect(page, 0, 700, 595, 142, navy);
            fillRect(page, 0, 694, 595, 6, accent);
            drawText(page, "PROJECT MANAGEMENT", 42, 808, 9, { bold: true, color: accent });
            drawText(page, "INVOICE", 42, 756, 29, { bold: true, color: white });
            drawText(page, meta.number, 42, 726, 12, { color: [0.82, 0.85, 0.89] });
            drawRightText(page, "TANGGAL INVOICE", 553, 800, 8, { bold: true, color: accent });
            drawRightText(page, formatDate(meta.date), 553, 782, 11, { bold: true, color: white });
            drawRightText(page, "JATUH TEMPO", 553, 752, 8, { bold: true, color: accent });
            drawRightText(page, meta.dueDate ? formatDate(meta.dueDate) : "Belum diatur", 553, 734, 11, { bold: true, color: white });

            fillRect(page, 42, 609, 511, 60, light);
            strokeRect(page, 42, 609, 511, 60);
            drawText(page, "DITAGIHKAN KEPADA", 58, 650, 8, { bold: true, color: muted });
            drawText(page, client?.name || "-", 58, 627, 14, { bold: true, color: navy });
            drawText(page, [client?.phone, client?.location].filter(Boolean).join(" | ").slice(0, 48) || "Data kontak belum tersedia", 58, 613, 7.5, { color: muted });
            drawText(page, "PROYEK", 322, 650, 8, { bold: true, color: muted });
            drawText(page, String(project.name || "-").slice(0, 38), 322, 627, 11, { bold: true, color: slate });
            drawText(page, String(project.event || client?.event || "Acara").slice(0, 38), 322, 613, 7.5, { color: muted });
        } else {
            fillRect(page, 0, 762, 595, 80, navy);
            fillRect(page, 0, 756, 595, 6, accent);
            drawText(page, "INVOICE", 42, 800, 21, { bold: true, color: white });
            drawText(page, `${meta.number} - lanjutan`, 42, 779, 9, { color: [0.82, 0.85, 0.89] });
            drawRightText(page, client?.name || "-", 553, 798, 10, { bold: true, color: white });
            drawRightText(page, project.name || "-", 553, 779, 9, { color: [0.82, 0.85, 0.89] });
        }

        const tableTop = firstPage ? 579 : 725;
        fillRect(page, 42, tableTop - 27, 511, 27, navy);
        drawText(page, "RINCIAN", 56, tableTop - 18, 8, { bold: true, color: white });
        drawText(page, "JENIS", 353, tableTop - 18, 8, { bold: true, color: white });
        drawRightText(page, "NOMINAL", 539, tableTop - 18, 8, { bold: true, color: white });

        let rowTop = tableTop - 27;
        itemPages[pageIndex].forEach((item, rowIndex) => {
            const rowBottom = rowTop - 31;
            if (rowIndex % 2 === 1) fillRect(page, 42, rowBottom, 511, 31, [0.985, 0.988, 0.992]);
            line(page, 42, rowBottom, 553, rowBottom, border, 0.5);
            drawText(page, String(item.name || "-").slice(0, 48), 56, rowBottom + 11, 9.5, { bold: item.type === "Paket", color: slate });
            drawText(page, item.type, 353, rowBottom + 11, 8.5, { color: muted });
            const nominal = item.amount < 0 ? `- ${formatRupiah(Math.abs(item.amount))}` : formatRupiah(item.amount);
            drawRightText(page, nominal, 539, rowBottom + 11, 9.5, { bold: true, color: item.amount < 0 ? [0.75, 0.15, 0.16] : navy });
            rowTop = rowBottom;
        });
        strokeRect(page, 42, rowTop, 511, tableTop - rowTop);

        if (lastPage) {
            const cardTop = rowTop - 22;
            const cardHeight = 116;
            const cardBottom = cardTop - cardHeight;

            fillRect(page, 327, cardBottom, 226, cardHeight, light);
            strokeRect(page, 327, cardBottom, 226, cardHeight);
            drawText(page, "Total Tagihan", 343, cardTop - 23, 9, { color: muted });
            drawRightText(page, formatRupiah(project.total), 537, cardTop - 23, 10, { bold: true, color: navy });
            drawText(page, "Telah Dibayar", 343, cardTop - 47, 9, { color: muted });
            drawRightText(page, formatRupiah(paid), 537, cardTop - 47, 10, { bold: true, color: [0.08, 0.55, 0.32] });
            line(page, 343, cardTop - 61, 537, cardTop - 61, border, 0.8);
            drawText(page, "SISA TAGIHAN", 343, cardTop - 85, 9, { bold: true, color: navy });
            drawRightText(page, formatRupiah(remaining), 537, cardTop - 87, 13, { bold: true, color: remaining > 0 ? [0.75, 0.15, 0.16] : [0.08, 0.55, 0.32] });

            fillRect(page, 42, cardBottom, 266, cardHeight, [0.985, 0.988, 0.992]);
            strokeRect(page, 42, cardBottom, 266, cardHeight);
            drawText(page, "INFORMASI PEMBAYARAN", 58, cardTop - 22, 8, { bold: true, color: muted });
            drawWrapped(page, meta.bankInfo || "Informasi rekening belum diatur.", 58, cardTop - 43, 48, 9, 3, { color: slate });
            if (meta.notes) {
                drawText(page, "CATATAN", 58, cardTop - 84, 8, { bold: true, color: muted });
                drawWrapped(page, meta.notes, 106, cardTop - 84, 34, 8, 2, { color: slate });
            }

            const pillWidth = Math.max(92, textWidth(status.label, 8, true) + 24);
            fillRect(page, 42, cardBottom - 33, pillWidth, 22, status.background);
            drawText(page, status.label, 54, cardBottom - 26, 8, { bold: true, color: status.color });
        }

        line(page, 42, 42, 553, 42, border, 0.6);
        drawText(page, "Terima kasih atas kepercayaan Anda.", 42, 24, 8, { color: muted });
        drawRightText(page, `Halaman ${pageIndex + 1} dari ${pages.length}`, 553, 24, 8, { color: muted });
    });

    const pageCount = pages.length;
    const regularFontObject = 3 + (pageCount * 2);
    const boldFontObject = regularFontObject + 1;
    const objects = new Array(boldFontObject + 1);
    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    const pageRefs = pages.map((_, index) => `${3 + (index * 2)} 0 R`).join(" ");
    objects[2] = `<< /Type /Pages /Kids [${pageRefs}] /Count ${pageCount} >>`;
    pages.forEach((page, index) => {
        const pageObject = 3 + (index * 2);
        const contentObject = pageObject + 1;
        const stream = page.join("\n");
        objects[pageObject] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${regularFontObject} 0 R /F2 ${boldFontObject} 0 R >> >> /Contents ${contentObject} 0 R >>`;
        objects[contentObject] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });
    objects[regularFontObject] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objects[boldFontObject] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

    let pdf = "%PDF-1.4\n%1234\n";
    const offsets = [0];
    for (let index = 1; index < objects.length; index += 1) {
        offsets[index] = pdf.length;
        pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
    }
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let index = 1; index < objects.length; index += 1) {
        pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new Blob([pdf], { type: "application/pdf" });
}

function downloadInvoicePDF(projectId = "") {
    const selectedProjectId = projectId || document.getElementById("invoiceViewModal")?.dataset.projectId || "";
    const project = appData.projects.find(item => item.id === selectedProjectId);
    if (!project) {
        alert("Data proyek invoice tidak ditemukan.");
        return;
    }
    try {
        const meta = getInvoiceMeta(project);
        const blob = buildInvoicePdf(project.id);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const safeNumber = String(meta.number || "Invoice").replace(/[^a-z0-9_-]+/gi, "-");
        const safeProject = String(project.name || "Proyek").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "");
        link.href = url;
        link.download = `${safeNumber}-${safeProject}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (error) {
        console.error("Gagal membuat PDF invoice:", error);
        alert("PDF invoice gagal dibuat. Silakan coba lagi.");
    }
}

function printInvoice() { downloadInvoicePDF(); }

/* Schedule + calendar + checklist */
function getProjectEventSchedules() {
    return appData.projects.map(project => { const client = appData.clients.find(item => item.id === project.clientId); return { id: `event_${project.id}`, projectId: project.id, title: project.name, date: client?.eventDate || "", time: "", category: "Acara Proyek", location: client?.location || "", source: "project", completed: project.eventStatus === "selesai" }; }).filter(item => item.date);
}
function getAllSchedules() { return [...getProjectEventSchedules(), ...appData.schedules.map(item => ({ ...item, source: "manual" }))]; }
function updateScheduleProjectDropdown(selected = "") {
    const select = document.getElementById("scheduleProject"); if (!select) return;
    select.innerHTML = `<option value="">Tanpa proyek / agenda umum</option>${appData.projects.map(project => `<option value="${project.id}" ${project.id === selected ? "selected" : ""}>${escapeHTML(project.name)}</option>`).join("")}`;
}
function updateScheduleFilters() {
    ["calendarProjectFilter", "checklistProjectFilter"].forEach(id => { const select = document.getElementById(id); if (!select) return; const selected = select.value; select.innerHTML = `<option value="">Semua Proyek</option>${appData.projects.map(project => `<option value="${project.id}">${escapeHTML(project.name)}</option>`).join("")}`; select.value = selected; });
}
function openScheduleModal(scheduleId = null) {
    const form = document.getElementById("scheduleForm"); form?.reset(); const schedule = scheduleId ? appData.schedules.find(item => item.id === scheduleId) : null;
    document.getElementById("scheduleId").value = schedule?.id || ""; updateScheduleProjectDropdown(schedule?.projectId || ""); document.getElementById("scheduleTitle").value = schedule?.title || ""; document.getElementById("scheduleDate").value = schedule?.date || new Date().toISOString().slice(0, 10); document.getElementById("scheduleTime").value = schedule?.time || "10:00"; document.getElementById("scheduleCategory").value = schedule?.category || "Lainnya"; document.getElementById("scheduleLocation").value = schedule?.location || ""; document.getElementById("scheduleNotes").value = schedule?.notes || ""; document.getElementById("scheduleModalTitle").textContent = schedule ? "Edit Jadwal" : "Tambah Jadwal"; document.getElementById("scheduleModal")?.classList.add("show");
}
function closeScheduleModal() { document.getElementById("scheduleModal")?.classList.remove("show"); }
function saveSchedule(event) {
    event.preventDefault(); const id = document.getElementById("scheduleId").value, old = appData.schedules.find(item => item.id === id);
    const data = { id: id || `SCH-${Date.now().toString(36)}`.toUpperCase(), title: document.getElementById("scheduleTitle").value.trim(), projectId: document.getElementById("scheduleProject").value, date: document.getElementById("scheduleDate").value, time: document.getElementById("scheduleTime").value, category: document.getElementById("scheduleCategory").value, location: document.getElementById("scheduleLocation").value.trim(), notes: document.getElementById("scheduleNotes").value.trim(), completed: old?.completed || false, createdAt: old?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    const index = appData.schedules.findIndex(item => item.id === id); if (index >= 0) appData.schedules[index] = data; else appData.schedules.push(data);
    saveData(STORAGE_KEYS.schedules, appData.schedules); closeScheduleModal(); renderScheduleViews(); renderChecklists(); renderUpcomingSchedules();
}
function deleteSchedule(id) { const item = appData.schedules.find(schedule => schedule.id === id); if (!item || !confirm(`Hapus jadwal "${item.title}"?`)) return; appData.schedules = appData.schedules.filter(schedule => schedule.id !== id); saveData(STORAGE_KEYS.schedules, appData.schedules); renderScheduleViews(); renderChecklists(); }
function getFilteredSchedules() {
    const source = document.getElementById("scheduleTypeFilter")?.value || "all", projectId = document.getElementById("calendarProjectFilter")?.value || "";
    return getAllSchedules().filter(item => (source === "all" || item.source === source) && (!projectId || item.projectId === projectId));
}
function renderScheduleViews() { updateScheduleFilters(); renderCalendar(); renderSchedulesList(); }
function switchScheduleView(view) { document.getElementById("calendarView").style.display = view === "calendar" ? "block" : "none"; document.getElementById("scheduleListView").style.display = view === "list" ? "block" : "none"; document.getElementById("btnViewCalendar")?.classList.toggle("active", view === "calendar"); document.getElementById("btnViewList")?.classList.toggle("active", view === "list"); if (view === "list") renderSchedulesList(); else renderCalendar(); }
function prevCalendarMonth() { calendarCursor.setMonth(calendarCursor.getMonth() - 1); renderCalendar(); }
function nextCalendarMonth() { calendarCursor.setMonth(calendarCursor.getMonth() + 1); renderCalendar(); }
function todayCalendarMonth() { calendarCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1); renderCalendar(); }
function renderCalendar() {
    const grid = document.getElementById("calendarDays"), title = document.getElementById("calendarMonthTitle"); if (!grid) return;
    const year = calendarCursor.getFullYear(), month = calendarCursor.getMonth(), first = new Date(year, month, 1), offset = (first.getDay() + 6) % 7, start = new Date(year, month, 1 - offset), schedules = getFilteredSchedules();
    if (title) title.textContent = calendarCursor.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    grid.innerHTML = Array.from({ length: 42 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`, today = new Date().toISOString().slice(0, 10), events = schedules.filter(item => item.date === key); return `<div class="calendar-day ${date.getMonth() !== month ? "other-month" : ""} ${key === today ? "today" : ""}"><div class="calendar-day-header"><span class="calendar-day-number">${date.getDate()}</span></div>${events.slice(0, 3).map(item => `<button class="calendar-event ${item.source}" onclick="${item.source === "manual" ? `openScheduleModal('${item.id}')` : `openProjectModal('${item.projectId}')`}">${escapeHTML(item.time ? `${item.time} ${item.title}` : item.title)}</button>`).join("")}${events.length > 3 ? `<span class="calendar-more">+${events.length - 3} lainnya</span>` : ""}</div>`; }).join("");
}
function renderSchedulesList() {
    const body = document.getElementById("schedulesTableBody"), empty = document.getElementById("schedulesEmpty"); if (!body) return; const schedules = getFilteredSchedules().sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    body.innerHTML = schedules.map(item => { const project = appData.projects.find(p => p.id === item.projectId); return `<tr><td>${formatDate(item.date)}${item.time ? `<span class="client-sub">${escapeHTML(item.time)}</span>` : ""}</td><td><strong>${escapeHTML(item.title)}</strong></td><td>${escapeHTML(project?.name || "Agenda umum")}</td><td><span class="status-badge ${item.source === "project" ? "lunas" : "proses"}">${item.source === "project" ? "Acara Proyek" : escapeHTML(item.category || "Agenda")}</span></td><td>${escapeHTML(item.location || "-")}</td><td>${item.source === "manual" ? "1 agenda" : "Agenda proyek"}</td><td><span class="status-badge ${item.completed ? "lunas" : "belum"}">${item.completed ? "Selesai" : "Belum"}</span></td><td><div class="table-actions">${item.source === "manual" ? `<button class="action-button" onclick="openScheduleModal('${item.id}')">Edit</button><button class="action-button delete" onclick="deleteSchedule('${item.id}')">Hapus</button>` : `<button class="action-button" onclick="openProjectModal('${item.projectId}')">Buka Proyek</button>`}</div></td></tr>`; }).join(""); if (empty) empty.style.display = schedules.length ? "none" : "flex";
}
function setChecklistStatusFilter(status) { checklistStatusFilter = status; document.querySelectorAll("#checklistStatusTabs .filter-tab").forEach(button => button.classList.toggle("active", button.getAttribute("onclick")?.includes(`'${status}'`))); renderChecklists(); }
function toggleScheduleChecklist(id, checked) { const schedule = appData.schedules.find(item => item.id === id); if (!schedule) return; schedule.completed = checked; schedule.completedAt = checked ? new Date().toISOString() : ""; saveData(STORAGE_KEYS.schedules, appData.schedules); renderChecklists(); renderScheduleViews(); }
function renderChecklists() {
    updateScheduleFilters(); const container = document.getElementById("checklistCardsContainer"), empty = document.getElementById("checklistsEmpty"); if (!container) return; const projectId = document.getElementById("checklistProjectFilter")?.value || "";
    const items = appData.schedules.filter(item => (!projectId || item.projectId === projectId) && (checklistStatusFilter === "all" || (checklistStatusFilter === "completed") === Boolean(item.completed))).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    container.innerHTML = items.map(item => { const project = appData.projects.find(p => p.id === item.projectId); return `<article class="checklist-card"><div class="checklist-card-header"><div class="checklist-card-title"><h4>${escapeHTML(item.title)}</h4><span>${formatDate(item.date)}${item.time ? ` · ${escapeHTML(item.time)}` : ""} · ${escapeHTML(project?.name || "Agenda umum")}</span></div><span class="status-badge ${item.completed ? "lunas" : "belum"}">${item.completed ? "Selesai" : "Belum"}</span></div><label class="checklist-task-item ${item.completed ? "completed" : ""}"><input type="checkbox" ${item.completed ? "checked" : ""} onchange="toggleScheduleChecklist('${item.id}', this.checked)"><span class="checklist-task-title">${escapeHTML(item.title)}</span></label></article>`; }).join("");
    const total = appData.schedules.length, done = appData.schedules.filter(item => item.completed).length, percent = total ? Math.round(done / total * 100) : 0; document.getElementById("checklistOverviewSubtitle").textContent = `${done} dari ${total} agenda selesai`; document.getElementById("checklistOverviewPercent").textContent = `${percent}%`; document.getElementById("checklistProgressBar").style.width = `${percent}%`; if (empty) empty.style.display = items.length ? "none" : "flex";
}

function setClientStatusFilter(status) {
    clientStatusFilter = status;
    document.querySelectorAll("#clientStatusTabs .filter-tab").forEach(button => button.classList.toggle("active", button.getAttribute("onclick")?.includes(`'${status}'`)));
    renderClients();
}

function updateVendorProjectDropdown(selectedProject = "") {
    const select = document.getElementById("vendorProject"); if (!select) return;
    select.innerHTML = `<option value="">Pilih Proyek</option>${appData.projects.map(project => { const client = appData.clients.find(item => item.id === project.clientId); return `<option value="${project.id}" ${project.id === selectedProject ? "selected" : ""}>${escapeHTML(project.name)} — ${escapeHTML(client?.name || "Tanpa klien")}${client?.eventDate ? ` — ${formatDate(client.eventDate)}` : ""}</option>`; }).join("")}`;
}

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => page.classList.remove("active")); document.querySelectorAll(".menu-item").forEach(item => item.classList.remove("active"));
    const page = document.getElementById(pageId); if (!page) return; page.classList.add("active"); document.querySelector(`.sidebar-menu .menu-item[onclick="showPage('${pageId}')"]`)?.classList.add("active"); updatePageHeader(pageId);
    if (pageId === "dashboard") refreshApp(); else if (pageId === "clients") renderClients(); else if (pageId === "projects") renderProjects(); else if (pageId === "payments") { renderPayments(); updatePaymentSummary(); } else if (pageId === "vendors") renderVendors(); else if (pageId === "invoices") renderInvoices(); else if (pageId === "schedules") renderScheduleViews(); else if (pageId === "checklist") renderChecklists(); else if (pageId === "settings") { renderPackages(); renderVendorMasters(); }
    if (window.location.hash !== `#${pageId}`) history.replaceState(null, "", `#${pageId}`);
}

function initializeConnectedWorkflow() {
    normalizeConnectedData(); renderVendorMasters(); renderProjects(); renderVendors(); renderInvoices(); renderScheduleViews(); renderChecklists();
    document.querySelectorAll(".currency-input input").forEach(input => { if (!input.dataset.currencyBound) { input.addEventListener("input", formatCurrencyInput); input.dataset.currencyBound = "true"; } });
    ["invoiceModal", "invoiceViewModal", "scheduleModal", "vendorMasterModal"].forEach(id => document.getElementById(id)?.addEventListener("click", event => { if (event.target.id === id) event.target.classList.remove("show"); }));
}
document.addEventListener("DOMContentLoaded", initializeConnectedWorkflow);
