'use strict';

/**
 * Portfolio de Dorian Vidal : comportements de la page.
 *
 * Tout le contenu est dans index.html et le site reste lisible sans ce fichier (le défilé est
 * un défilement natif, les pages s'ouvrent par leur ancre). Il ajoute :
 *   1. Défilé          glisser à la souris, molette, clavier, points, léger suivi de la souris
 *   2. Pages           ouverture / fermeture des <dialog> à partir de l'ancre de l'adresse,
 *                      avec une transition qui garde le décor en place
 *   3. Textes animés   titres calés sur la largeur de l'écran, mot tournant, lettres, chiffres
 *   4. Divers          heure de Rodez, bouton « Copier », repli sans animations de scroll
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
// 1. DÉFILÉ
// ============================================

// Le défilé est un défilement natif, aimanté sur chaque diapositive (CSS) : horizontal sur
// grand écran, vertical sur téléphone. Au doigt et au pavé tactile il n'y a donc rien à
// faire ; ce qui suit ajoute les autres façons de le parcourir. Tout passe par goTo, qui
// laisse le navigateur faire le mouvement, dans un sens comme dans l'autre.
const deck = $('.deck');
const slides = $$('.slide');
const dots = $$('.dots a');
const works = $$('dialog.work');

/**
 * Vrai quand le défilé est vertical. C'est le CSS qui en décide (section « Petits écrans ») ;
 * on le lit sur la piste plutôt que de répéter ici ses conditions.
 */
const isVertical = () => getComputedStyle(deck).flexDirection === 'column';

/** Rang de la diapositive affichée, 0 pour la présentation. */
let current = 0;

/**
 * Rang de la diapositive visée. Il ne diffère de current que le temps d'un déplacement : c'est
 * à partir de lui qu'on compte, pour que deux demandes rapprochées (deux crans de molette, deux
 * appuis sur une flèche) avancent bien de deux diapositives.
 */
let aim = 0;

/**
 * Amène une diapositive à l'écran.
 * @param {number} index  rang visé ; ramené dans les bornes s'il dépasse
 * @param {ScrollBehavior} [behavior]  « auto » suit le CSS : adouci, sauf animations réduites
 */
function goTo(index, behavior = 'auto') {
    aim = Math.max(0, Math.min(index, slides.length - 1));
    slides[aim].scrollIntoView({ behavior, inline: 'start', block: 'start' });
}

// Fin d'un déplacement, quelle que soit sa cause : la piste n'a plus bougé depuis un instant.
// On recale alors la visée sur ce qui est affiché et on rétablit l'aimant, coupé pendant un
// glisser à la souris (classe .grab). Un simple délai, relancé à chaque mouvement : l'événement
// « scrollend » ferait la même chose mais n'existe pas encore partout.
let settleTimer;
function settleSoon() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
        if (dragFrom) return;   // la souris tient encore la piste
        aim = current;
        deck.classList.remove('grab');
    }, 140);
}
deck.addEventListener('scroll', settleSoon, { passive: true });

// La diapositive qui passe par le centre de la piste devient la diapositive affichée. La marge
// de -50 % sur les quatre côtés réduit la zone observée à ce seul point : la règle vaut donc
// dans les deux sens de défilement.
const slideObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    current = slides.indexOf(entry.target);
    dots.forEach((dot, index) => { dot.ariaCurrent = String(index === current); });
}), { root: deck, rootMargin: '-50%' });
slides.forEach(slide => slideObserver.observe(slide));

// Liens vers une diapositive (points, « Voir mes 7 projets »…) : le défilé y glisse, sans
// ajouter d'entrée à l'historique. Les liens déjà traités par une page ouverte sont ignorés.
document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    const index = link ? slides.findIndex(slide => '#' + slide.id === link.hash) : -1;
    if (index < 0 || event.defaultPrevented) return;
    event.preventDefault();
    goTo(index);
});

// Clavier : les flèches (et page suivante / précédente), tant qu'aucune page n'est ouverte
// par-dessus. Les quatre flèches servent dans les deux sens de défilement.
addEventListener('keydown', event => {
    const step = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 }[event.key];
    if (!step || works.some(work => work.open)) return;
    event.preventDefault();
    goTo(aim + step);
});

