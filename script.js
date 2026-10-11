'use strict';

/**
 * Portfolio de Dorian Vidal : comportements de la page.
 *
 * Tout le contenu est dans index.html et le site reste lisible sans ce fichier. Il ajoute :
 *   1. Barre du haut   section active, transparence en haut de page, heure de Rodez
 *   2. Pages projet    ouverture / fermeture des <dialog> à partir de l'ancre de l'adresse
 *   3. Feuilles        focus clavier, repli pour les navigateurs sans animations de scroll
 *   4. Textes animés   mot tournant, titres découpés en lettres, chiffres qui comptent
 *   5. Divers          taille de la fenêtre, bouton « Copier »
 *
 * Chargé avec l'attribut defer : le DOM est complet quand ce code s'exécute.
 */

/** Vrai si le visiteur a demandé à son système de réduire les animations. */
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Premier élément correspondant au sélecteur.
 * @param {string} selector
 * @param {ParentNode} [root=document]
 * @returns {Element|null}
 */
const $ = (selector, root = document) => root.querySelector(selector);

/**
 * Tous les éléments correspondant au sélecteur, dans un vrai tableau.
 * @param {string} selector
 * @param {ParentNode} [root=document]
 * @returns {Element[]}
 */
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// ============================================
// 1. BARRE DU HAUT
// ============================================

const bar = $('.bar');
const navLinks = $$('nav a', bar);

// La section qui traverse le milieu de l'écran devient la section active. La marge de -50 %
// en haut et en bas réduit la zone observée à une ligne horizontale au centre de la fenêtre.
const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => link.classList.toggle('on', link.hash === '#' + entry.target.id));
}), { rootMargin: '-50% 0px -50% 0px' });
$$('.hero, main section, .foot').forEach(section => sectionObserver.observe(section));

/** Barre transparente tout en haut de la page (sur le rouge de l'accueil), opaque ensuite. */
function updateBar() {
    bar.classList.toggle('light', scrollY < 16);
}
addEventListener('scroll', updateBar, { passive: true });
updateBar();

/** Affiche l'heure locale de Rodez, quel que soit le fuseau du visiteur. */
function updateClock() {
    $('.clock').textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
}
updateClock();
setInterval(updateClock, 30_000);

// ============================================
// 2. PAGES PROJET
// ============================================

// Chaque projet est un <dialog class="work"> ouvert quand l'adresse se termine par son #id.
// Passer par l'adresse donne à chaque projet un lien partageable et fait fonctionner le
// bouton « précédent » du navigateur, sans routeur.
const works = $$('dialog.work');

/**
 * Page projet désignée par une ancre.
 * @param {string} hash  ancre avec son #, par exemple « #watchd »
 * @returns {HTMLDialogElement|undefined}
 */
const workAt = hash => works.find(work => '#' + work.id === hash);

/**
 * Vrai si le projet ouvert l'a été depuis la page (clic sur une feuille, un tirage…) : il y
 * a alors une entrée d'historique « page sans projet » juste avant. Faux si le visiteur est
 * arrivé directement sur l'adresse d'un projet.
 */
let openedFromPage = false;

/**
 * Position de défilement à rétablir une fois le projet refermé, ou null. Le navigateur est
 * censé la restaurer lui-même au retour arrière, mais il lui arrive de remonter en haut de
 * page : on la mémorise à la fermeture et on la réimpose.
 * @type {number|null}
 */
let scrollToRestore = null;

/**
 * Aligne les <dialog> sur l'adresse : ouvre celui que l'ancre désigne, ferme les autres.
 * @param {HashChangeEvent} [event]  absent lors de l'appel initial, au chargement
 */
function syncWork(event) {
    const target = workAt(location.hash);
    works.forEach(work => { if (work !== target && work.open) work.close(); });

    if (scrollToRestore !== null && !target) scrollTo({ top: scrollToRestore, behavior: 'instant' });
    scrollToRestore = null;

    if (!target || target.open) return;

    // On ne vient « de la page » que si l'adresse précédente n'était pas déjà un projet
    if (event && !workAt(new URL(event.oldURL).hash)) openedFromPage = true;
    target.showModal();
    target.scrollTop = 0;
}

works.forEach(work => {
    // Fermeture par Échap ou par « Retour » : il reste à retirer l'ancre de l'adresse.
    // (Si la fermeture vient d'un changement d'adresse, l'ancre a déjà changé : rien à faire.)
    work.addEventListener('close', () => {
        if (location.hash !== '#' + work.id) return;
        // Revenir en arrière retire l'ancre ; syncWork, rappelé par le changement d'adresse,
        // remettra la page là où elle était (elle n'a pas bougé derrière le projet).
        // Sans entrée précédente (arrivée directe), on se contente de nettoyer l'adresse.
        if (openedFromPage) {
            scrollToRestore = scrollY;
            history.back();
        } else {
            history.replaceState(null, '', location.pathname + location.search);
        }
    });

    // Liens internes d'une page projet : « Projet suivant » ou « Retour ».
    work.addEventListener('click', event => {
        const link = event.target.closest('a[href^="#"]');
        if (!link) return;
        event.preventDefault();
        // « Projet suivant » remplace l'entrée d'historique au lieu d'en empiler une par
        // projet : un seul retour arrière suffit toujours pour revenir à la page.
        if (workAt(link.hash)) location.replace(link.hash);
        // « Retour » pointe vers #projets pour fonctionner sans JavaScript ; ici on ferme
        // simplement, pour ne pas faire défiler la page derrière.
        else work.close();
    });
});

