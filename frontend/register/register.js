import { supabase } from '../api/supabase.js'

// --- 1. CONFIGURAZIONE INIZIALE ---
const urlParams = new URLSearchParams(window.location.search);
const invitedBrandId = urlParams.get('brandId');
const initialRole = urlParams.get('role') || 'SMM';

const regForm = document.getElementById('reg-form');
const fullNameInput = document.getElementById('full_name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const roleInput = document.getElementById('user-role');
const submitBtn = document.getElementById('submit-btn');
const submitText = document.getElementById('submit-text');
const submitLoader = document.getElementById('submit-loader');
const togglePasswordBtn = document.getElementById('toggle-password');
const eyeIcon = document.getElementById('eye-icon');
const nameError = document.getElementById('name-error');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');

// Imposta il ruolo
roleInput.value = initialRole;

// --- 2. VALIDAZIONE ---
const validateName = (name) => {
    const trimmed = name.trim();
    if (!trimmed) {
        return "Inserisci il tuo nome";
    }
    if (trimmed.length < 2) {
        return "Inserisci il tuo nome";
    }
    if (trimmed.length > 80) {
        return "Nome troppo lungo";
    }
    return null;
};

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
        return "Inserisci un'email valida";
    }
    if (!emailRegex.test(email)) {
        return "Inserisci un'email valida";
    }
    if (email.length > 255) {
        return "Email troppo lunga";
    }
    return null;
};

const validatePassword = (password) => {
    if (!password) {
        return "Almeno 8 caratteri";
    }
    if (password.length < 8) {
        return "Almeno 8 caratteri";
    }
    if (password.length > 128) {
        return "Password troppo lunga";
    }
    return null;
};

const clearErrors = () => {
    nameError.textContent = '';
    nameError.classList.add('hidden');
    emailError.textContent = '';
    emailError.classList.add('hidden');
    passwordError.textContent = '';
    passwordError.classList.add('hidden');
};

const displayErrors = (errors) => {
    if (errors.name) {
        nameError.textContent = errors.name;
        nameError.classList.remove('hidden');
    }
    if (errors.email) {
        emailError.textContent = errors.email;
        emailError.classList.remove('hidden');
    }
    if (errors.password) {
        passwordError.textContent = errors.password;
        passwordError.classList.remove('hidden');
    }
};

// --- 3. TOGGLE PASSWORD ---
togglePasswordBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    
    // Aggiorna l'icona
    eyeIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
    lucide.createIcons();
});

// --- 4. LOGICA REGISTRAZIONE ---
regForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    clearErrors();
    
    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const role = roleInput.value;
    
    // Validazione
    const errors = {};
    const nameErr = validateName(fullName);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    
    if (nameErr) errors.name = nameErr;
    if (emailErr) errors.email = emailErr;
    if (passwordErr) errors.password = passwordErr;
    
    if (Object.keys(errors).length > 0) {
        displayErrors(errors);
        return;
    }
    
    // Loading state
    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitLoader.classList.remove('hidden');
    
    console.log("Tentativo di registrazione per:", fullName, "come", role);
    
    try {
        // Chiamata a Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                    brand_id: invitedBrandId 
                }
            }
        });
        
        if (error) {
            alert("Errore: " + error.message);
            submitBtn.disabled = false;
            submitText.classList.remove('hidden');
            submitLoader.classList.add('hidden');
            return;
        }
        
        console.log("Registrazione riuscita:", data);
        
        // Se abbiamo un brandId, forziamo l'aggiornamento del profilo
        if (data.user && invitedBrandId) {
            await supabase
                .from('profiles')
                .update({ brand_id: invitedBrandId })
                .eq('id', data.user.id);
        }
        
        alert("Registrazione completata! Controlla la tua email per confermare.");
        
        // Reindirizzamento in base al ruolo
        if (role === 'SMM') {
            window.location.href = '../smm/smm-dashboard.html';
        } else {
            window.location.href = '../client/client-dashboard.html';
        }
    } catch (err) {
        console.error("Errore durante la registrazione:", err);
        alert("Si è verificato un errore. Riprova più tardi.");
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        submitLoader.classList.add('hidden');
    }
});