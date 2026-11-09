const STORAGE_KEY = 'rumahku-data-v1';
const demoYear = new Date().getFullYear();
const seedData = {
    user: 'Candra',
    stock: [
        { id: 1, name: 'Beras', category: 'Bahan Pokok', quantity: 5, unit: 'kg', expires: '', note: '' },
        { id: 2, name: 'Minyak Goreng', category: 'Bahan Pokok', quantity: 2, unit: 'pcs', expires: '', note: '' },
        { id: 3, name: 'Gula Pasir', category: 'Bahan Pokok', quantity: 3, unit: 'kg', expires: '', note: '' },
        { id: 4, name: 'Tepung Terigu', category: 'Bahan Pokok', quantity: 2, unit: 'kg', expires: '', note: '' },
        { id: 5, name: 'Telur', category: 'Protein', quantity: 3, unit: 'pcs', expires: '', note: '' },
        { id: 6, name: 'Mie Instan', category: 'Instan', quantity: 10, unit: 'pcs', expires: '', note: '' },
        { id: 7, name: 'Sabun Cuci Piring', category: 'Perawatan', quantity: 1, unit: 'pcs', expires: '', note: '' },
        { id: 8, name: 'Kopi', category: 'Snack', quantity: 2, unit: 'pcs', expires: '', note: '' }
    ],
    shopping: [
        { id: 101, name: 'Susu', quantity: 2, unit: 'pcs', category: 'Protein', checked: false },
        { id: 102, name: 'Roti', quantity: 1, unit: 'pcs', category: 'Bahan Pokok', checked: false },
        { id: 103, name: 'Bawang Merah', quantity: 1, unit: 'kg', category: 'Bahan Pokok', checked: false },
        { id: 104, name: 'Sabun', quantity: 1, unit: 'pcs', category: 'Perawatan', checked: false }
    ],
    transactions: [
        { id: 201, date: `${demoYear}-10-04`, type: 'Belanja', items: 'Beras, minyak goreng', total: 75000, status: 'Selesai' },
        { id: 202, date: `${demoYear}-10-06`, type: 'Belanja', items: 'Gula pasir, telur', total: 38000, status: 'Selesai' },
        { id: 203, date: `${demoYear}-10-12`, type: 'Belanja', items: 'Mie instan, kopi', total: 46000, status: 'Selesai' },
        { id: 204, date: `${demoYear}-10-20`, type: 'Belanja', items: 'Sabun, tepung terigu', total: 57000, status: 'Selesai' }
    ],
    settings: { reminders: true, notifications: true, darkMode: false }
};

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return structuredClone(seedData);
        const parsed = JSON.parse(saved);
        return {
            ...seedData,
            ...parsed,
            stock: Array.isArray(parsed.stock) ? parsed.stock.map(item => ({ expires: '', note: '', ...item })) : seedData.stock,
            shopping: Array.isArray(parsed.shopping) ? parsed.shopping : seedData.shopping,
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : seedData.transactions,
            settings: { ...seedData.settings, ...parsed.settings }
        };
    } catch (error) {
        console.error('Gagal membaca data RumahKu.', error);
        return structuredClone(seedData);
    }
}

const state = { ...loadData(), page: 'dashboard', query: '', editingId: null, formOpen: false, transactionFilter: 'Semua' };
const pageTitles = { dashboard: 'Beranda', stok: 'Stok Barang', belanja: 'Belanja', riwayat: 'Riwayat Transaksi', pengaturan: 'Pengaturan' };
const categories = [
    'Bahan Pokok',
    'Makanan & Minuman',
    'Dapur',
    'Protein',
    'Instan',
    'Perawatan',
    'Perawatan Diri',
    'Pembersih Rumah',
    'Snack',
    'Lainnya'
];

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            user: state.user, stock: state.stock, shopping: state.shopping,
            transactions: state.transactions, settings: state.settings
        }));
    } catch (error) {
        console.error('Gagal menyimpan data RumahKu.', error);
        showToast('Data gagal disimpan. Periksa ruang penyimpanan browser.');
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => toast.classList.remove('show'), 2600);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date) {
    if (!date) return '—';
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
}