addEventListener('hashchange', syncWork);
syncWork();

// ============================================
// 3. FEUILLES DE PROJET
// ============================================

// Une feuille déjà dépassée reste collée sous la barre, cachée par les suivantes. Le
// navigateur la croit donc visible et ne fait pas défiler la page quand elle reçoit le
// focus au clavier (Maj+Tab) : on ramène nous-mêmes la page là où elle est au premier plan.
const sheets = $$('.sheet');
sheets.forEach((sheet, index) => sheet.addEventListener('focus', () => {
    if (!sheet.matches(':focus-visible')) return; // clavier uniquement, pas au clic
    const deckTop = sheet.parentElement.getBoundingClientRect().top + scrollY;
    const heightBefore = sheets.slice(0, index).reduce((total, previous) => total + previous.offsetHeight, 0);
    scrollTo({ top: deckTop + heightBefore - bar.offsetHeight });
}));

// Les blocs arrivent de travers et se posent droit. Le CSS le fait avec des animations liées
// au scroll ; là où elles n'existent pas (Firefox), la classe .in déclenche une transition.
if (!reduceMotion && !CSS.supports('animation-timeline: view()')) {
    const tiltObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        entry.target.classList.toggle('in', entry.isIntersecting);
    }), { threshold: .2 });
    $$('.sheet, .card, .work .stage, .shot, .node').forEach(block => tiltObserver.observe(block));
}

// ============================================
// 4. TEXTES ANIMÉS
// ============================================

const swap = $('.swap');
const SWAP_WORDS = ['logiciel', 'web', 'backend'];
const GLYPHS = '{}[]<>/=;:#_';

/**
 * Remplace le mot tournant de l'accueil : chaque lettre passe par des symboles de code
 * avant de se poser, de gauche à droite (une lettre toutes les deux images).
 * @param {string} word  mot à afficher
 */
function scramble(word) {
    let frame = 0;
    const timer = setInterval(() => {
        swap.textContent = [...word]
            .map((letter, index) => index < frame / 2 ? letter : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
            .join('');
        if (++frame > word.length * 2) clearInterval(timer);
    }, 45);
}

if (!reduceMotion) {
    let wordIndex = 0;
    setInterval(() => scramble(SWAP_WORDS[++wordIndex % SWAP_WORDS.length]), 3200);
}

// Grands titres découpés en lettres (<b><i>P</i><i>r</i>…</b>) pour les animer une à une ;
// --i est le rang de la lettre, lu par le CSS. Le texte complet reste dans un
// <span class="sr"> pour les lecteurs d'écran, les lettres leur sont cachées.
$$('.big').forEach(title => {
    const text = title.textContent.trim();

    const label = document.createElement('span');
    label.className = 'sr';
    label.textContent = text;

    const letters = document.createElement('b');
    letters.ariaHidden = 'true';
    [...text].forEach((character, index) => {
        if (character === ' ') return letters.append(' ');
        const letter = document.createElement('i');
        letter.textContent = character;
        letter.style.setProperty('--i', index);
        letters.append(letter);
    });

    title.replaceChildren(label, letters);
});

// Les chiffres d'« À propos » comptent depuis zéro la première fois qu'ils sont entièrement
// visibles. Seul le premier nœud de texte est animé : dans « 3<sup>e</sup> », l'exposant reste.
if (!reduceMotion) {
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
    $$('.stats dd').forEach(stat => statObserver.observe(stat));
}

// ============================================
// 5. DIVERS
// ============================================

/** Taille réelle de la fenêtre du visiteur, affichée en bas de l'accueil. */
function updateViewport() {
    $('.viewport').textContent = `${innerWidth} × ${innerHeight}`;
}
updateViewport();
addEventListener('resize', updateViewport);

// Bouton « Copier » de l'adresse mail. L'API presse-papiers n'existe qu'en contexte sécurisé
// (https ou localhost) et peut être refusée : on le dit au lieu d'échouer en silence.
const copyButton = $('.copy');
copyButton.addEventListener('click', async () => {
    let feedback = 'Copié ✓';
    try {
        await navigator.clipboard.writeText($('.mail a').textContent);
    } catch {
        feedback = 'Copie impossible';
    }
    copyButton.textContent = feedback;
    setTimeout(() => { copyButton.textContent = 'Copier'; }, 1500);
});
