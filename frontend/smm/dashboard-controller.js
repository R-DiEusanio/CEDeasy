import { supabase } from '../api/supabase.js';

const API_BASE = "http://localhost:8080/api";
let calendar;

// --- 1. INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', async () => {
    const auth = await getAuthData();
    if (!auth) return;

    await loadSidebarBrands(auth);

    // Recuperiamo l'ultimo brand usando la chiave specifica dell'utente
    const storageKey = `selectedBrand_${auth.userId}`;
    const lastBrandId = localStorage.getItem(storageKey);

    if (lastBrandId) {
        selectBrand(lastBrandId);
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
                    ${brand.name}
                </button>
            </li>
        `).join('');
    } catch (err) { console.error("Errore sidebar:", err); }
}

// --- 3. SELEZIONE BRAND & LINK MAGICO ---
window.selectBrand = async function(brandId, brandName = "") {
    const auth = await getAuthData();
    if (!auth) return;

    // Salviamo l'ID sia per la memoria utente che per l'uso immediato nel controller
    localStorage.setItem(`selectedBrand_${auth.userId}`, brandId);
    localStorage.setItem('activeBrandId', brandId); // Chiave "di sessione" più semplice
    
    document.querySelectorAll('.brand-link').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${brandId}`)?.classList.add('active');

    if(brandName) document.getElementById('currentBrandName').innerText = `Gestione: ${brandName}`;

    document.getElementById('calendar-placeholder').classList.add('hidden');
    document.getElementById('calendar').classList.remove('hidden');

    initDashboardCalendar(brandId);
};

// --- NUOVA FUNZIONE: COPIA LINK MAGICO ---
window.copyInviteLink = function() {
    const brandId = localStorage.getItem('activeBrandId');
    if (!brandId) return alert("Per favore, seleziona un brand dalla sidebar prima di generare l'invito.");

    // Costruiamo l'URL. Assumiamo che la registrazione sia nella root (index.html o simile)
    // Il link sarà tipo: http://tuosito.it/index.html?brandId=UUID
    const inviteUrl = `${window.location.origin}/index.html?brandId=${brandId}`;

    navigator.clipboard.writeText(inviteUrl).then(() => {
        alert("Link Magico copiato! Invialo al cliente per farlo registrare a questo brand.");
    }).catch(err => {
        console.error("Errore nel copiare il link:", err);
    });
};

// --- 4. CALENDARIO ---
async function initDashboardCalendar(brandId) {
    const auth = await getAuthData();
    const calendarEl = document.getElementById('calendar');

    if (calendar) calendar.destroy();

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'it',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' },
        selectable: true,
        events: async (info, success, failure) => {
            try {
                const res = await fetch(`${API_BASE}/posts/brand/${brandId}`, {
                    headers: { 'Authorization': `Bearer ${auth.token}` }
                });
                const posts = await res.json();
                success(posts.map(p => ({
                    id: p.id,
                    title: `[${p.platform}] ${p.title}`,
                    start: p.scheduledDate,
                    backgroundColor: getPlatformColor(p.platform),
                    extendedProps: p
                })));
            } catch (e) { failure(e); }
        },
        dateClick: (info) => openPostModal({ scheduledDate: info.dateStr }),
        eventClick: (info) => openPostModal(info.event.extendedProps)
    });
    
    calendar.render();
}

// --- 5. MODALE CRUD ---
window.openPostModal = function(data = {}) {
    const brandId = localStorage.getItem('activeBrandId'); // Usiamo la chiave corretta
    if (!brandId) return alert("Seleziona prima un cliente!");

    const modal = document.getElementById('postModal');
    const deleteBtn = document.getElementById('deletePostBtn');
    document.getElementById('postForm').reset();
    
    if (data.id) {
        document.getElementById('modalTitle').innerText = "Modifica Post";
        document.getElementById('postId').value = data.id;
        document.getElementById('title').value = data.title;
        document.getElementById('content').value = data.content;
        document.getElementById('scheduledDate').value = data.scheduledDate;
        document.getElementById('platform').value = data.platform;
        document.getElementById('mediaLink').value = data.mediaLink || "";
        deleteBtn.classList.remove('hidden');
    } else {
        document.getElementById('modalTitle').innerText = "Nuovo Post";
        document.getElementById('postId').value = "";
        document.getElementById('scheduledDate').value = data.scheduledDate || "";
        deleteBtn.classList.add('hidden');
    }

    modal.classList.remove('hidden');
};

window.closePostModal = () => document.getElementById('postModal').classList.add('hidden');

// --- 6. OPERAZIONI DATABASE ---
document.getElementById('postForm').onsubmit = async (e) => {
    e.preventDefault();
    const auth = await getAuthData();
    const brandId = localStorage.getItem('activeBrandId'); // Usiamo la chiave corretta
    const id = document.getElementById('postId').value;

    const payload = {
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        scheduledDate: document.getElementById('scheduledDate').value,
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
        calendar.refetchEvents();
    }
};

document.getElementById('deletePostBtn').onclick = async () => {
    if (!confirm("Eliminare il post?")) return;
    const auth = await getAuthData();
    const id = document.getElementById('postId').value;
    
    const res = await fetch(`${API_BASE}/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${auth.token}` }
    });

    if (res.ok) {
        closePostModal();
        calendar.refetchEvents();
    }
};

// --- UTILS ---
async function getAuthData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '../login/login.html'; return null; }
    return { token: session.access_token, userId: session.user.id };
}

function getPlatformColor(p) {
    const c = { 'INSTAGRAM': '#e1306c', 'LINKEDIN': '#0077b5', 'TIKTOK': '#000000', 'FACEBOOK': '#1877f2', 'TELEGRAM': '#0088cc' };
    return c[p] || '#6366f1';
}