function iconFor(category = '') {
    const value = category.toLowerCase();
    if (value.includes('minuman')) return 'fa-mug-hot';
    if (value.includes('pembersih')) return 'fa-spray-can-sparkles';
    if (value.includes('diri') || value.includes('perawatan')) return 'fa-pump-soap';
    if (value.includes('pokok') || value.includes('dapur')) return 'fa-wheat-awn';
    if (value.includes('protein')) return 'fa-drumstick-bite';
    if (value.includes('perawatan')) return 'fa-pump-soap';
    if (value.includes('snack') || value.includes('instan')) return 'fa-bowl-food';
    return 'fa-box';
}

function getFilteredStock() {
    return state.stock.filter(item => `${item.name} ${item.category} ${item.unit}`.toLowerCase().includes(state.query.toLowerCase()));
}

function stockForm(item = null) {
    const current = item || { name: '', category: '', quantity: '', unit: 'pcs', expires: '', note: '' };
    return `<form id="stockForm" class="form-card">
        <div class="form-heading"><div><span class="eyebrow">${item ? 'PERBARUI PERSEDIAAN' : 'BARANG BARU'}</span><h2>${item ? 'Edit Stok Barang' : 'Tambah Barang'}</h2></div><button class="icon-button" type="button" data-action="close-form" aria-label="Tutup"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="form-grid">
            <label class="form-field full-width">Nama Barang<input name="name" value="${escapeHtml(current.name)}" placeholder="Contoh: Minyak Goreng" required maxlength="60"></label>
            <label class="form-field">Kategori<select name="category" required><option value="">Pilih Kategori</option>${categories.map(category => `<option ${current.category === category ? 'selected' : ''}>${category}</option>`).join('')}</select></label>
            <label class="form-field">Jumlah<input name="quantity" type="number" min="0" step="any" value="${escapeHtml(current.quantity)}" placeholder="Contoh: 2" required></label>
            <label class="form-field">Satuan<select name="unit">${['pcs', 'kg', 'gram', 'liter', 'botol', 'bungkus', 'kotak'].map(unit => `<option ${current.unit === unit ? 'selected' : ''}>${unit}</option>`).join('')}</select></label>
            <label class="form-field">Tanggal Kedaluwarsa <span class="optional-label">(Opsional)</span><input name="expires" type="date" value="${escapeHtml(current.expires || '')}"></label>
            <label class="form-field full-width">Catatan <span class="optional-label">(Opsional)</span><textarea name="note" placeholder="Contoh: Merek, ukuran, atau catatan lain">${escapeHtml(current.note || '')}</textarea></label>
        </div>
        <div class="form-actions"><button class="button button-quiet" type="button" data-action="close-form">Batal</button><button class="button button-primary" type="submit">Simpan</button></div>
    </form>`;
}

