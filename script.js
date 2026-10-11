const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (selector, root = document) => root.querySelector(selector);

// ============================================
// NAVIGATION
// ============================================

// La section qui traverse le milieu de l'écran devient la section active dans la barre.
const navLinks = document.querySelectorAll('.bar nav a');
const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => link.classList.toggle('on', link.hash === '#' + entry.target.id));
}), { rootMargin: '-50% 0px -50% 0px' });
document.querySelectorAll('.hero, main section, .foot').forEach(section => sectionObserver.observe(section));

// Tout en haut de la page la barre est transparente sur le rouge de l'accueil ;
// dès qu'on défile elle retrouve son fond papier.
const bar = $('.bar');
const updateBar = () => bar.classList.toggle('light', scrollY < 16);
addEventListener('scroll', updateBar, { passive: true });
updateBar();

// ============================================
// PAGES PROJET
// ============================================

// Chaque projet est un <dialog> ouvert quand l'adresse se termine par son #id :
// le bouton « précédent » du navigateur le referme et le lien d'un projet se partage.
const works = [...document.querySelectorAll('dialog.work')];
const workAt = hash => works.find(work => '#' + work.id === hash);
let openedFromPage = false; // faux si on est arrivé directement sur l'adresse d'un projet

function syncWork(event) {
    const target = workAt(location.hash);
    works.forEach(work => { if (work !== target && work.open) work.close(); });
    if (target && !target.open) {
        if (event && !workAt(new URL(event.oldURL).hash)) openedFromPage = true;
        target.showModal();
        target.scrollTop = 0;
    }
}

works.forEach(work => {
    // Fermé par Échap ou par « Retour » : on revient à l'entrée précédente de l'historique,
    // ce qui retire l'ancre sans toucher à la position de la page derrière.
    work.addEventListener('close', () => {
        if (location.hash !== '#' + work.id) return;
        if (openedFromPage) history.back();
        else history.replaceState(null, '', location.pathname + location.search);
    });

    // « Projet suivant » remplace l'entrée d'historique au lieu d'en empiler une par projet :
    // un seul retour arrière suffit toujours pour revenir à la page.
    work.addEventListener('click', event => {
        const link = event.target.closest('a[href^="#"]');
        if (!link || !workAt(link.hash)) return;
        event.preventDefault();
        location.replace(link.hash);
    });
});

addEventListener('hashchange', syncWork);
syncWork();

// ============================================
// INCLINAISONS
// ============================================

// Les blocs arrivent de travers et se posent droit. Le CSS le fait avec des animations
// liées au scroll ; cette classe .in ne sert qu'aux navigateurs qui ne les gèrent pas.
const tiltObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    entry.target.classList.toggle('in', entry.isIntersecting);
}), { threshold: .2 });
document.querySelectorAll('.sheet, .card, .work .stage, .shot, .node').forEach(block => tiltObserver.observe(block));

// ============================================
// TEXTES ANIMÉS
// ============================================

// Mot tournant de l'accueil : les lettres passent par des symboles de code avant de se poser.
const swap = $('.swap');
const words = ['logiciel', 'web', 'backend'];
const glyphs = '{}[]<>/=;:#_';
let wordIndex = 0;

function scramble(text) {
    let frame = 0;
    const timer = setInterval(() => {
        swap.textContent = [...text]
            .map((letter, i) => i < frame / 2 ? letter : glyphs[Math.floor(Math.random() * glyphs.length)])
            .join('');
        if (++frame > text.length * 2) clearInterval(timer);
    }, 45);
}

if (!reduce) setInterval(() => scramble(words[++wordIndex % words.length]), 3200);

// Grands titres découpés en lettres, pour les animer une à une. Le texte
// complet reste dans un <span class="sr"> pour les lecteurs d'écran.
document.querySelectorAll('.big').forEach(title => {
    const text = title.textContent.trim();
    const letters = document.createElement('b');
    letters.ariaHidden = 'true';
    letters.innerHTML = [...text].map((letter, i) => letter === ' ' ? ' ' : `<i style="--i:${i}">${letter}</i>`).join('');
    title.replaceChildren(Object.assign(document.createElement('span'), { className: 'sr', textContent: text }), letters);
});

// Les chiffres d'« À propos » comptent depuis zéro la première fois qu'on les voit.
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
}), { threshold: 1 });
if (!reduce) document.querySelectorAll('.stats dd').forEach(stat => statObserver.observe(stat));

// ============================================
// DIVERS
// ============================================

// Heure locale à Rodez dans la barre du haut.
const clock = $('.place time');
function updateClock() {
    clock.textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
}
updateClock();
setInterval(updateClock, 30000);

// Taille réelle de la fenêtre du visiteur, affichée en bas de l'accueil.
const viewport = $('.viewport');
function updateViewport() {
    viewport.textContent = `${innerWidth} × ${innerHeight}`;
}
updateViewport();
addEventListener('resize', updateViewport);

// Bouton « Copier » de l'adresse mail.
const copyButton = $('.copy');
copyButton.addEventListener('click', async () => {
    await navigator.clipboard.writeText($('.mail a').textContent);
    copyButton.textContent = 'Copié ✓';
    setTimeout(() => { copyButton.textContent = 'Copier'; }, 1500);
});