// Molette : un geste vertical fait avancer d'une diapositive, que le défilé soit horizontal
// ou vertical. Un geste horizontal, lui, est laissé au défilement natif.
// Un « geste » est une rafale d'événements rapprochés : un pavé tactile en envoie des dizaines
// pour un seul balayage, inertie comprise. On n'avance donc qu'une fois par rafale, dès qu'elle
// a assez d'ampleur, et une pause de 160 ms en ouvre une nouvelle : rien n'est verrouillé, un
// deuxième cran de molette repart aussitôt.
const wheel = { last: 0, sum: 0, done: false };
deck.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    if (event.timeStamp - wheel.last > 160) Object.assign(wheel, { sum: 0, done: false });
    wheel.last = event.timeStamp;
    wheel.sum += event.deltaY;
    if (wheel.done || Math.abs(wheel.sum) < 20) return;
    wheel.done = true;
    goTo(aim + Math.sign(wheel.sum));
}, { passive: false });

// Glisser à la souris, quand le défilé est horizontal (vertical, la molette suffit et un
// glisser n'y est pas attendu). Pendant le geste la classe .grab coupe l'aimant (CSS) et la piste suit
// la main ; au relâchement on glisse vers la diapositive voisine si le geste a dépassé 12 % de
// la largeur ou s'il était vif (un coup de poignet), sinon on revient. L'aimant est rétabli
// une fois ce dernier mouvement terminé (settleSoon).
/** Geste en cours : abscisse et instant de départ de la souris, position de départ de la piste. */
let dragFrom = null;
/** Vrai dès que la souris a vraiment bougé : le clic qui suit le relâchement est alors annulé. */
let dragged = false;

deck.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || isVertical()) return;
    dragFrom = { x: event.clientX, left: deck.scrollLeft, time: event.timeStamp };
    dragged = false;
});

addEventListener('pointermove', event => {
    if (!dragFrom) return;
    const shift = event.clientX - dragFrom.x;
    if (Math.abs(shift) > 6) dragged = true;
    if (!dragged) return;
    deck.classList.add('grab');
    deck.scrollLeft = dragFrom.left - shift;
});

/** Fin du geste (bouton relâché, ou geste interrompu par le navigateur). */
function endDrag(event) {
    if (!dragFrom) return;
    const shift = event.clientX - dragFrom.x;
    const start = Math.round(dragFrom.left / deck.clientWidth);
    const flick = event.timeStamp - dragFrom.time < 300 && Math.abs(shift) > 40;
    dragFrom = null;
    if (!dragged) return;
    const far = Math.abs(shift) > deck.clientWidth * .12;
    goTo(start - (far || flick ? Math.sign(shift) : 0), reduceMotion ? 'instant' : 'smooth');
    settleSoon();   // au cas où la piste serait déjà en place et n'émettrait plus de « scroll »
}
addEventListener('pointerup', endDrag);
addEventListener('pointercancel', endDrag);

// Après un glisser, le navigateur envoie quand même un clic à la diapositive : on l'arrête
// avant qu'il n'ouvre le projet. Et on empêche le glisser-déposer natif des liens et images.
deck.addEventListener('click', event => {
    if (!dragged) return;
    dragged = false;
    event.preventDefault();
    event.stopPropagation();
}, true);
deck.addEventListener('dragstart', event => event.preventDefault());

// Le titre et le visuel suivent légèrement la souris, en sens opposés. Les deux variables
// sont posées sur <html> : l'en-tête d'une page les lit aussi, pour que son visuel reste
// exactement là où il était dans la diapositive.
if (!reduceMotion) {
    deck.addEventListener('pointermove', event => {
        if (event.pointerType !== 'mouse') return;
        document.documentElement.style.setProperty('--mx', (event.clientX / innerWidth - .5).toFixed(3));
        document.documentElement.style.setProperty('--my', (event.clientY / innerHeight - .5).toFixed(3));
    });
}

// ============================================
// 2. PAGES
// ============================================

// Chaque projet, et « À propos », est un <dialog class="work"> ouvert quand l'adresse désigne
// son #id ou celui d'un élément qu'il contient (#contact ouvre « À propos » à la bonne
// hauteur). Passer par l'adresse donne à chaque page un lien partageable et fait fonctionner
// le bouton « précédent » du navigateur, sans routeur : l'adresse commande, syncWork exécute.