function renderDashboard() {
    const lowStock = state.stock.filter(item => Number(item.quantity) <= 2);
    const categoriesFound = [...new Set(state.stock.map(item => item.category))];
    const month = new Date().getMonth();
    const monthlyTransactions = state.transactions.filter(item => {
        const date = new Date(`${item.date}T00:00:00`);
        return date.getMonth() === month && date.getFullYear() === new Date().getFullYear();
    });
    const expense = monthlyTransactions.reduce((sum, item) => sum + Number(item.total || 0), 0);
    return `<div class="page-heading dashboard-heading"><div><span class="eyebrow">RINGKASAN RUMAH</span><h1>Halo, ${escapeHtml(state.user)} <span class="wave">👋</span></h1><p>Berikut ringkasan kebutuhan rumah Anda hari ini.</p></div><span class="date-chip"><i class="fa-regular fa-calendar"></i>${new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}</span></div>
        <div class="stats-grid">
            <article class="stat-card"><span class="stat-icon"><i class="fa-solid fa-boxes-stacked"></i></span><div><p>Total Stok</p><strong>${state.stock.length} <small>item</small></strong></div></article>
            <article class="stat-card"><span class="stat-icon shopping-icon"><i class="fa-solid fa-cart-shopping"></i></span><div><p>Daftar Belanja</p><strong>${state.shopping.filter(item => !item.checked).length} <small>item</small></strong></div></article>
            <article class="stat-card"><span class="stat-icon transaction-icon"><i class="fa-solid fa-receipt"></i></span><div><p>Transaksi Bulan Ini</p><strong>${monthlyTransactions.length} <small>kali</small></strong></div></article>
            <article class="stat-card"><span class="stat-icon expense-icon"><i class="fa-solid fa-wallet"></i></span><div><p>Pengeluaran</p><strong>${formatCurrency(expense)}</strong></div></article>
        </div>
        <div class="dashboard-grid">
            <section class="panel-card"><div class="section-heading"><div><span class="eyebrow">PERLU DIPERHATIKAN</span><h2>Stok Hampir Habis</h2></div><button class="text-button" data-page="stok">Lihat Semua <i class="fa-solid fa-arrow-right"></i></button></div>
                ${lowStock.length ? `<div class="low-stock-list">${lowStock.slice(0, 4).map(item => `<div class="stock-row"><span class="product-icon"><i class="fa-solid ${iconFor(item.category)}"></i></span><div class="product-copy"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.category)}</span></div><span class="stock-pill">${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</span></div>`).join('')}</div>` : '<div class="empty-state compact-empty">Semua stok masih aman.</div>'}
            </section>
            <section class="panel-card"><div class="section-heading"><div><span class="eyebrow">AKSES CEPAT</span><h2>Kategori Cepat</h2></div><button class="text-button" data-page="stok">Stok Barang <i class="fa-solid fa-arrow-right"></i></button></div>
                <div class="quick-categories">${categoriesFound.length ? categoriesFound.slice(0, 6).map(category => `<button class="quick-category" data-page="stok"><span class="category-icon"><i class="fa-solid ${iconFor(category)}"></i></span><span>${escapeHtml(category)}</span><small>${state.stock.filter(item => item.category === category).length}</small></button>`).join('') : '<p class="muted">Belum ada barang.</p>'}</div>
            </section>
        </div>
        <button class="dashboard-shopping-banner" data-page="belanja"><span class="banner-icon"><i class="fa-solid fa-cart-shopping"></i></span><span><strong>Yuk, cek daftar belanja rumah!</strong><small>${state.shopping.filter(item => !item.checked).length} kebutuhan masih menunggu untuk dibeli.</small></span><i class="fa-solid fa-arrow-right"></i></button>`;
}

function renderStock() {
    const filtered = getFilteredStock();
    const current = state.stock.find(item => item.id === state.editingId);
    return `<div class="page-heading"><div><span class="eyebrow">INVENTARIS RUMAH</span><h1>Data Stok Barang</h1><p>Kelola persediaan barang kebutuhan rumah tangga.</p></div><button class="button button-primary" data-action="add-stock"><i class="fa-solid fa-plus"></i> Tambah Barang</button></div>
        ${state.formOpen ? stockForm(current) : ''}
        <section class="panel-card table-panel"><div class="table-toolbar"><div><h2>Semua Barang <span class="count-badge">${filtered.length}</span></h2><p>Daftar persediaan yang tersimpan.</p></div><label class="table-search"><i class="fa-solid fa-magnifying-glass"></i><input id="stockSearch" type="search" value="${escapeHtml(state.query)}" placeholder="Cari barang..."></label></div>
        ${filtered.length ? `<div class="table-scroll"><table><thead><tr><th>No</th><th>Nama Barang</th><th>Kategori</th><th>Stok</th><th>Satuan</th><th>Aksi</th></tr></thead><tbody>${filtered.map((item, index) => `<tr><td>${index + 1}</td><td><strong class="item-name">${escapeHtml(item.name)}</strong></td><td>${escapeHtml(item.category)}</td><td class="${Number(item.quantity) <= 2 ? 'low-quantity' : ''}">${escapeHtml(item.quantity)}</td><td>${escapeHtml(item.unit)}</td><td><div class="row-actions"><button class="icon-button" data-action="edit-stock" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.name)}"><i class="fa-solid fa-pen"></i></button><button class="icon-button delete-action" data-action="delete-stock" data-id="${item.id}" aria-label="Hapus ${escapeHtml(item.name)}"><i class="fa-regular fa-trash-can"></i></button></div></td></tr>`).join('')}</tbody></table></div><div class="table-footer"><span>Menampilkan ${filtered.length ? 1 : 0}–${filtered.length} dari ${state.stock.length} data</span><span class="table-pages"><button disabled aria-label="Sebelumnya"><i class="fa-solid fa-chevron-left"></i></button><b>1</b><button disabled aria-label="Berikutnya"><i class="fa-solid fa-chevron-right"></i></button></span></div>` : `<div class="empty-state"><i class="fa-solid fa-box-open"></i><strong>${state.stock.length ? 'Barang tidak ditemukan' : 'Belum ada stok barang'}</strong><p>${state.stock.length ? 'Coba kata kunci yang berbeda.' : 'Tambahkan barang untuk mulai mencatat persediaan.'}</p></div>`}</section>`;
}

