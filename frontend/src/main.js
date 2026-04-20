// Importiamo il client centralizzato
import { supabase } from '/api/supabase.js'

// --- 1. LOGICA LINK MAGICO (Cattura brandId dall'URL) ---
const urlParams = new URLSearchParams(window.location.search);
const invitedBrandId = urlParams.get('brandId');

// --- LOGICA SELEZIONE RUOLO ---
const btnSmm = document.getElementById('role-smm');
const btnClient = document.getElementById('role-client');
const roleInput = document.getElementById('user-role');

const selectRole = (role) => {
    if (!roleInput) return;
    roleInput.value = role;

    if (role === 'SMM') {
        btnSmm.classList.add('border-indigo-500', 'bg-indigo-50');
        btnSmm.querySelector('span:nth-child(2)').classList.add('text-indigo-600');
        
        btnClient.classList.remove('border-indigo-500', 'bg-indigo-50');
        btnClient.classList.add('border-slate-100');
        btnClient.querySelector('span:nth-child(2)').classList.remove('text-indigo-600');
    } else {
        btnClient.classList.add('border-indigo-500', 'bg-indigo-50');
        btnClient.querySelector('span:nth-child(2)').classList.add('text-indigo-600');
        
        btnSmm.classList.remove('border-indigo-500', 'bg-indigo-50');
        btnSmm.classList.add('border-slate-100');
        btnSmm.querySelector('span:nth-child(2)').classList.remove('text-indigo-600');
    }
};

// Se l'utente arriva con un brandId, impostiamo automaticamente il ruolo "CLIENT"
if (invitedBrandId) {
    console.log("Invito rilevato per il brand:", invitedBrandId);
    selectRole('CLIENT');
    // Opzionale: nascondi i bottoni di selezione ruolo se vuoi che non cambino
    // document.querySelector('.grid.grid-cols-2').style.display = 'none';
}

btnSmm?.addEventListener('click', () => selectRole('SMM'));
btnClient?.addEventListener('click', () => selectRole('CLIENT'));

// --- LOGICA REGISTRAZIONE ---
const regForm = document.getElementById('reg-form');

regForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('full_name').value;
    const role = roleInput.value;

    console.log("Tentativo di registrazione per:", fullName, "come", role);

    // Chiamata a Supabase Auth
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: role,
                // Aggiungiamo il brand_id nei metadati dell'utente
                brand_id: invitedBrandId 
            }
        }
    });

    if (error) {
        alert("Errore: " + error.message);
    } else {
        console.log("Registrazione riuscita, dati:", data);

        // Se la registrazione ha avuto successo e abbiamo un brandId, 
        // aggiorniamo la tabella 'profiles' per rendere il dato permanente nel DB
        if (data.user && invitedBrandId) {
            await supabase
                .from('profiles')
                .update({ brand_id: invitedBrandId })
                .eq('id', data.user.id);
        }

        alert("Benvenuto in CEDeasy!");

        if (role === 'SMM') {
            window.location.href = '../smm/smm-dashboard.html';
        } else {
            window.location.href = '../client/client-dashboard.html';
        }
    }
});