const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(resolve => setTimeout(resolve, reduce ? 0 : ms));
const $ = (selector, root = document) => root.querySelector(selector);

// ============================================
// CONSOLE
// ============================================

// Réponse « API » de chaque section, affichée dans la console de la carte
// quand la section arrive à l'écran. Résumé du contenu de la page : à tenir à
// jour à la main si le HTML change.
const api = {
    '/': { nom: 'Dorian Vidal', role: 'Développeur logiciel', formation: 'BUT Informatique', ville: 'Rodez', dispo: ['stage', 'alternance'] },
    '/projets': { total: 7, termines: 6, en_cours: 1, stack: ['C#', 'PHP', 'Java'] },
    '/a-propos': { formation: 'BUT Informatique', annee: 3, ville: 'Rodez, France', dispo: ['stage', 'alternance'] },
    '/competences': { langages: 5, frontend: 4, backend: 5, donnees: 2, outils: 8 },
    '/contact': { mail: 'dorian.vidal@iut-rodez.fr', linkedin: 'in/dorian-vidal', github: 'vidal-dorian' }
};

// JSON indenté, tableaux gardés sur une ligne, une <span> colorée par jeton.
function render(data) {
    return JSON.stringify(data, null, 2)
        .replace(/\[\s+([^\]]*?)\s+\]/g, (match, items) => '[' + items.replace(/,\s+/g, ', ') + ']')
        .split('\n')
        .map((line, i) => `<span class="ln" style="--i:${i}">` + line.replace(
            /("[^"]*")(:)?|\b(\d+)\b/g,
            (match, string, colon, number) => string
                ? `<span class="${colon ? 'k' : 's'}">${string}</span>${colon || ''}`
                : `<span class="n">${number}</span>`
        ) + '</span>')
        .join('');
}

const consolePath = $('.console .path');
const consoleStatus = $('.console .status');
const consoleBody = $('.console .res');
const consoleTime = $('.console .ms');
let lastCall = 0;
let currentPath;

// Tape la requête puis affiche la réponse. Un nouvel appel annule le précédent.
async function request(path) {
    if (path === currentPath) return;
    currentPath = path;
    const call = ++lastCall;
    consoleStatus.textContent = '…';
    consoleBody.innerHTML = '';
    for (let i = 1; i <= path.length; i++) {
        consolePath.textContent = path.slice(0, i);
        await sleep(30);
        if (call !== lastCall) return;
    }
    await sleep(200);
    if (call !== lastCall) return;
    consoleStatus.textContent = '200 OK';
    consoleTime.textContent = 8 + Math.floor(Math.random() * 30) + ' ms';
    consoleBody.innerHTML = render(api[path]);
}

// ============================================
// NAVIGATION
// ============================================

// La section qui traverse le milieu de l'écran devient la section active :
// son lien est souligné dans la barre et la console l'« appelle ».
const navLinks = document.querySelectorAll('.bar nav a');
const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    navLinks.forEach(link => link.classList.toggle('on', link.hash === '#' + id));
    request(id === 'accueil' ? '/' : '/' + id);
    const tag = $('.tag', entry.target).lastChild;
    scramble(tag, label(tag));
}), { rootMargin: '-50% 0px -50% 0px' });
document.querySelectorAll('main section').forEach(section => sectionObserver.observe(section));
request('/'); // sur mobile la carte passe avant l'accueil : on n'attend pas le scroll pour le premier appel

// Le bloc « En ce moment » déplie le projet vers lequel il pointe.
$('.now').addEventListener('click', event => { $(event.currentTarget.hash).open = true; });

// ============================================
// TEXTES ANIMÉS
// ============================================

// Brouillage : les lettres passent par des symboles de code avant de se poser.
const glyphs = '{}[]<>/=;:#_';
const label = node => node.label ??= node.textContent; // texte d'origine, mémorisé avant le premier brouillage

function scramble(node, text, speed = 30) {
    if (reduce) return;
    clearInterval(node.timer);
    let frame = 0;
    node.timer = setInterval(() => {
        node.textContent = [...text]
            .map((letter, i) => i < frame / 2 || letter === ' ' ? letter : glyphs[Math.floor(Math.random() * glyphs.length)])
            .join('');
        if (++frame > text.length * 2) clearInterval(node.timer);
    }, speed);
}

// Mot tournant du titre d'accueil.
const swap = $('.swap');
const words = ['logiciel', 'web', 'backend'];
let wordIndex = 0;
if (!reduce) setInterval(() => scramble(swap, words[++wordIndex % words.length], 45), 3200);

// Les liens du menu se brouillent au survol.
navLinks.forEach(link => link.addEventListener('pointerenter', () => scramble(link, label(link))));

// Première ligne de chaque grand titre découpée en lettres, pour les animer une
// à une. Le texte complet reste dans un <span class="sr"> pour les lecteurs d'écran.
document.querySelectorAll('.big').forEach(title => {
    const first = title.firstChild;
    const text = first.textContent.trim();
    const letters = document.createElement('b');
    letters.ariaHidden = 'true';
    letters.innerHTML = [...text].map((letter, i) => letter === ' ' ? ' ' : `<i style="--i:${i}">${letter}</i>`).join('');
    first.replaceWith(Object.assign(document.createElement('span'), { className: 'sr', textContent: text + ' ' }), letters);
});

// Rang de chaque élément parmi ses frères, lu par le CSS (--i) pour décaler les apparitions.
document.querySelectorAll('.body > *, .stack li').forEach(element => {
    element.style.setProperty('--i', [...element.parentNode.children].indexOf(element));
});