function renderShopping() {
    const filtered = state.shopping.filter(item => `${item.name} ${item.category}`.toLowerCase().includes(state.query.toLowerCase()));
    return `<div class="page-heading"><div><span class="eyebrow">RENCANAKAN KEBUTUHAN</span><h1>Daftar Belanja</h1><p>Pastikan kebutuhan rumah tidak ada yang terlewat.</p></div><button class="button button-primary" data-action="add-shopping"><i class="fa-solid fa-plus"></i> Tambah Item</button></div>
        <section class="panel-card table-panel"><div class="table-toolbar"><div><h2>Daftar Kebutuhan <span class="count-badge">${filtered.length}</span></h2><p>Tandai item setelah selesai dibeli.</p></div><label class="table-search"><i class="fa-solid fa-magnifying-glass"></i><input id="shoppingSearch" type="search" value="${escapeHtml(state.query)}" placeholder="Cari item belanja..."></label></div>
        ${filtered.length ? `<div class="table-scroll"><table><thead><tr><th>No</th><th>Nama Barang</th><th>Jumlah</th><th>Satuan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${filtered.map((item, index) => `<tr><td>${index + 1}</td><td><strong class="item-name">${escapeHtml(item.name)}</strong></td><td>${escapeHtml(item.quantity)}</td><td>${escapeHtml(item.unit)}</td><td><label class="status-toggle"><input type="checkbox" data-action="toggle-shopping" data-id="${item.id}" ${item.checked ? 'checked' : ''}><span>${item.checked ? 'Tersedia' : 'Belum dibeli'}</span></label></td><td><div class="row-actions"><button class="icon-button" data-action="edit-shopping" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.name)}"><i class="fa-solid fa-pen"></i></button><button class="icon-button delete-action" data-action="delete-shopping" data-id="${item.id}" aria-label="Hapus ${escapeHtml(item.name)}"><i class="fa-regular fa-trash-can"></i></button></div></td></tr>`).join('')}</tbody></table></div><div class="table-footer"><span>Total Item <strong>${state.shopping.length}</strong></span><button class="button button-primary button-small" data-action="complete-shopping"><i class="fa-solid fa-cart-shopping"></i> Belanja Sekarang</button></div>` : '<div class="empty-state"><i class="fa-solid fa-basket-shopping"></i><strong>Daftar belanja kosong</strong><p>Tambahkan kebutuhan yang ingin dibeli.</p></div>'}</section>
        ${state.formOpen ? shoppingForm(state.shopping.find(item => item.id === state.editingId)) : ''}`;
}

function shoppingForm(item = null) {
    const current = item || { name: '', quantity: 1, unit: 'pcs', category: '' };
    return `<form id="shoppingForm" class="form-card shopping-form-card"><div class="form-heading"><div><span class="eyebrow">DAFTAR KEBUTUHAN</span><h2>${item ? 'Edit Item Belanja' : 'Tambah Item Belanja'}</h2></div><button class="icon-button" type="button" data-action="close-form" aria-label="Tutup"><i class="fa-solid fa-xmark"></i></button></div><div class="form-grid"><label class="form-field full-width">Nama Barang<input name="name" value="${escapeHtml(current.name)}" placeholder="Contoh: Susu" maxlength="60" required></label><label class="form-field">Jumlah<input name="quantity" type="number" min="0.1" step="any" value="${escapeHtml(current.quantity)}" required></label><label class="form-field">Satuan<select name="unit">${['pcs', 'kg', 'gram', 'liter', 'botol', 'bungkus', 'kotak'].map(unit => `<option ${current.unit === unit ? 'selected' : ''}>${unit}</option>`).join('')}</select></label><label class="form-field full-width">Kategori<select name="category"><option value="">Pilih kategori</option>${categories.map(category => `<option ${current.category === category ? 'selected' : ''}>${category}</option>`).join('')}</select></label><label class="form-field full-width">Catatan <span class="optional-label">(Opsional)</span><textarea name="note" placeholder="Catatan tambahan"></textarea></label></div><div class="form-actions"><button type="button" class="button button-quiet" data-action="close-form">Batal</button><button class="button button-primary" type="submit">Simpan</button></div></form>`;
}

