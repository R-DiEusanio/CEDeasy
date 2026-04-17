import { supabase } from '../api/supabase.js'

const loginForm = document.getElementById('login-form');

loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    console.log("Tentativo di login per:", email);

    // 1. Chiamata a Supabase per il login
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("Errore di accesso: " + error.message);
    } else {
        // 2. Recuperiamo il ruolo dai metadati dell'utente
        const user = data.user;
        const role = user.user_metadata.role;

        console.log("Login effettuato come:", role);

        // 3. Reindirizzamento basato sul ruolo
        if (role === 'SMM') {
            window.location.href = '../smm/smm-dashboard.html';
        } else {
            window.location.href = '../client/client-dashboard.html';
        }
    }
});