import { supabase } from '../api/supabase.js';

const API_BASE = "http://localhost:8080/api";
let calendar;

// --- GESTIONE SIDEBAR MOBILE ---
function toggleSidebar(show) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('menuOverlay');
    const body = document.body;
    
    if (show) {
        sidebar.classList.add('open');
        overlay.classList.remove('hidden');
        overlay.classList.add('visible');
        body.classList.add('menu-open');
    } else {
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
        overlay.classList.remove('visible');
        body.classList.remove('menu-open');
    }
}

// --- 1. INIZIALIZZAZIONE INTELLIGENTE ---
document.addEventListener('DOMContentLoaded', async () => {
    const auth = await getAuthData();
    if (!auth) return;

    // Listeners Menu
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => toggleSidebar(true));
    document.getElementById('closeSidebarBtn')?.addEventListener('click', () => toggleSidebar(false));
    document.getElementById('menuOverlay')?.addEventListener('click', () => toggleSidebar(false));
    
    // Il logo riporta sempre alla dashboard globale
    document.getElementById('logoHome')?.addEventListener('click', () => showGlobalDashboard(auth));

    document.getElementById('recentBrands').addEventListener('click', (e) => {
        if (e.target.closest('.brand-link')) toggleSidebar(false);
    });

    await loadSidebarBrands(auth);

    const isMobile = window.innerWidth < 768;
    const storageKey = `selectedBrand_${auth.userId}`;
    const lastBrandId = localStorage.getItem(storageKey);

    if (isMobile) {
        showGlobalDashboard(auth);
    } else if (lastBrandId) {
        selectBrand(lastBrandId);
    } else {
        showGlobalDashboard(auth);
    }
});

