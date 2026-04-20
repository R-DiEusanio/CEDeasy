import { supabase } from '../api/supabase.js';

const API_BASE = "http://localhost:8080/api";
let calendar;
let currentPostId = null;
let currentBrandId = null;

// --- 1. INIZIALIZZAZIONE ALL'AVVIO ---
document.addEventListener('DOMContentLoaded', async () => {
    const auth = await getAuthData();
    if (!auth) return;

    // Recuperiamo i dati del profilo per sapere quale Brand appartiene a questo cliente
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', auth.userId).single();
    
    // Mostriamo il nome del cliente nell'interfaccia
    document.getElementById('clientName').innerText = profile?.full_name || "Cliente";
    
    // Inizializziamo il calendario per il brand associato
    if (profile?.brand_id) {
        currentBrandId = profile.brand_id; // Salvalo nella variabile globale
        initClientCalendar(profile.brand_id, auth.token);
        loadBrandInfo(profile.brand_id, auth.token);
    } else {
        alert("Errore: Nessun brand associato a questo account.");
    }
});

// --- 2. CARICAMENTO INFO BRAND E STATISTICHE ---
async function loadBrandInfo(brandId, token) {
    try {
        const res = await fetch(`${API_BASE}/posts/brand/${brandId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const posts = await res.json();

        // Usiamo .toUpperCase() per sicurezza
        const pending = posts.filter(p => p.status?.toUpperCase() === 'PENDING').length;
        const approved = posts.filter(p => p.status?.toUpperCase() === 'APPROVED').length;
        
        document.getElementById('count-pending').innerText = pending;
        document.getElementById('count-approved').innerText = approved;
        document.getElementById('current-month').innerText = new Intl.DateTimeFormat('it-IT', { month: 'long' }).format(new Date());

        // Gestione alert notifiche
        if (pending > 0) {
            // Se volessi mostrare un alert specifico nel dom, potresti farlo qui
        }
    } catch (err) {
        console.error("Errore statistiche:", err);
    }
}

// --- 3. CONFIGURAZIONE CALENDARIO ---
function initClientCalendar(brandId, token) {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'it',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listWeek'
        },
        events: async (info, success, failure) => {
            try {
                const res = await fetch(`${API_BASE}/posts/brand/${brandId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const posts = await res.json();
                
                success(posts.map(p => ({
                    id: p.id,
                    title: (p.scheduledTime ? p.scheduledTime + " - " : "") + p.title,
                    start: p.scheduledDate,
                    backgroundColor: getStatusColor(p.status),
                    extendedProps: p
                })));
            } catch (err) { failure(err); }
        },
        eventClick: (info) => openModal(info.event.extendedProps)
    });

    calendar.render();
}

// --- 4. GESTIONE MODALE ---
window.openModal = function(post) {
    // Reset dello stato del box commenti ogni volta che apro il modale
    document.getElementById('revisionNoteBox').classList.add('hidden');
    document.getElementById('revisionComment').value = "";
    
    currentPostId = post.id;
    const modal = document.getElementById('postModal');
    
    // Titolo e Contenuto
    document.getElementById('modalTitle').innerText = post.title;
    document.getElementById('modalContent').innerText = post.content || "Nessun testo inserito.";
    
    // ORARIO: Mostriamo solo l'orario letterale (es. 10:25)
    // Se per caso è vuoto, mettiamo dei trattini
    document.getElementById('modalTime').innerText = post.scheduledTime || "--:--";
    
    // Gestione Badge Stato (come prima)
    const badge = document.getElementById('modalStatusBadge');
    badge.innerText = post.status;
    badge.className = `px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${getStatusBadgeClass(post.status)}`;

    // Icona Piattaforma dinamica
    const platformIcons = { 'INSTAGRAM': '📸', 'LINKEDIN': '💼', 'TIKTOK': '🎵', 'FACEBOOK': '👥' };
    document.getElementById('platformIcon').innerText = platformIcons[post.platform?.toUpperCase()] || '📱';

    // Gestione Link Media
    const mediaBox = document.getElementById('mediaBox');
    if (post.mediaLink) {
        mediaBox.classList.remove('hidden');
        document.getElementById('modalMediaLink').href = post.mediaLink;
    } else {
        mediaBox.classList.add('hidden');
    }

    // Gestione Visibilità Bottoni (Se già approvato o in revisione, nascondiamo i bottoni)
    const actions = document.getElementById('modalActions');
    const footerMsg = document.getElementById('modalFooterMessage');
    
    if (post.status === 'PENDING') {
        actions.classList.remove('hidden');
        footerMsg.classList.add('hidden');
    } else {
        actions.classList.add('hidden');
        footerMsg.classList.remove('hidden');
    }

    modal.classList.remove('hidden');
};