function renderTransactions() {
    const filtered = state.transactions.filter(item => state.transactionFilter === 'Semua' || item.type === state.transactionFilter);
    const now = new Date();
    const monthRange = `${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(now.getFullYear(), now.getMonth(), 1))} – ${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(now)}`;
    return `<div class="page-heading"><div><span class="eyebrow">CATATAN PENGELUARAN</span><h1>Riwayat Transaksi</h1><p>Pantau aktivitas belanja dan pengeluaran rumah.</p></div><span class="date-chip"><i class="fa-regular fa-calendar"></i>${monthRange}</span></div>
        <section class="panel-card table-panel"><div class="filter-tabs">${['Semua', 'Belanja', 'Pengeluaran'].map(filter => `<button class="filter-tab ${state.transactionFilter === filter ? 'active' : ''}" data-action="filter-transactions" data-filter="${filter}">${filter}</button>`).join('')}</div>
        ${filtered.length ? `<div class="table-scroll"><table><thead><tr><th>Tanggal</th><th>Jenis</th><th>Item</th><th>Total</th><th>Status</th></tr></thead><tbody>${filtered.map(item => `<tr><td>${formatDate(item.date)}</td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.items)}</td><td><strong>${formatCurrency(item.total)}</strong></td><td><span class="transaction-status">${escapeHtml(item.status)}</span></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state"><i class="fa-solid fa-receipt"></i><strong>Belum ada transaksi</strong><p>Transaksi akan muncul di sini setelah dicatat.</p></div>'}</section>`;
}

function renderSettings() {
    return `<div class="page-heading"><div><span class="eyebrow">PREFERENSI APLIKASI</span><h1>Pengaturan</h1><p>Atur tampilan dan pengingat RumahKu.</p></div></div>
        <section class="panel-card settings-card"><div class="settings-title"><i class="fa-regular fa-user"></i><h2>Profil Pengguna</h2></div><div class="profile-settings"><div class="settings-avatar">${escapeHtml(state.user.charAt(0).toUpperCase())}</div><div><strong>${escapeHtml(state.user)}</strong><span>Pengguna RumahKu</span></div><button class="button button-outline button-small" data-action="edit-name">Ubah Profil</button></div>
        <div class="settings-title"><i class="fa-solid fa-sliders"></i><h2>Preferensi</h2></div>
        ${[['reminders', 'Pengingat Kadaluarsa', 'Ingatkan barang yang mendekati tanggal kedaluwarsa.'], ['notifications', 'Notifikasi Belanja', 'Dapatkan pengingat daftar belanja.'], ['darkMode', 'Mode Gelap', 'Gunakan tema gelap pada aplikasi.']].map(([key, title, description]) => `<div class="settings-row"><div><strong>${title}</strong><p>${description}</p></div><label class="switch"><input type="checkbox" data-action="toggle-setting" data-key="${key}" ${state.settings[key] ? 'checked' : ''}><span></span></label></div>`).join('')}</section>`;
}

function renderNotifications() {
    const low = state.stock.filter(item => Number(item.quantity) <= 2);
    const shoppingCount = state.shopping.filter(item => !item.checked).length;
    const notifications = [
        ...low.map(item => ({ icon: 'fa-box-open', title: `Stok ${item.name} hampir habis`, detail: `Tersisa ${item.quantity} ${item.unit}.`, time: 'Stok barang' })),
        ...(shoppingCount ? [{ icon: 'fa-cart-shopping', title: 'Daftar belanja masih menunggu', detail: `${shoppingCount} item belum dibeli.`, time: 'Daftar belanja' }] : []),
        { icon: 'fa-circle-check', title: 'RumahKu siap digunakan', detail: 'Data kebutuhan rumah tersimpan di perangkat ini.', time: 'Hari ini' }
    ];
    document.getElementById('notificationList').innerHTML = notifications.length ? notifications.map(item => `<div class="notification-row"><span><i class="fa-solid ${item.icon}"></i></span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p><small>${escapeHtml(item.time)}</small></div></div>`).join('') : '<p class="muted">Tidak ada notifikasi baru.</p>';
}

function render() {
    document.querySelectorAll('.nav-item[data-page]').forEach(button => button.classList.toggle('active', button.dataset.page === state.page));
    document.getElementById('stockNavCount').textContent = state.stock.length;
    document.getElementById('shoppingNavCount').textContent = state.shopping.filter(item => !item.checked).length;
    const renderers = { dashboard: renderDashboard, stok: renderStock, belanja: renderShopping, riwayat: renderTransactions, pengaturan: renderSettings };
    document.getElementById('pageContent').innerHTML = renderers[state.page]();
    renderNotifications();
}

function navigateTo(page) {
    if (!pageTitles[page]) return;
    state.page = page;
    state.query = '';
    state.formOpen = false;
    state.editingId = null;
    document.getElementById('globalSearch').value = '';
    document.getElementById('sidebar').classList.remove('sidebar-open');
    render();
}

function updateProfile(name) {
    state.user = name.trim() || 'Candra';
    document.getElementById('sidebarName').textContent = state.user;
    document.getElementById('sidebarAvatar').textContent = state.user.charAt(0).toUpperCase();
    saveData();
}

function recordTransaction(items, total = 0) {
    state.transactions.unshift({
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        type: 'Belanja',
        items,
        total,
        status: 'Selesai'
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateProfile(state.user);
    renderNotifications();

    document.getElementById('loginForm').addEventListener('submit', event => {
        event.preventDefault();
        const name = new FormData(event.currentTarget).get('name').toString().trim();
        updateProfile(name || 'Candra');
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('appWrapper').classList.remove('hidden');
        navigateTo('dashboard');
    });

    document.getElementById('togglePassword').addEventListener('click', event => {
        const input = document.getElementById('loginPassword');
        const visible = input.type === 'password';
        input.type = visible ? 'text' : 'password';
        event.currentTarget.innerHTML = `<i class="fa-regular ${visible ? 'fa-eye-slash' : 'fa-eye'}"></i>`;
    });

    document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('sidebar-open'));
    document.getElementById('notificationButton').addEventListener('click', () => document.getElementById('notificationPopover').classList.toggle('hidden'));

    document.body.addEventListener('click', event => {
        const pageButton = event.target.closest('[data-page]');
        if (pageButton) {
            event.preventDefault();
            navigateTo(pageButton.dataset.page);
            return;
        }
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const { action, id } = button.dataset;
        if (action === 'add-stock' || action === 'add-shopping') {
            state.formOpen = true;
            state.editingId = null;
            render();
            document.querySelector(`#${action === 'add-stock' ? 'stockForm' : 'shoppingForm'} [name="name"]`)?.focus();
        } else if (action === 'close-form') {
            state.formOpen = false;
            state.editingId = null;
            render();
        } else if (action === 'edit-stock' || action === 'edit-shopping') {
            state.editingId = Number(id);
            state.formOpen = true;
            render();
            document.querySelector(`#${state.page === 'stok' ? 'stockForm' : 'shoppingForm'} [name="name"]`)?.focus();
        } else if (action === 'delete-stock') {
            const item = state.stock.find(entry => entry.id === Number(id));
            if (item && confirm(`Hapus ${item.name} dari data stok?`)) {
                state.stock = state.stock.filter(entry => entry.id !== Number(id));
                saveData();
                render();
                showToast('Barang berhasil dihapus.');
            }
        } else if (action === 'delete-shopping') {
            state.shopping = state.shopping.filter(item => item.id !== Number(id));
            saveData();
            render();
            showToast('Item dihapus dari daftar belanja.');
        } else if (action === 'filter-transactions') {
            state.transactionFilter = button.dataset.filter;
            render();
        } else if (action === 'complete-shopping') {
            const completed = state.shopping.filter(item => !item.checked);
            if (!completed.length) {
                showToast('Tidak ada item baru untuk dicatat.');
                return;
            }
            recordTransaction(completed.map(item => item.name).join(', '));
            state.shopping = state.shopping.filter(item => !item.checked);
            saveData();
            render();
            showToast('Belanja selesai dan masuk ke riwayat transaksi.');
        } else if (action === 'toggle-setting') {
            state.settings[button.dataset.key] = button.checked;
            saveData();
            showToast('Pengaturan berhasil diperbarui.');
        } else if (action === 'edit-name') {
            const name = prompt('Masukkan nama yang ingin ditampilkan:', state.user);
            if (name && name.trim()) {
                updateProfile(name);
                render();
                showToast('Profil berhasil diperbarui.');
            }
        } else if (action === 'logout') {
            document.getElementById('appWrapper').classList.add('hidden');
            document.getElementById('loginPage').classList.remove('hidden');
            document.getElementById('loginPassword').value = '';
        } else if (action === 'close-notifications') {
            document.getElementById('notificationPopover').classList.add('hidden');
        } else if (action === 'forgot-password') {
            showToast('Fitur pemulihan password tersedia setelah akun terhubung.');
        } else if (action === 'register') {
            showToast('Pendaftaran akun tersedia pada versi berikutnya.');
        }
    });

    document.body.addEventListener('submit', event => {
        if (event.target.id === 'stockForm') {
            event.preventDefault();
            const data = new FormData(event.target);
            const item = {
                name: data.get('name').toString().trim(),
                category: data.get('category').toString(),
                quantity: Number(data.get('quantity')),
                unit: data.get('unit').toString(),
                expires: data.get('expires').toString(),
                note: data.get('note').toString().trim()
            };
            if (!item.name || !Number.isFinite(item.quantity) || item.quantity < 0) {
                showToast('Periksa kembali data barang.');
                return;
            }
            if (state.editingId !== null) {
                state.stock = state.stock.map(existing => existing.id === state.editingId ? { ...existing, ...item } : existing);
                showToast('Data stok berhasil diperbarui.');
            } else {
                state.stock.unshift({ id: Date.now(), ...item });
                showToast('Barang berhasil ditambahkan.');
            }
            state.formOpen = false;
            state.editingId = null;
            saveData();
            render();
        } else if (event.target.id === 'shoppingForm') {
            event.preventDefault();
            const data = new FormData(event.target);
            const item = { name: data.get('name').toString().trim(), quantity: Number(data.get('quantity')), unit: data.get('unit').toString(), category: data.get('category').toString(), checked: false };
            if (!item.name || !Number.isFinite(item.quantity) || item.quantity <= 0) {
                showToast('Periksa kembali nama dan jumlah barang.');
                return;
            }
            if (state.editingId !== null) {
                state.shopping = state.shopping.map(existing => existing.id === state.editingId ? { ...existing, ...item } : existing);
                showToast('Item belanja berhasil diperbarui.');
            } else {
                state.shopping.unshift({ id: Date.now(), ...item });
                showToast('Item berhasil ditambahkan ke daftar belanja.');
            }
            state.formOpen = false;
            state.editingId = null;
            saveData();
            render();
        }
    });

    document.body.addEventListener('change', event => {
        if (event.target.matches('[data-action="toggle-shopping"]')) {
            const item = state.shopping.find(entry => entry.id === Number(event.target.dataset.id));
            if (item) {
                item.checked = event.target.checked;
                saveData();
                render();
            }
        }
    });

    document.body.addEventListener('input', event => {
        if (event.target.id === 'globalSearch') {
            state.query = event.target.value;
            if (!['stok', 'belanja'].includes(state.page)) state.page = 'stok';
            render();
            document.getElementById('globalSearch').focus();
            document.getElementById('globalSearch').setSelectionRange(state.query.length, state.query.length);
        } else if (event.target.id === 'stockSearch' || event.target.id === 'shoppingSearch') {
            state.query = event.target.value;
            render();
            const search = document.getElementById(event.target.id);
            search?.focus();
            search?.setSelectionRange(state.query.length, state.query.length);
        }
    });
});
