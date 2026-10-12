# Portfolio de Dorian Vidal

Site d'une seule page, en **HTML, CSS et JavaScript purs** : aucun framework, aucune
dépendance, aucune étape de build. Ce qui est dans le dépôt est exactement ce qui est mis en
ligne.

Le style mélange deux inspirations. De [The Line Studio](https://thelinestudio.com/) : le
papier clair, le noir, un seul rouge, les étiquettes `/ EN CAPITALES`, les repères de cadrage
et **des blocs qui arrivent de travers et se posent droits**. De
[Robin Mastromarino](http://robinmastromarino.com/) : un site qui tient dans un écran,
**un défilé de projets plein écran** (horizontal sur ordinateur, vertical sur téléphone), des
titres géants inclinés qui traversent l'image, et des pages qui s'ouvrent sans jamais changer
de décor.

## Sommaire

- [Structure du dépôt](#structure-du-dépôt)
- [Voir le site en local](#voir-le-site-en-local)
- [Modifier le contenu](#modifier-le-contenu)
- [Ajouter un projet](#ajouter-un-projet)
- [Comment ça marche](#comment-ça-marche)
- [Sécurité](#sécurité)
- [Accessibilité](#accessibilité)
- [Navigateurs](#navigateurs)
- [Mise en ligne sur Cloudflare Pages](#mise-en-ligne-sur-cloudflare-pages)
- [Crédits](#crédits)

## Structure du dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | Tout le contenu : l'interface (les quatre coins de l'écran), le défilé (une diapositive de présentation puis une par projet), la page « À propos » (à propos, stack, contact), puis une page par projet. |
| `style.css` | Toute la mise en forme et toutes les animations. Un sommaire en tête de fichier liste ses 10 sections. |
| `script.js` | Les comportements : défilé (souris, molette, clavier), pages, textes animés, bouton « Copier ». Le site reste lisible sans lui. |
| `images/` | Captures d'écran des projets. |
| `_headers` | En-têtes HTTP de sécurité, lus par Cloudflare Pages (voir [Sécurité](#sécurité)). |

## Voir le site en local

Le plus simple : ouvrir `index.html` dans un navigateur. Tout fonctionne, sauf le bouton
« Copier », que les navigateurs réservent aux pages servies en `https` ou sur `localhost`
(il affiche alors « Copie impossible »).

Pour un aperçu identique à la version en ligne, servir le dossier avec n'importe quel serveur
de fichiers, par exemple :

```bash
python -m http.server 5173
```

puis ouvrir <http://localhost:5173>. Ce serveur ne sert qu'à l'aperçu : il ne fait pas partie
du site.

## Modifier le contenu

- **Un texte** : tout est dans `index.html`, section par section (chaque section est annoncée
  par un commentaire `<!-- ===== NOM ===== -->`).
- **La couleur d'accent** : la variable `--accent` en haut de `style.css`. Reporter la même
  couleur dans le favicon (balise `<link rel="icon">` de `index.html`, la valeur après
  `fill='%23`). Vérifier que la nouvelle couleur garde un contraste d'au moins 4,5 avec le
  blanc et avec le fond `--paper`, puisqu'elle sert dans les deux sens.
- **Le mot qui tourne sur la présentation** : la liste `SWAP_WORDS` dans `script.js`.
- **Une capture d'écran** : remplacer le fichier dans `images/`, puis mettre à jour les
  attributs `width` et `height` de ses balises `<img>` et l'étiquette `data-label` de sa scène
  (« Viewport — largeur × hauteur »). Une capture n'est jamais agrandie au-delà de sa taille
  réelle : la fournir en au moins 1200 px de large pour qu'elle remplisse bien la scène.
  Dans le défilé elle est volontairement ramenée à une seule teinte (voir
  [Le défilé](#le-défilé)) ; c'est dans la page du projet qu'elle apparaît en couleurs.

## Ajouter un projet

Il n'y a pas de générateur : un projet existe à trois endroits de `index.html`, et quelques
compteurs sont écrits en dur. Dans l'ordre :

1. **La diapositive** (dans `<div class="deck">`) : dupliquer un bloc `<a class="slide sheet">`.
   Adapter son `id` (`s-identifiant`), l'étiquette, le titre, la description, les technos et le
   lien `href="#identifiant"`. Dans la scène, mettre soit une capture (`<img class="shot">`),
   soit un schéma (`<div class="flow">`). La classe de la scène donne sa couleur à toute la
   diapositive : alterner `stage ink` (noir) et `stage red` (rouge) d'un projet à l'autre.
   L'inclinaison du titre alterne toute seule, et sa taille se cale sur sa longueur.
2. **Le point** (dans `<nav class="dots">`) : un lien `<a href="#s-identifiant">` de plus, à la
   même position que la diapositive.
3. **La page du projet** (fin du fichier) : dupliquer un bloc `<dialog class="work project">`.
   Son `id` doit être celui du lien de la diapositive, et l'`id` de son `<h2>` doit
   correspondre à son attribut `aria-labelledby`. Les pages sont dans le même ordre que les
   diapositives : la couleur de leur en-tête alterne toute seule (noir, rouge, noir…) et doit
   donc tomber sur celle de la scène de la diapositive.
4. **La chaîne « Projet suivant »** : chaque page pointe vers la suivante, la dernière vers la
   première. Il y a deux liens par page : le bouton de la barre du haut et le bandeau
   `<a class="next">` du bas, qui porte aussi le titre et le numéro du projet suivant.
5. **Les compteurs**, à mettre à jour partout :
   - « 0X / 07 » dans l'étiquette de chaque diapositive, « Projet 0X / 07 » dans chaque page
     et « Projet suivant — 0X / 07 » dans chaque bandeau ;
   - « Voir mes 7 projets » et les compteurs `[ 2 ]`, `[ 3 ]`, `[ 2 ]` sur la présentation ;
   - le chiffre « projets » de la carte claire d'« À propos ».
6. **Optionnel, le tirage de la présentation** : un bloc `<a class="print">` dans
   `<div class="prints">`. La mise en page est prévue pour quatre tirages (quatre règles
   `.print:nth-child(…)` dans `style.css`).

Limite connue : la liste animée « pipeline » (classe `pipe`) est réglée pour sept étapes. Pour
un autre nombre, adapter les règles `.pipe li:nth-child(…)` et les pourcentages des animations
`step` et `step-mark` dans `style.css`.

## Comment ça marche

### Le défilé

L'accueil est une piste (`<div class="deck">`) dont chaque diapositive remplit l'écran. Sur
ordinateur elle est horizontale ; sur téléphone et tablette à la verticale elle descend,
parce que c'est le geste qu'on fait naturellement sur un écran tenu en main (voir
[Les tailles d'écran](#les-tailles-décran)). Dans les deux sens le mouvement est celui du
navigateur, un défilement natif aimanté (`scroll-snap`) : au doigt et au pavé tactile il n'y
a aucun code. `script.js`
ajoute seulement les autres façons d'avancer (glisser à la souris, molette, flèches du
clavier, points) et se contente à chaque fois de demander au navigateur d'amener une
diapositive à l'écran.

Ce qui bouge pendant le glissement est écrit en CSS, piloté par la position de chaque
diapositive (`view-timeline`) : le titre va moins vite que sa diapositive, si bien que celui
du projet voisin dépasse toujours au bord de l'écran ; ses lettres s'écartent pendant le
mouvement ; le visuel arrive de travers et se pose droit ; la frontière entre deux projets
penche en avançant puis se redresse.

Deux règles gardent ce mouvement net, à respecter si on y touche :

- **Un seul ordre d'empilement** pour toutes les diapositives (scène, petits textes, bord en
  biais de la suivante, titres géants), décrit au-dessus de `.sheet` dans `style.css`. Rien
  ne passe ainsi tantôt devant, tantôt derrière.
- **Seulement des transformations et de l'opacité, avec des longueurs fixes** (pas de
  pourcentage) dans ces animations : le navigateur peut alors les confier à la carte
  graphique, au même rythme que le défilement. L'écartement des lettres, qui refait la mise
  en page, est une animation à part et n'existe que sur grand écran.

Le titre passe devant le visuel. Pour qu'il reste lisible quelle que soit la capture, celle-ci
est ramenée à une seule teinte dans le défilé : imprimée en noir sur les scènes rouges
(`mix-blend-mode: multiply`, qui ne peut que foncer le fond), grisée et atténuée sur les
scènes noires.

### Les pages

Chaque projet a sa page, et « À propos » aussi : un élément `<dialog class="work">` affiché en
plein écran. `script.js` ouvre celle que désigne l'ancre de l'adresse (`…/#watchd`), ou qui
contient l'élément désigné (`…/#contact` ouvre « À propos » à la hauteur du contact). Passer
par l'adresse donne trois choses sans routeur :

- chaque page a un lien partageable ;
- le bouton « précédent » du navigateur la referme ;
- sans JavaScript, l'ancre suffit à l'afficher (règle `@media (scripting: none)`).

« Projet suivant » remplace l'entrée d'historique au lieu d'en ajouter une : un seul retour
arrière ramène toujours au défilé, sur la diapositive du projet qu'on vient de quitter.

### La continuité entre les écrans

Ouvrir un projet ne « change pas de page ». L'en-tête de la page remplit l'écran comme la
diapositive, dans la même couleur, avec le même visuel **exactement au même endroit** (les
variables `--zt`, `--zb`, `--zx` de `style.css`, partagées par les deux) : seuls le titre et
les textes changent. `script.js` enveloppe le changement dans l'API
[View Transitions](https://developer.mozilla.org/docs/Web/API/View_Transition_API) du
navigateur, qui fait trois choses (fin de `style.css`) :

- le titre de la diapositive et celui de la page portent le même `view-transition-name` : il
  se redresse en grossissant ;
- les deux barres du haut (celle du défilé, celle des pages) se relaient au lieu de se
  superposer ;
- tout le reste se fond d'un seul bloc.

Le bandeau « Projet suivant » fonctionne de la même façon : son titre devient celui de la page
suivante, qui se découvre par le bas à partir du bandeau. À la fermeture, on retombe sur la
diapositive du projet quitté, que le défilé a rejointe dès l'ouverture de la page. Là où l'API
n'existe pas, le changement est immédiat.

### Les tailles d'écran

Une diapositive remplit toujours exactement l'écran : chaque disposition doit y tenir. La
section « Petits écrans » de `style.css` en prévoit quatre : large (ordinateur, tablette à
l'horizontale), tablette à la verticale (≤ 900 px : présentation et pages sur une colonne),
téléphone à la verticale (≤ 620 px : le visuel en haut, les textes dessous, un mot du titre
par ligne) et téléphone à l'horizontale (≤ 520 px de haut : disposition en largeur, réduite
à l'essentiel).

**Sur les trois dernières, le défilé est vertical.** Le bloc « Défilé vertical » de la même
section retourne la piste, et tout suit : les points passent en colonne sur le bord droit,
une invitation « Défiler » apparaît au bas de la présentation, les flèches des boutons
pointent vers le bas, et les animations changent de sens (les titres montent en place au
lieu de glisser de côté, le bord en biais se déploie en hauteur). La condition de ce bloc
figure à deux endroits de `style.css` (sections 9 et 10) : les garder identiques. `script.js`
ne la répète pas, il lit le sens sur la piste elle-même.

### Les rotations

Chaque bloc concerné déclare son angle de départ dans la variable CSS `--tilt` (et son angle
de repos dans `--rest` s'il ne finit pas droit). Dans les pages, l'animation `settle` de
`style.css` fait le trajet, pilotée par le défilement (`animation-timeline: view()`). Les
titres géants, eux, restent inclinés : `--rest` vaut -4° ou 4° selon le projet.

Dans les navigateurs sans animations liées au défilement, `script.js` pose une classe `.in`
quand le bloc entre à l'écran et le même geste se joue en transition ; le défilé, lui, reste
simplement statique d'une diapositive à l'autre.

### Sans JavaScript, sans animations

- **Sans JavaScript** : tout le contenu est lisible, le défilé se parcourt au doigt, au pavé
  tactile ou par ses points, les pages s'ouvrent par leur ancre. Seuls les effets (mot
  tournant, heure, compteurs, transitions entre écrans) manquent.
- **Animations réduites** (réglage du système) : tout est statique.

## Sécurité

Le site est statique : pas de serveur applicatif, pas de base de données, pas de formulaire,
aucune donnée de visiteur traitée, aucun script tiers. Les protections en place :

- **`_headers`** impose une *Content-Security-Policy* stricte : seuls les scripts et images du
  site sont autorisés, plus les feuilles de style et polices de Google Fonts. Aucun script ni
  style en ligne n'est accepté (le HTML n'en contient aucun). Le même fichier interdit
  l'affichage du site dans une iframe et coupe caméra, micro et géolocalisation.
- Les liens externes s'ouvrent avec `rel="noopener"`.
- `script.js` n'injecte jamais de HTML : il crée les éléments un par un et n'écrit que du
  texte.

À savoir si le site évolue :

- **Toute ressource externe nouvelle** (script de mesure d'audience, police, image hébergée
  ailleurs) doit être ajoutée à la *Content-Security-Policy* de `_headers`, sinon le navigateur
  la bloque. C'est aussi vrai pour les options Cloudflare qui injectent un script, comme
  Web Analytics.
- `_headers` n'est lu que par Cloudflare Pages. Sur un autre hébergeur, ces en-têtes sont à
  configurer autrement.
- La police est chargée depuis Google Fonts : le navigateur du visiteur contacte donc Google.
  Pour l'éviter, héberger les fichiers de police dans le dépôt et retirer Google de la
  politique.

## Accessibilité

- Navigation complète au clavier, focus toujours visible : les flèches (ou page suivante /
  précédente) pour le défilé, Tab pour atteindre chaque diapositive (elle vient alors à
  l'écran), Entrée pour ouvrir son projet.
- Les pages sont de vrais `<dialog>` modaux : focus piégé dedans, fermeture par Échap.
- Le point de la diapositive affichée porte `aria-current`.
- Les éléments décoratifs (icônes, lettres animées, tirages de la présentation) sont cachés
  aux lecteurs d'écran ; le texte réel leur est fourni à part quand il est découpé.
- Les animations respectent le réglage « réduire les animations » du système.
- Contrastes de texte d'au moins 4,5 pour 1, y compris le blanc sur le rouge et les titres
  qui passent devant une capture.
- Sur écran tactile, les points et les liens du haut ont une zone de toucher agrandie.

## Navigateurs

Versions récentes de Chrome, Edge, Safari et Firefox. Le site utilise des fonctions CSS de
2022-2023 (`:has()`, unités `svh` / `dvh`, propriétés `rotate` / `translate`,
`:nth-child(… of …)`) : sur un navigateur plus ancien la mise en page sera dégradée.

Les animations liées au défilement et les View Transitions ne sont pas disponibles partout ;
voir [Les rotations](#les-rotations) et
[La continuité entre les écrans](#la-continuité-entre-les-écrans) pour les replis.

## Mise en ligne sur Cloudflare Pages

1. Dans le tableau de bord Cloudflare : *Workers & Pages* → *Create* → *Pages* → *Connect to
   Git*, puis choisir ce dépôt.
2. Réglages de build :
   - *Framework preset* : `None`
   - *Build command* : laisser vide
   - *Build output directory* : `/`
   - *Production branch* : `master`
3. Déployer. Chaque `git push` sur `master` republie ensuite le site.

Après le premier déploiement, vérifier dans les outils de développement du navigateur (onglet
Réseau, requête de la page) que l'en-tête `content-security-policy` est bien présent, et que
la console n'affiche aucune ressource bloquée.

## Crédits

- Conception et développement : Dorian Vidal.
- Inspirations visuelles : [The Line Studio](https://thelinestudio.com/) et
  [Robin Mastromarino](http://robinmastromarino.com/).
- Police : [Archivo](https://fonts.google.com/specimen/Archivo), sous licence SIL Open Font
  License, servie par Google Fonts.