/**
 * Élément désigné par une ancre.
 * @param {string} hash  ancre avec son #, par exemple « #watchd »
 * @returns {HTMLElement|null}
 */
const anchorAt = hash => document.getElementById(decodeURIComponent(hash.slice(1)));

/**
 * Page désignée par une ancre : celle qui porte cet id, ou qui contient l'élément qui le porte.
 * @param {string} hash
 * @returns {HTMLDialogElement|null}
 */
const workAt = hash => anchorAt(hash)?.closest('dialog.work') ?? null;

/**
 * Diapositive qui mène à une page (aucune pour « À propos »).
 * @param {HTMLDialogElement} work
 * @returns {HTMLAnchorElement|undefined}
 */
const slideOf = work => slides.find(slide => slide.hash === '#' + work.id);

/**
 * Vrai si la page ouverte l'a été depuis le défilé : il y a alors une entrée d'historique
 * « sans page » juste avant. Faux si le visiteur est arrivé directement sur l'adresse d'une page.
 */
let openedFromDeck = false;

/**
 * Applique un changement d'écran. Là où le navigateur le permet, il photographie l'avant et
 * l'après et anime les éléments qui portent le même view-transition-name (voir la fin de
 * style.css) : c'est ce qui garde le titre et le visuel en place quand un projet s'ouvre.
 * Les classes posées pour l'occasion (.vt sur une diapositive, .to-next sur <html>) sont
 * retirées à la fin.
 * @param {() => void} update  le changement à appliquer
 */
function transition(update) {
    const cleanUp = () => {
        slides.forEach(slide => slide.classList.remove('vt'));
        document.documentElement.classList.remove('to-next');
    };
    if (reduceMotion || !document.startViewTransition) {
        update();
        return cleanUp();
    }
    const viewTransition = document.startViewTransition(update);
    // Le navigateur saute l'animation si l'onglet est masqué ou la fenêtre redimensionnée en
    // cours de route : le changement est appliqué quand même, il n'y a rien à signaler.
    viewTransition.ready.catch(() => {});
    viewTransition.finished.then(cleanUp, cleanUp);
}

/**
 * Aligne les pages sur l'adresse : ouvre celle que l'ancre désigne, ferme l'autre.
 * @param {HashChangeEvent} [event]  absent lors de l'appel initial et des appels directs
 */
function syncWork(event) {
    const anchor = anchorAt(location.hash);
    const target = anchor?.closest('dialog.work') ?? null;
    const opened = works.find(work => work.open) ?? null;

    if (!target) openedFromDeck = false;
    else if (event && !workAt(new URL(event.oldURL).hash)) openedFromDeck = true;

    if (target === opened) {
        // Rien à ouvrir ni à fermer. S'il y a une page, c'est un lien interne à celle-ci : on
        // la place sur l'élément visé (son début, si c'est la page elle-même).
        if (anchor === target) target?.scrollTo({ top: 0 });
        else anchor.scrollIntoView();
        return;
    }

    // Point de départ de la transition, à désigner avant de la lancer.
    // Depuis le défilé : la diapositive du projet, si c'est bien elle qui est à l'écran (un
    // projet ouvert depuis un tirage de la présentation se contente d'un fondu).
    const slide = target && slideOf(target);
    if (!opened && slide === slides[current]) slide.classList.add('vt');
    // Depuis une autre page, par son bandeau « projet suivant ».
    document.documentElement.classList.toggle('to-next', Boolean(opened?.classList.contains('going')));

    transition(() => {
        slides.forEach(item => item.classList.remove('vt'));
        if (opened) {
            opened.close();
            opened.classList.remove('going');
        }
        if (!target) {
            // Retour au défilé : la diapositive du projet quitté, déjà en place derrière la
            // page (voir plus bas), sert de point d'arrivée.
            slideOf(opened)?.classList.add('vt');
            return;
        }
        target.showModal();
        // Le focus va sur la page elle-même plutôt que sur son premier bouton : pas de contour
        // surprise sur « Retour », et Tab commence bien en haut.
        target.focus({ preventScroll: true });
        target.scrollTo({ top: 0, behavior: 'instant' });
        if (anchor !== target) anchor.scrollIntoView({ behavior: 'instant' });
        // Derrière la page, le défilé se cale tout de suite sur la diapositive de ce projet :
        // à la fermeture elle sera déjà là, immobile, et la transition tombera juste.
        if (slide) goTo(slides.indexOf(slide), 'instant');
    });
}