// Les chiffres de l'accueil comptent depuis zéro la première fois qu'on les voit.
const statObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    statObserver.unobserve(entry.target);
    const digit = entry.target.firstChild;
    const end = Number(digit.textContent);
    let count = 0;
    digit.textContent = count;
    const timer = setInterval(() => {
        digit.textContent = ++count;
        if (count >= end) clearInterval(timer);
    }, 140);
}));
if (!reduce) document.querySelectorAll('.stats dd').forEach(stat => statObserver.observe(stat));

// ============================================
// DÉCOR
// ============================================

// Bandeau défilant : la liste est dupliquée pour boucler sans raccord.
$('.marquee').append($('.marquee ul').cloneNode(true));

// Paquets de données qui filent le long du quadrillage de fond.
if (!reduce) {
    const CELL = 56; // même pas que le quadrillage dessiné par body::before
    const TRAIL = 140;
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent');
    const canvas = document.body.appendChild(Object.assign(document.createElement('canvas'), { className: 'packets' }));
    const context = canvas.getContext('2d');
    let packets = [];

    const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
    resize();
    addEventListener('resize', resize);

    (function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (packets.length < 5 && Math.random() < .03) {
            const horizontal = Math.random() < .5;
            const lines = Math.floor((horizontal ? canvas.height : canvas.width) / CELL);
            packets.push({ horizontal, line: Math.floor(Math.random() * lines) * CELL + .5, at: 0, speed: 3 + Math.random() * 4 });
        }
        packets = packets.filter(packet => {
            packet.at += packet.speed;
            const [x1, y1, x2, y2] = packet.horizontal
                ? [packet.at - TRAIL, packet.line, packet.at, packet.line]
                : [packet.line, packet.at - TRAIL, packet.line, packet.at];
            const trail = context.createLinearGradient(x1, y1, x2, y2);
            trail.addColorStop(0, 'transparent');
            trail.addColorStop(1, accent);
            context.strokeStyle = trail;
            context.lineWidth = 1.5;
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.stroke();
            return packet.at - TRAIL < (packet.horizontal ? canvas.width : canvas.height);
        });
        requestAnimationFrame(draw);
    })();
}

// ============================================
// POINTEUR
// ============================================

// Halo de fond qui suit le curseur.
addEventListener('pointermove', event => {
    document.documentElement.style.setProperty('--mx', event.clientX + 'px');
    document.documentElement.style.setProperty('--my', event.clientY + 'px');
});

// Effets réservés à la souris (pas d'équivalent au doigt).
if (matchMedia('(pointer: fine)').matches && !reduce) {
    // Aperçu de projet (.peek) : il suit le curseur avec un léger retard.
    const peek = document.body.appendChild(Object.assign(new Image(), { className: 'peek', alt: '' }));
    let x = 0, y = 0, targetX = 0, targetY = 0;

    addEventListener('pointermove', event => {
        targetX = event.clientX;
        targetY = event.clientY;
    });

    (function follow() {
        x += (targetX - x) * .18;
        y += (targetY - y) * .18;
        peek.style.translate = `${Math.min(x + 28, innerWidth - 340)}px ${y - 100}px`;
        requestAnimationFrame(follow);
    })();

    // Survol d'un projet fermé qui a une capture d'écran : elle apparaît près du curseur.
    document.querySelectorAll('.rows details').forEach(details => {
        const shot = $('img', details);
        if (!shot) return;
        const summary = $('summary', details);
        summary.addEventListener('pointerenter', () => {
            peek.src = shot.src;
            peek.classList.toggle('on', !details.open);
        });
        summary.addEventListener('pointerleave', () => peek.classList.remove('on'));
        summary.addEventListener('click', () => peek.classList.remove('on'));
    });

    // La carte d'identité s'incline vers le curseur ; --cx / --cy placent son reflet.
    const card = $('.id');
    card.addEventListener('pointermove', event => {
        const box = card.getBoundingClientRect();
        const px = (event.clientX - box.left) / box.width;
        const py = (event.clientY - box.top) / box.height;
        card.style.transform = `perspective(900px) rotateX(${(.5 - py) * 5}deg) rotateY(${(px - .5) * 5}deg)`;
        card.style.setProperty('--cx', px * 100 + '%');
        card.style.setProperty('--cy', py * 100 + '%');
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });

    // Boutons « aimantés » : ils se décalent légèrement vers le curseur.
    document.querySelectorAll('.cta .btn, .socials a').forEach(button => {
        button.addEventListener('pointermove', event => {
            const box = button.getBoundingClientRect();
            button.style.translate = `${(event.clientX - box.left - box.width / 2) * .25}px ${(event.clientY - box.top - box.height / 2) * .35}px`;
        });
        button.addEventListener('pointerleave', () => { button.style.translate = ''; });
    });
}

// ============================================
// DIVERS
// ============================================

// Heure locale à Rodez dans la barre du haut.
const clock = $('.clock time');
function updateClock() {
    clock.textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
}
updateClock();
setInterval(updateClock, 30000);

// Bouton « Copier » de l'adresse mail.
const copyButton = $('.copy');
copyButton.addEventListener('click', async () => {
    await navigator.clipboard.writeText($('.mail a').textContent);
    copyButton.textContent = 'Copié ✓';
    setTimeout(() => { copyButton.textContent = 'Copier'; }, 1500);
});
