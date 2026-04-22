import { supabase } from '../api/supabase.js';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/brands`;

// --- UTILITY PER AUTH ---
// Recupera il token e l'ID utente da Supabase
async function getAuthData() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
        console.error("Sessione non trovata, reindirizzo al login");
        window.location.href = '../login/login.html';
        return null;
    }
    return {
        token: session.access_token,
        userId: session.user.id
    };
}

// --- GESTIONE MODALI (Apertura/Chiusura) ---
window.openModal = function(mode, brandData = null) {
    const modal = document.getElementById('brandModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('brandForm');
    
    if (!modal || !form) return;

    form.reset();
    document.getElementById('brandId').value = "";

    if (mode === 'edit' && brandData) {
        title.innerText = "Modifica Cliente";
        document.getElementById('brandId').value = brandData.id;
        document.getElementById('name').value = brandData.name;
        document.getElementById('ownerName').value = brandData.ownerName || "";
        document.getElementById('email').value = brandData.email || "";
        document.getElementById('phone').value = brandData.phone || "";
        document.getElementById('instagramUrl').value = brandData.instagramUrl || "";
        document.getElementById('tiktokUrl').value = brandData.tiktokUrl || "";
        document.getElementById('facebookUrl').value = brandData.facebookUrl || "";
        document.getElementById('telegramUrl').value = brandData.telegramUrl || "";
        document.getElementById('linkedinUrl').value = brandData.linkedinUrl || "";
    } else {
        title.innerText = "Nuovo Cliente";
    }

    modal.classList.remove('opacity-0', 'pointer-events-none');
    document.body.classList.add('modal-active');
}

window.closeModal = function() {
    const modal = document.getElementById('brandModal');
    if (modal) {
        modal.classList.add('opacity-0', 'pointer-events-none');
        document.body.classList.remove('modal-active');
    }
}

// --- CARICAMENTO TABELLA CRM ---
async function loadCRMTable() {
    const tableBody = document.getElementById('crmTableBody');
    if (!tableBody) return;

    const auth = await getAuthData();
    if (!auth) return;

    try {
        const response = await fetch(`${API_BASE}/smm/${auth.userId}`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });

        if (!response.ok) throw new Error("Errore: " + response.status);

        const brands = await response.json();
        tableBody.innerHTML = brands.map(brand => `
            <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
                <td class="p-4 font-bold text-indigo-600">${brand.name}</td>
                <td class="p-4 text-slate-700">${brand.ownerName || '-'}</td>
                <td class="p-4">
                    <div class="flex gap-2 text-lg">
                        ${brand.instagramUrl ? '📸' : ''} 
                        ${brand.tiktokUrl ? '📱' : ''} 
                        ${brand.facebookUrl ? '👥' : ''}
                        ${brand.telegramUrl ? '✈️' : ''} 
                        ${brand.linkedinUrl ? '🔗' : ''}
                    </div>
                </td>
                <td class="p-4 text-right">
                    <a href="smm-calendar.html?brandId=${brand.id}" 
                       class="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-bold text-sm mr-3 hover:bg-indigo-200 transition">
                       📅 Calendario
                    </a>
                    
                    <button onclick='prepareEdit("${brand.id}")' class="text-blue-500 font-bold mr-3 hover:underline text-sm">Modifica</button>
                    <button onclick="deleteBrand('${brand.id}')" class="text-red-500 font-bold hover:underline text-sm">Elimina</button>
                </td>
            </tr>
        `).join('');
    } catch (e) { 
        console.error("Errore caricamento:", e); 
        tableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">Errore nel caricamento dei dati.</td></tr>`;
    }
}

// --- PREPARA MODIFICA (Recupera dati del singolo brand) ---
window.prepareEdit = async function(id) {
    const auth = await getAuthData();
    if (!auth) return;

    try {
        // Recuperiamo la lista aggiornata per trovare il brand da modificare
        const response = await fetch(`${API_BASE}/smm/${auth.userId}`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const brands = await response.json();
        const brand = brands.find(b => b.id === id);
        if (brand) window.openModal('edit', brand);
    } catch (e) { console.error("Errore nel recupero dati per modifica:", e); }
}

// --- ELIMINAZIONE ---
window.deleteBrand = async function(id) {
    if (!confirm("Eliminare definitivamente questo cliente? Verranno eliminati anche tutti i suoi post.")) return;
    
    const auth = await getAuthData();
    if (!auth) return;

    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });

        if (response.ok) {
            loadCRMTable();
        } else {
            alert("Errore durante l'eliminazione.");
        }
    } catch (e) { console.error("Errore eliminazione:", e); }
}

// --- INVIO FORM (SALVATAGGIO / UPDATE) ---
document.getElementById('brandForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const auth = await getAuthData();
    if (!auth) return;

    const brandId = document.getElementById('brandId').value;
    const payload = {
        name: document.getElementById('name').value,
        ownerName: document.getElementById('ownerName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        instagramUrl: document.getElementById('instagramUrl').value,
        tiktokUrl: document.getElementById('tiktokUrl').value,
        facebookUrl: document.getElementById('facebookUrl').value,
        telegramUrl: document.getElementById('telegramUrl').value,
        linkedinUrl: document.getElementById('linkedinUrl').value,
        smmId: auth.userId
    };

    const method = brandId ? 'PUT' : 'POST';
    const url = brandId ? `${API_BASE}/${brandId}` : API_BASE;

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.token}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            window.closeModal();
            loadCRMTable();
        } else {
            const errorData = await response.json();
            alert("Errore salvataggio: " + (errorData.message || response.status));
        }
    } catch (e) { 
        console.error("Errore durante l'invio del form:", e);
        alert("Errore di connessione col server.");
    }
});

// Avvio automatico al caricamento della pagina
document.addEventListener('DOMContentLoaded', loadCRMTable);