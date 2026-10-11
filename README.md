# Portfolio de Dorian Vidal

Site d'une seule page, en **HTML, CSS et JavaScript purs** : aucun framework, aucune
dépendance, aucune étape de build. Ce qui est dans le dépôt est exactement ce qui est mis en
ligne.

Le style s'inspire de [The Line Studio](https://thelinestudio.com/) : papier clair, noir, un
seul rouge, typographie géante, et un geste répété partout, **des blocs qui arrivent de
travers et se posent droits**.

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
| `index.html` | Tout le contenu : barre, accueil, projets, à propos, stack, contact, puis une « page » par projet en fin de fichier. |
| `style.css` | Toute la mise en forme et toutes les animations. Un sommaire en tête de fichier liste ses 12 sections. |
| `script.js` | Les comportements : pages projet, barre, textes animés, bouton « Copier ». Le site reste lisible sans lui. |
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
- **Le mot qui tourne à l'accueil** : la liste `SWAP_WORDS` dans `script.js`.
- **Une capture d'écran** : remplacer le fichier dans `images/`, puis mettre à jour les
  attributs `width` et `height` de ses balises `<img>` et l'étiquette `data-label` de sa scène
  (« Viewport — largeur × hauteur »). Une capture n'est jamais agrandie au-delà de sa taille
  réelle : la fournir en au moins 1200 px de large pour qu'elle remplisse bien la scène.

## Ajouter un projet

Il n'y a pas de générateur : un projet existe à deux endroits de `index.html`, et quelques
compteurs sont écrits en dur. Dans l'ordre :

1. **La feuille** (section « PROJETS ») : dupliquer un bloc `<a class="sheet">` dans
   `<div class="sheets">`. Adapter l'étiquette, le titre, la description, les technos et le
   lien `href="#identifiant"`. Dans la scène (`<div class="stage ink">` ou `stage red`),
   mettre soit une capture (`<img class="shot">`), soit un schéma (`<div class="flow">`).
   L'inclinaison alterne toute seule d'une feuille à l'autre.
2. **La page du projet** (fin du fichier) : dupliquer un bloc `<dialog class="work">`. Son
   `id` doit être celui du lien de la feuille, et l'`id` de son `<h2>` doit correspondre à
   son attribut `aria-labelledby`.
3. **La chaîne « Projet suivant »** : chaque page pointe vers la suivante, la dernière vers la
   première. Il y a deux liens par page (barre du haut et bas de page).
4. **Les compteurs**, à mettre à jour partout :
   - « 0X / 07 » dans l'étiquette de chaque feuille et « Projet 0X / 07 » dans chaque page ;
   - « Voir mes 7 projets » à l'accueil ;
   - le chiffre « projets » de la carte noire d'« À propos » ;
   - les compteurs `[ 2 ]`, `[ 3 ]`, `[ 2 ]` sous le titre « Projets ».
5. **Optionnel, le tirage à l'accueil** : un bloc `<a class="print">` dans
   `<div class="prints">`. La mise en page est prévue pour quatre tirages (quatre règles
   `.print:nth-child(…)` dans `style.css`).

Limite connue : la liste animée « pipeline » (classe `pipe`) est réglée pour sept étapes. Pour
un autre nombre, adapter les règles `.pipe li:nth-child(…)` et les pourcentages des animations
`step` et `step-mark` dans `style.css`.

## Comment ça marche

### Les pages projet

Chaque projet a sa « page » : un élément `<dialog class="work">` placé en fin de `index.html`,
affiché en plein écran. `script.js` ouvre celui dont l'`id` correspond à l'ancre de l'adresse
(`…/#watchd`). Passer par l'adresse donne trois choses sans routeur :

- chaque projet a un lien partageable ;
- le bouton « précédent » du navigateur referme le projet ;
- sans JavaScript, l'ancre suffit à afficher la page (règle `@media (scripting: none)`).

« Projet suivant » remplace l'entrée d'historique au lieu d'en ajouter une : un seul retour
arrière ramène toujours à la page, là où on l'avait laissée.

### Les rotations

Chaque bloc concerné déclare son angle de départ dans la variable CSS `--tilt` (et son angle
de repos dans `--rest` s'il ne finit pas droit). L'animation `settle` de `style.css` fait le
trajet, pilotée par le défilement (`animation-timeline: view()`).

Les feuilles de projet sont en `position: sticky` : chacune se cale sous la barre et la
suivante la recouvre. Le pivot de la rotation est choisi pour que le coin qui dépasse descende
toujours vers le bas, jamais sur le contenu au-dessus.

Dans les navigateurs sans animations liées au défilement, `script.js` pose une classe `.in`
quand le bloc entre à l'écran et le même geste se joue en transition.

### Sans JavaScript, sans animations

- **Sans JavaScript** : tout le contenu est lisible, les pages projet s'ouvrent par leur
  ancre, seuls les effets (mot tournant, heure, compteurs) manquent.
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

- Navigation complète au clavier, focus toujours visible. Une feuille de projet cachée sous
  les autres revient au premier plan quand elle reçoit le focus.
- Les pages projet sont de vrais `<dialog>` modaux : focus piégé dedans, fermeture par Échap.
- Les éléments décoratifs (icônes, lettres animées, légende de l'accueil) sont cachés aux
  lecteurs d'écran ; le texte réel leur est fourni à part quand il est découpé.
- Les animations respectent le réglage « réduire les animations » du système.
- Contrastes de texte d'au moins 4,5 pour 1, y compris le blanc sur le rouge.

## Navigateurs

Versions récentes de Chrome, Edge, Safari et Firefox. Le site utilise des fonctions CSS de
2022-2023 (`:has()`, unités `svh` / `dvh`, propriétés `rotate` / `translate`, couleurs
relatives) : sur un navigateur plus ancien la mise en page sera dégradée.

Les animations liées au défilement ne sont pas disponibles partout ; voir
[Les rotations](#les-rotations) pour le repli.

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
- Inspiration visuelle : [The Line Studio](https://thelinestudio.com/).
- Police : [Archivo](https://fonts.google.com/specimen/Archivo), sous licence SIL Open Font
  License, servie par Google Fonts.
