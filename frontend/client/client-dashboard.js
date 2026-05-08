import { supabase } from '../api/supabase.js';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;
let calendar;
let currentPostId = null;
let currentBrandId = null;
let allClientPosts = [];

document.addEventListener('DOMContentLoaded', async () => {
    const auth = await getAuthData();
    if (!auth) return;

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', auth.userId).single();
    document.getElementById('clientName').innerText = profile?.full_name || "Cliente";

    if (profile?.brand_id) {
        currentBrandId = profile.brand_id;
        const isMobile = window.innerWidth < 768;

        if (isMobile) {
            document.getElementById('calendar-view').classList.add('hidden');
            document.getElementById('feed-view').classList.remove('hidden');
            loadClientFeed(profile.brand_id, auth.token);
        } else {
            initClientCalendar(profile.brand_id, auth.token);
        }
        loadBrandInfo(profile.brand_id, auth.token);
    }
});

async function loadBrandInfo(brandId, token) {
    try {
        const res = await fetch(`${API_BASE}/posts/brand/${brandId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const posts = await res.json();

        // FILTRO: Contiamo solo i post che NON sono in PENDING
        const toReview = posts.filter(p => p.status?.toUpperCase() === 'REVISION_REQUESTED').length;
        const approved = posts.filter(p => p.status?.toUpperCase() === 'APPROVED').length;

        document.getElementById('count-pending').innerText = toReview; // Ora mostra solo quelli che deve davvero vedere
        document.getElementById('count-approved').innerText = approved;
        document.getElementById('current-month').innerText = new Intl.DateTimeFormat('it-IT', { month: 'long' }).format(new Date());
    } catch (err) { console.error("Errore statistiche:", err); }
}

async function loadClientFeed(brandId, token) {
    const container = document.getElementById('clientFeed');
    container.innerHTML = '<p class="text-center text-slate-400 py-10">Caricamento post...</p>';
    try {
        const res = await fetch(`${API_BASE}/posts/brand/${brandId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const allPosts = await res.json();

        // FILTRO: Escludiamo i PENDING dalla lista del cliente
        allClientPosts = allPosts.filter(p => p.status?.toUpperCase() !== 'PENDING');

        allClientPosts.sort((a, b) => {
            const statusA = a.status?.toUpperCase();
            const statusB = b.status?.toUpperCase();
            if (statusA === 'REVISION_REQUESTED' && statusB !== 'REVISION_REQUESTED') return -1;
            if (statusA !== 'REVISION_REQUESTED' && statusB === 'REVISION_REQUESTED') return 1;
            return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        });

        if (allClientPosts.length === 0) {
            container.innerHTML = '<div class="bg-white p-8 rounded-3xl text-center text-slate-400 font-bold italic">Nessun post pronto per la revisione.</div>';
            return;
        }

        container.innerHTML = allClientPosts.map((p, i) => {
            const pencilIcon = p.status === 'REVISION_REQUESTED' ? '✎ ' : '';
            return `
                <div onclick="openModalByIndex(${i})" class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center active:scale-[0.98] transition-all cursor-pointer">
                    <div class="flex flex-col gap-1">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-black text-indigo-500 uppercase tracking-widest">${p.platform || 'POST'}</span>
                            <span class="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span class="text-[10px] text-slate-400 font-bold">${p.scheduledDate}</span>
                        </div>
                        <h4 class="font-bold text-slate-800 leading-tight">${pencilIcon}${p.title}</h4>
                    </div>
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm" style="background-color: ${getStatusColor(p.status)}20; color: ${getStatusColor(p.status)}">
                        ${p.status === 'APPROVED' ? '✅' : '🕒'}
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) { container.innerHTML = 'Errore feed.'; }
}

function initClientCalendar(brandId, token) {
    calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
        initialView: 'dayGridMonth',
        locale: 'it',
        events: async (info, success, failure) => {
            try {
                const res = await fetch(`${API_BASE}/posts/brand/${brandId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const posts = await res.json();

                // FILTRO: Escludiamo i PENDING dal calendario del cliente
                const filteredPosts = posts.filter(p => p.status?.toUpperCase() !== 'PENDING');

                success(filteredPosts.map(p => ({
                    id: p.id, title: (p.status === 'REVISION_REQUESTED' ? '✎ ' : '') + p.title,
                    start: p.scheduledDate, backgroundColor: getStatusColor(p.status), extendedProps: p
                })));
            } catch (err) { failure(err); }
        },
        eventClick: (info) => openModal(info.event.extendedProps)
    });
    calendar.render();
}

window.openModal = function (post) {
    currentPostId = post.id;
    document.getElementById('revisionNoteBox').classList.add('hidden');
    document.getElementById('revisionComment').value = "";
    document.getElementById('btnRevision').innerText = "Richiedi Modifica";
    document.getElementById('modalTitle').innerText = post.title;
    document.getElementById('modalContent').innerText = post.content || "Nessun testo.";
    document.getElementById('modalTime').innerText = post.scheduledTime || "--:--";
    const badge = document.getElementById('modalStatusBadge');
    badge.innerText = post.status === 'REVISION_REQUESTED' ? 'REVISIONE ✎' : post.status;
    badge.className = `px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${getStatusBadgeClass(post.status)}`;
    const platformIcons = { 'INSTAGRAM': '📸', 'LINKEDIN': '💼', 'TIKTOK': '🎵', 'FACEBOOK': '👥' };
    document.getElementById('platformIcon').innerText = platformIcons[post.platform?.toUpperCase()] || '📱';
    const mediaBox = document.getElementById('mediaBox');
    if (post.mediaLink) { mediaBox.classList.remove('hidden'); document.getElementById('modalMediaLink').href = post.mediaLink; } else { mediaBox.classList.add('hidden'); }
    if (post.status?.toUpperCase() === 'PENDING' || post.status?.toUpperCase() === 'REVISION_REQUESTED') {
        document.getElementById('modalActions').classList.remove('hidden');
        document.getElementById('modalFooterMessage').classList.add('hidden');
    } else {
        document.getElementById('modalActions').classList.add('hidden');
        document.getElementById('modalFooterMessage').classList.remove('hidden');
    }
    document.getElementById('postModal').classList.remove('hidden');
};

window.closeModal = () => document.getElementById('postModal').classList.add('hidden');

window.updatePostStatus = async function (newStatus) {
    if (!currentPostId) return;
    const commentBox = document.getElementById('revisionNoteBox');
    const commentTextArea = document.getElementById('revisionComment');
    const btnRev = document.getElementById('btnRevision');
    if (newStatus === 'REVISION_REQUESTED' && commentBox.classList.contains('hidden')) {
        commentBox.classList.remove('hidden');
        btnRev.innerText = "Invia Correzione";
        btnRev.classList.replace('bg-white', 'bg-red-500');
        btnRev.classList.replace('text-red-500', 'text-white');
        commentTextArea.focus();
        return;
    }
    const auth = await getAuthData();
    try {
        const res = await fetch(`${API_BASE}/posts/${currentPostId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
            if (newStatus === 'REVISION_REQUESTED' && commentTextArea.value.trim() !== "") {
                await fetch(`${API_BASE}/posts/${currentPostId}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` },
                    body: JSON.stringify({ body: commentTextArea.value })
                });
            }
            closeModal();
            const isMobile = window.innerWidth < 768;
            if (isMobile) loadClientFeed(currentBrandId, auth.token); else calendar.refetchEvents();
            loadBrandInfo(currentBrandId, auth.token);
        }
    } catch (err) { console.error(err); }
};

async function getAuthData() { const { data: { session } } = await supabase.auth.getSession(); if (!session) return null; return { token: session.access_token, userId: session.user.id }; }

function getStatusColor(status) {
    const colors = { 'PENDING': '#ef4444', 'APPROVED': '#10b981', 'REVISION_REQUESTED': '#f59e0b' };
    return colors[status?.toUpperCase()] || '#ef4444';
}

function getStatusBadgeClass(status) {
    const classes = { 'PENDING': 'bg-red-100 text-red-600', 'APPROVED': 'bg-emerald-100 text-emerald-600', 'REVISION_REQUESTED': 'bg-amber-100 text-amber-600' };
    return classes[status?.toUpperCase()] || 'bg-red-100 text-red-600';
}

window.handleLogout = async () => { await supabase.auth.signOut(); window.location.href = '../login/login.html'; };