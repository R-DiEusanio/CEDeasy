import { supabase } from '/api/supabase.js'
import { fetchComments, renderComments } from './comments.js'
// --- STATO DELL'APP ---
let userProfile = null;

async function init() {
    // 1. Verifica sessione
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = '../index.html';

    // 2. Carica Profilo (Tabella profiles)
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (error) {
        console.error("Errore profilo:", error);
        return;
    }

    userProfile = profile;
    document.getElementById('user-display-name').innerText = profile.full_name;
    document.getElementById('user-role-badge').innerText = profile.role;

    // 3. Disegna Calendario
    renderCalendar();
}

// --- LOGICA CALENDARIO ---
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = ''; // Pulizia

    for (let i = 1; i <= 31; i++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.innerHTML = `
            <div class="flex justify-between items-start">
                <span class="text-xs font-bold text-slate-400 group-hover:text-indigo-600">${i}</span>
            </div>
            <div class="mt-2" id="posts-day-${i}"></div>
        `;
        cell.onclick = () => openPostModal(i);
        grid.appendChild(cell);
    }
}

// --- GESTIONE MODAL POST ---
async function openPostModal(day) {
    const modal = document.getElementById('post-modal');
    const title = document.getElementById('modal-post-title');
    const content = document.getElementById('modal-post-content');

    // Per ora scriviamo dati di test basati sul giorno cliccato
    title.innerText = `Post del giorno ${day}`;
    content.innerText = `Stai visualizzando i dettagli e i feedback per la pubblicazione del ${day} Aprile.`;

    // Carichiamo i commenti (usiamo un ID fake o reale se ce l'hai)
    // Per ora fetchComments restituirà un array vuoto se l'ID non esiste
    const comments = await fetchComments('00000000-0000-0000-0000-000000000000'); 
    renderComments(comments);

    modal.classList.remove('hidden');
}

// --- LOGICA DI CHIUSURA ---
const modal = document.getElementById('post-modal');
const closeBtn = document.getElementById('close-modal');

const closeModal = () => {
    modal.classList.add('hidden');
};

closeBtn?.addEventListener('click', closeModal);

modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// --- INVIO COMMENTI ---
const commentForm = document.getElementById('comment-form');
commentForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('comment-input');
    const commentText = input.value.trim();

    if (commentText) {
        console.log("Inviando commento:", commentText, "da parte di:", userProfile.full_name);
        // Qui aggiungeremo la funzione insertComment verso Supabase!
        input.value = '';
    }
});

// Avvio
init();