const menuButton = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');
const dropdownButton = document.querySelector('.dropdown-toggle');
const dropdown = document.querySelector('.dropdown');

function setMenu(open) {
    navLinks?.classList.toggle('open', open);
    menuButton?.setAttribute('aria-expanded', String(open));
    menuButton?.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (!open) setDropdown(false);
}

function setDropdown(open) {
    dropdown?.classList.toggle('is-open', open);
    dropdownButton?.setAttribute('aria-expanded', String(open));
    dropdownButton?.setAttribute('aria-label', open ? 'Hide service links' : 'Show service links');
}

menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
dropdownButton?.addEventListener('click', () => setDropdown(dropdownButton.getAttribute('aria-expanded') !== 'true'));
document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) setMenu(false);
});
document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (dropdownButton?.getAttribute('aria-expanded') === 'true') {
        setDropdown(false);
        dropdownButton.focus();
    } else if (menuButton?.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuButton.focus();
    }
});
window.matchMedia('(max-width: 1100px)').addEventListener('change', () => setMenu(false));

const filters = document.querySelectorAll('.filter-btn');
const cards = document.querySelectorAll('.project-card');
filters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    filters.forEach(filter => {
        const selected = filter === button;
        filter.classList.toggle('active', selected);
        filter.setAttribute('aria-pressed', String(selected));
    });
    let count = 0;
    cards.forEach(card => {
        card.hidden = category !== 'all' && card.dataset.category !== category;
        if (!card.hidden) count++;
    });
    const status = document.querySelector('.filter-status');
    if (status) status.textContent = `${count} projects shown for ${button.textContent.trim()}.`;
}));

document.getElementById('enquiryForm')?.addEventListener('submit', event => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const data = new FormData(event.currentTarget);
    for (const field of ['name', 'message']) {
        const input = event.currentTarget.elements.namedItem(field);
        input.setCustomValidity(input.value.trim() ? '' : 'Please enter your details.');
        if (!input.reportValidity()) return;
    }
    const subject = `I-TECH enquiry: ${data.get('service')}`;
    const body = `Name: ${data.get('name')}\nPhone: ${data.get('phone')}\nEmail: ${data.get('email')}\nService: ${data.get('service')}\n\n${data.get('message')}`;
    const url = `mailto:infinitetechnologysolutions6@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const help = document.getElementById('enquiry-help');
    help.textContent = 'Your draft is ready. Send it from your email app to complete your enquiry. If no app opened, ';
    const fallback = document.createElement('a');
    fallback.href = url; fallback.textContent = 'open your email draft';
    help.append(fallback, '. You can also call 0704004131.');
    window.location.href = url;
});

// Consent is a preference, never proof of authorization for sensitive actions.
(() => {
    const key = 'itech-consent-v1';
    const lifetime = 180 * 86400000;
    let choice;
    try {
        const raw = document.cookie.split('; ').find(row => row.startsWith(`${key}=`))?.slice(key.length + 1);
        choice = JSON.parse(raw ? decodeURIComponent(raw) : localStorage.getItem(key));
        if (choice?.version !== 1 || typeof choice.externalFonts !== 'boolean' || !Number.isFinite(choice.date) || Date.now() - choice.date > lifetime) choice = null;
    } catch { choice = null; }
    const dialog = document.createElement('dialog');
    dialog.className = 'consent-dialog';
    dialog.setAttribute('aria-labelledby', 'consent-title');
    dialog.setAttribute('aria-describedby', 'consent-description');
    dialog.innerHTML = `<h2 id="consent-title">Your privacy choices</h2>
        <p id="consent-description">We remember your choice with an essential cookie. With your permission, we load fonts from Google. We use no advertising or analytics trackers.</p>
        <p><a href="${location.pathname.includes('/pages/') ? '' : 'pages/'}privacy.html">Privacy &amp; cookie details</a></p>
        <div class="consent-preferences" hidden><p><strong>Essential preference cookie</strong> — always enabled to remember your choice.</p><label><input type="checkbox" id="external-fonts"> Allow external Google Fonts</label></div>
        <div class="consent-actions"><button type="button" data-choice="reject">Reject optional</button><button type="button" data-choice="accept">Accept all</button><button type="button" data-choice="manage">Manage preferences</button><button type="button" data-choice="save" hidden>Save preferences</button></div>`;
    document.body.append(dialog);
    function loadFonts() {
        if (!choice?.externalFonts || document.getElementById('consented-fonts')) return;
        const link = document.createElement('link');
        link.id = 'consented-fonts'; link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
        document.head.append(link);
    }
    let opener;
    function open() {
        opener = document.activeElement;
        dialog.querySelector('#external-fonts').checked = choice?.externalFonts ?? false;
        if (!dialog.open) dialog.showModal();
    }
    function close() { dialog.close(); opener?.focus(); }
    function save(externalFonts) {
        const wasEnabled = choice?.externalFonts;
        choice = {version: 1, externalFonts, date: Date.now()};
        const value = JSON.stringify(choice);
        try { document.cookie = `${key}=${encodeURIComponent(value)}; Max-Age=15552000; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`; } catch {}
        try { localStorage.setItem(key, value); } catch {}
        close();
        if (wasEnabled && !externalFonts) location.reload();
        else loadFonts();
    }
    dialog.addEventListener('click', event => {
        const action = event.target.closest('[data-choice]')?.dataset.choice;
        if (action === 'accept') save(true);
        if (action === 'reject') save(false);
        if (action === 'save') save(dialog.querySelector('#external-fonts').checked);
        if (action === 'manage') {
            dialog.querySelector('.consent-preferences').hidden = false;
            dialog.querySelector('[data-choice="save"]').hidden = false;
            dialog.querySelector('#external-fonts').focus();
        }
    });
    dialog.addEventListener('cancel', event => { event.preventDefault(); save(false); });
    document.querySelectorAll('.cookie-settings').forEach(button => button.addEventListener('click', open));
    loadFonts();
    if (!choice && !location.pathname.endsWith('/privacy.html')) open();
})();

['name', 'message'].forEach(id => document.getElementById(id)?.addEventListener('input', event => event.target.setCustomValidity('')));