// --- 2. GESTIONE SIDEBAR ---
async function loadSidebarBrands(auth) {
    try {
        const res = await fetch(`${API_BASE}/brands/smm/${auth.userId}`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const brands = await res.json();
        const sidebarList = document.getElementById('recentBrands');
        sidebarList.innerHTML = brands.map(brand => `
            <li>
                <button onclick="selectBrand('${brand.id}', '${brand.name}')" 
                        id="btn-${brand.id}"
                        class="brand-link w-full text-left px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <span class="truncate">${brand.name}</span>
                </button>
            </li>
        `).join('');
    } catch (err) { console.error("Errore sidebar:", err); }
}

// --- 3. SELEZIONE BRAND (IBRIDA PC/MOBILE) ---
window.selectBrand = async function(brandId, brandName = "") {
    const auth = await getAuthData();
    if (!auth) return;

    localStorage.setItem(`selectedBrand_${auth.userId}`, brandId);
    localStorage.setItem('activeBrandId', brandId); 
    
    document.querySelectorAll('.brand-link').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${brandId}`)?.classList.add('active');

    if(brandName) {
        document.getElementById('currentBrandName').innerText = `Gestione: ${brandName}`;
    }

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
        document.getElementById('calendar').classList.add('hidden');
        document.getElementById('calendar-placeholder').classList.remove('hidden');
        loadBrandFeed(brandId, brandName, auth);
    } else {
        document.getElementById('calendar-placeholder').classList.add('hidden');
        document.getElementById('calendar').classList.remove('hidden');
        initDashboardCalendar(brandId);
    }
};

// --- 4. GLOBAL DASHBOARD (FEED ATTIVITÀ) ---
window.showGlobalDashboard = async function(auth) {
    if (!auth) auth = await getAuthData();
    
    localStorage.removeItem('activeBrandId');
    document.querySelectorAll('.brand-link').forEach(btn => btn.classList.remove('active'));
    document.getElementById('currentBrandName').innerText = "Global Activity Feed";

    document.getElementById('calendar').classList.add('hidden');
    document.getElementById('calendar-placeholder').classList.remove('hidden');

    loadGlobalActivity(auth);
};

async function loadGlobalActivity(auth) {
    const placeholder = document.getElementById('calendar-placeholder');
    placeholder.innerHTML = `
        <div class="w-full max-w-2xl mx-auto py-4">
            <h3 class="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 px-4 sm:px-0">
                🔔 Ultimi aggiornamenti (Tutti i clienti)
            </h3>
            <div id="globalFeed" class="space-y-4 px-4 sm:px-0 text-left">
                <p class="text-slate-400 italic">Caricamento attività...</p>
            </div>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE}/posts/smm/${auth.userId}/recent`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const posts = await res.json();
        renderFeed(posts, "globalFeed");
    } catch (err) { console.error("Errore feed globale:", err); }
}

// Feed di un SINGOLO brand con tasto RITORNA AL GLOBAL FEED
async function loadBrandFeed(brandId, brandName, auth) {
    const placeholder = document.getElementById('calendar-placeholder');
    placeholder.innerHTML = `
        <div class="w-full max-w-2xl mx-auto py-4">
            <div class="flex flex-col gap-1 mb-6 px-4">
                <h3 class="text-xl font-bold text-slate-800">📂 Post di: ${brandName}</h3>
                <button onclick="showGlobalDashboard()" class="text-indigo-600 font-bold text-xs text-left hover:underline flex items-center gap-1">
                    ← Ritorna al global feed
                </button>
            </div>
            <div id="globalFeed" class="space-y-4 px-4 text-left">
                <p class="text-slate-400 italic">Caricamento post...</p>
            </div>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE}/posts/brand/${brandId}`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const posts = await res.json();
        posts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        renderFeed(posts, "globalFeed");
    } catch (err) { console.error("Errore feed brand:", err); }
}

function renderFeed(posts, containerId) {
    const container = document.getElementById(containerId);
    if (!posts || posts.length === 0) {
        container.innerHTML = '<p class="text-slate-400">Nessuna attività registrata.</p>';
        return;
    }

    container.innerHTML = posts.map(p => `
        <div onclick="openPostModal(${JSON.stringify(p).replace(/"/g, '&quot;')})" 
             class="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center group">
            <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black text-indigo-500 uppercase tracking-widest">${p.brand ? p.brand.name : p.platform}</span>
                    <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span class="text-[10px] text-slate-400">${new Date(p.updatedAt).toLocaleString('it-IT', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</span>
                </div>
                <h4 class="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors truncate max-w-[180px] sm:max-w-xs">${p.title}</h4>
            </div>
            <div class="flex items-center gap-3">
                <span class="px-3 py-1 rounded-full text-[10px] font-bold" style="background-color: ${getStatusColor(p.status)}20; color: ${getStatusColor(p.status)}">
                    ${getStatusLabel(p.status)}
                </span>
            </div>
        </div>
    `).join('');
}

// --- 5. CALENDARIO (PC ONLY) ---
async function initDashboardCalendar(brandId) {
    const auth = await getAuthData();
    const calendarEl = document.getElementById('calendar');
    if (calendar) calendar.destroy();

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'it',
        firstDay: 1, 
        height: 'auto',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listBtn'
        },
        customButtons: {
            listBtn: {
                text: 'list',
                click: function() { showGlobalDashboard(auth); }
            }
        },
        events: async (info, success, failure) => {
            try {
                const res = await fetch(`${API_BASE}/posts/brand/${brandId}`, {
                    headers: { 'Authorization': `Bearer ${auth.token}` }
                });
                const posts = await res.json();
                success(posts.map(p => ({
                    id: p.id,
                    title: (p.scheduledTime ? p.scheduledTime + " " : "") + `[${p.platform}] ${p.title}`,
                    start: p.scheduledDate,
                    backgroundColor: getStatusColor(p.status),
                    borderColor: getStatusColor(p.status),
                    extendedProps: p
                })));
            } catch (e) { failure(e); }
        },
        dateClick: (info) => openPostModal({ scheduledDate: info.dateStr }),
        eventClick: (info) => openPostModal(info.event.extendedProps)
    });
    calendar.render();
}

// --- 6. MODALE (CENTRATO E READ-ONLY MOBILE) ---
window.openPostModal = async function(data = {}) {
    const modal = document.getElementById('postModal');
    const modalContent = modal.querySelector('.bg-white'); 
    const form = document.getElementById('postForm');
    const statusHeader = document.getElementById('modalTitle');
    const commentsSection = document.getElementById('commentsSection');
    const fieldsContainer = document.getElementById('postFieldsContainer');
    const saveBtn = form.querySelector('button[type="submit"]');
    const deleteBtn = document.getElementById('deletePostBtn');
    const footer = document.getElementById('modalFooter');
    
    const isMobile = window.innerWidth < 768;
    const isExistingPost = !!data.id;
    const isReadOnly = isMobile && isExistingPost;

    form.reset();

    if (isReadOnly) {
        fieldsContainer.classList.add('hidden');
        saveBtn.style.display = 'none';
        if(deleteBtn) deleteBtn.style.display = 'none';
        footer.classList.add('hidden');
    } else {
        fieldsContainer.classList.remove('hidden');
        saveBtn.style.display = 'block';
        footer.classList.remove('hidden');
        if(deleteBtn) deleteBtn.style.display = isExistingPost ? 'block' : 'none';
    }

    modalContent.classList.remove('border-t-8', 'border-emerald-500', 'border-amber-500', 'border-red-500');
    
    if (isExistingPost) {
        if (data.status === 'APPROVED') {
            statusHeader.innerHTML = "✅ Approvato dal Cliente";
            modalContent.classList.add('border-t-8', 'border-emerald-500');
        } else if (data.status === 'REVISION_REQUESTED') {
            statusHeader.innerHTML = "❌ Modifica Richiesta";
            modalContent.classList.add('border-t-8', 'border-red-500');
        } else {
            statusHeader.innerHTML = "🕒 In attesa di revisione";
            modalContent.classList.add('border-t-8', 'border-amber-500');
        }

        document.getElementById('postId').value = data.id || "";
        document.getElementById('title').value = data.title || "";
        document.getElementById('content').value = data.content || "";
        document.getElementById('scheduledDate').value = data.scheduledDate || "";
        document.getElementById('scheduledTime').value = data.scheduledTime || "";
        document.getElementById('platform').value = data.platform || "INSTAGRAM";
        document.getElementById('mediaLink').value = data.mediaLink || "";

        const auth = await getAuthData();
        loadComments(data.id, auth.token);
        commentsSection.classList.remove('hidden');
    } else {
        statusHeader.innerText = "Nuovo Post";
        document.getElementById('postId').value = "";
        document.getElementById('scheduledDate').value = data.scheduledDate || "";
        commentsSection.classList.add('hidden');
    }

    modal.classList.remove('hidden');
    document.body.classList.add('menu-open');
};

window.closePostModal = () => {
    document.getElementById('postModal').classList.add('hidden');
    document.body.classList.remove('menu-open');
};

// --- 7. DATABASE & UTILS ---
document.getElementById('postForm').onsubmit = async (e) => {
    e.preventDefault();
    const auth = await getAuthData();
    const brandId = localStorage.getItem('activeBrandId');
    const id = document.getElementById('postId').value;
    const payload = {
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        scheduledDate: document.getElementById('scheduledDate').value,
        scheduledTime: document.getElementById('scheduledTime').value,
        platform: document.getElementById('platform').value,
        mediaLink: document.getElementById('mediaLink').value,
        brand: { id: brandId }
    };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/posts/${id}` : `${API_BASE}/posts`;
    const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` },
        body: JSON.stringify(payload)
    });
    if (res.ok) { 
        closePostModal(); 
        const isCalendarVisible = !document.getElementById('calendar').classList.contains('hidden');
        if (calendar && isCalendarVisible) {
            calendar.refetchEvents();
        } else {
            const currentBrand = localStorage.getItem('activeBrandId');
            if(currentBrand) selectBrand(currentBrand); else showGlobalDashboard(auth);
        }
    }
};

async function loadComments(postId, token) {
    const container = document.getElementById('commentsTimeline');
    container.innerHTML = '<p class="text-xs text-slate-400">Caricamento...</p>';
    try {
        const res = await fetch(`${API_BASE}/posts/${postId}/comments`, { headers: { 'Authorization': `Bearer ${token}` } });
        const comments = await res.json();
        if (comments.length === 0) { container.innerHTML = '<p class="text-xs text-slate-400 italic">Nessun commento.</p>'; return; }
        container.innerHTML = comments.map(c => `
            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left text-sm">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-[10px] font-black text-indigo-500 uppercase">Nota Cliente</span>
                    <span class="text-[9px] font-bold text-slate-300">${new Date(c.createdAt).toLocaleString('it-IT')}</span>
                </div>
                <p class="text-slate-600">${c.body}</p>
            </div>
        `).join('');
    } catch (e) { container.innerHTML = 'Errore.'; }
}

async function getAuthData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '../login/login.html'; return null; }
    return { token: session.access_token, userId: session.user.id };
}

function getStatusColor(status) {
    switch (status) {
        case 'APPROVED': return '#10b981';
        case 'REVISION_REQUESTED': return '#ef4444';
        default: return '#f59e0b';
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'APPROVED': return 'APPROVATO';
        case 'REVISION_REQUESTED': return 'REVISIONE';
        default: return 'PENDENTE';
    }
}

window.copyInviteLink = function() {
    const brandId = localStorage.getItem('activeBrandId');
    if (!brandId) return alert("Seleziona un brand!");
    navigator.clipboard.writeText(`${window.location.origin}/index.html?brandId=${brandId}`).then(() => alert("Copiato!"));
};