/** Referme la page ouverte en retirant son ancre de l'adresse ; syncWork fait le reste. */
function leaveWork() {
    // Revenir en arrière retire l'ancre et déclenche syncWork. Sans entrée précédente (arrivée
    // directe sur une page), on nettoie l'adresse nous-mêmes.
    if (openedFromDeck) return history.back();
    history.replaceState(null, '', location.pathname + location.search);
    syncWork();
}

works.forEach(work => {
    work.tabIndex = -1;   // la page peut recevoir le focus à son ouverture (syncWork)

    // Échap : on passe par l'adresse, comme pour « Retour », au lieu de laisser le navigateur
    // fermer le <dialog> sans transition.
    work.addEventListener('cancel', event => {
        event.preventDefault();
        leaveWork();
    });

    // Liens internes d'une page.
    work.addEventListener('click', event => {
        const link = event.target.closest('a[href^="#"]');
        if (!link) return;
        event.preventDefault();
        // « Retour » pointe vers #projets pour fonctionner sans JavaScript ; ici on referme.
        if (!workAt(link.hash)) return leaveWork();
        // « Projet suivant » : son bandeau devient le point de départ de la transition.
        work.classList.toggle('going', link.matches('.next'));
        // On remplace l'entrée d'historique au lieu d'en empiler une par page : un seul retour
        // arrière suffit toujours pour revenir au défilé.
        if (link.hash === location.hash) syncWork();
        else location.replace(link.hash);
    });
});

addEventListener('hashchange', syncWork);
syncWork();

// ============================================
// 3. TEXTES ANIMÉS
// ============================================

/**
 * Largeur d'un texte composé en titre « affiche », en em (la règle .probe du CSS).
 * @param {string} text
 * @returns {number}
 */
function emWidth(text) {
    const probe = document.createElement('span');
    probe.className = 'probe';
    probe.textContent = text;
    document.body.append(probe);
    const width = probe.offsetWidth / 100;   // .probe est composé en 100 px
    probe.remove();
    return width;
}

/**
 * Titres des projets : le CSS règle leur corps pour qu'ils occupent une largeur donnée, à
 * partir de leur largeur en em (--w) et, sur petit écran où ils se replient, de celle de leur
 * mot le plus long (--word ; un titre peut aussi se couper après un trait d'union).
 */
function fitTitles() {
    $$('.sheet h3, .panel h2, .next b').forEach(title => {
        const text = title.textContent.trim();
        title.style.setProperty('--w', emWidth(text));
        title.style.setProperty('--word', Math.max(...text.split(/\s+|(?<=-)/).map(emWidth)));
    });
}
// Tout de suite, avec la police déjà disponible, pour que les titres aient leur taille dès le
// premier affichage ; puis une fois la police du site chargée, si elle ne l'était pas encore.
fitTitles();
document.fonts.ready.then(fitTitles);

const swap = $('.swap');
const SWAP_WORDS = ['logiciel', 'web', 'backend'];
const GLYPHS = '{}[]<>/=;:#_';

/**
 * Remplace le mot tournant de la présentation : chaque lettre passe par des symboles de code
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
// 4. DIVERS
// ============================================

/** Affiche l'heure locale de Rodez, quel que soit le fuseau du visiteur. */
function updateClock() {
    $('.clock').textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
}
updateClock();
setInterval(updateClock, 30_000);

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

// Dans les pages, les blocs arrivent de travers et se posent droit. Le CSS le fait avec des
// animations liées au défilement ; là où elles n'existent pas, la classe .in déclenche une
// transition.
if (!reduceMotion && !CSS.supports('animation-timeline: view()')) {
    const tiltObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        entry.target.classList.toggle('in', entry.isIntersecting);
    }), { threshold: .2 });
    $$('.card, .work .stage, .work .node').forEach(block => tiltObserver.observe(block));
}