window.closeModal = () => document.getElementById('postModal').classList.add('hidden');

// --- 5. AZIONE: APPROVAZIONE / RICHIESTA MODIFICA ---
window.updatePostStatus = async function(newStatus) {
    if (!currentPostId) return;

    const commentBox = document.getElementById('revisionNoteBox');
    const commentTextArea = document.getElementById('revisionComment');
    const commentText = commentTextArea.value;

    // --- LOGICA A DUE TEMPI PER LA REVISIONE ---
    if (newStatus === 'REVISION_REQUESTED' && commentBox.classList.contains('hidden')) {
        // Primo click: mostriamo il campo di testo e cambiamo il focus
        commentBox.classList.remove('hidden');
        commentTextArea.focus();
        return; // ESCIAMO DALLA FUNZIONE SENZA CHIAMARE IL SERVER
    }

    // --- SE ARRIVIAMO QUI, PROCEDIAMO CON IL SALVATAGGIO ---
    const auth = await getAuthData();
    try {
        // 1. Aggiorniamo lo STATO del post
        const res = await fetch(`${API_BASE}/posts/${currentPostId}/status`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.token}` 
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            // 2. Se è una revisione ed è stato scritto un commento, lo salviamo
            if (newStatus === 'REVISION_REQUESTED' && commentText.trim() !== "") {
                await fetch(`${API_BASE}/posts/${currentPostId}/comments`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': `Bearer ${auth.token}` 
                    },
                    body: JSON.stringify({ body: commentText })
                });
            }

            // Pulizia e chiusura
            commentTextArea.value = ""; 
            commentBox.classList.add('hidden');
            closeModal();
            calendar.refetchEvents();
            loadBrandInfo(currentBrandId, auth.token);
        } else {
            alert("Errore nell'aggiornamento.");
        }
    } catch (err) {
        console.error("Errore post-revisione:", err);
    }
};

// --- UTILS ---
async function getAuthData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '../login/login.html';
        return null;
    }
    return { token: session.access_token, userId: session.user.id };
}

function getStatusColor(status) {
    const s = status?.toUpperCase(); // Forza tutto in maiuscolo
    const colors = {
        'PENDING': '#f59e0b',            // Arancione
        'APPROVED': '#10b981',           // Verde
        'REVISION_REQUESTED': '#ef4444', // Rosso
        'PUBLISHED': '#6366f1'           // Viola
    };
    return colors[s] || '#94a3b8';       // Grigio se non trova nulla
}

function getStatusBadgeClass(status) {
    const s = status?.toUpperCase(); // Forza tutto in maiuscolo
    const classes = {
        'PENDING': 'bg-amber-100 text-amber-600',
        'APPROVED': 'bg-emerald-100 text-emerald-600',
        'REVISION_REQUESTED': 'bg-red-100 text-red-600',
        'PUBLISHED': 'bg-indigo-100 text-indigo-600'
    };
    return classes[s] || 'bg-slate-100 text-slate-600';
}

window.handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '../login/login.html';
};