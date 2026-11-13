# La Foire du Tool — V96

Refonte technique de la V89, sans changement fonctionnel volontaire.

- `index.html` : structure de la page
- `css/style.css` : styles
- `js/core/` : état partagé, accès API, calcul des prix
- `js/tools/` : un fichier par outil (craft, multicraft, historique, brisage, parchotage, farm, forgemagie)
- `tests/` : tests de non-régression

## Exécution

Héberger le dossier sur GitHub Pages (ou `python -m http.server 8000`). Ouvrir `index.html` via HTTP. Aucun bundler, aucune dépendance npm. Les scripts classiques `defer` partagent les fonctions globales historiques ; leur ordre est important.

## Tests

`npm test` génère d'abord un fichier `dofus-craft.html` **uniquement pour les tests** à partir des scripts réellement déployés. `npm run check:syntax` vérifie chaque script et leur combinaison. Ne pas modifier la fixture manuellement.

Les clés localStorage historiques sont conservées. Les tests ne remplacent pas une validation visuelle dans un navigateur.

## V91 — Multiplicateur de drop

Nouvel outil dans « Autres » : prospection à rendement décroissant, challenge, Almanax, Ankama Shield (+5 %), taux de base facultatif. Sauvegarde `la-foire-du-tool-drop-v1`. Le calcul estime une tentative de drop d'un personnage et ne couvre pas les exceptions de butin.

## V93

« Rentabilité du farm » devient « Comparaison de farm » dans la navigation et le titre de page. `dofus-craft.html` est une fixture de tests générée par `npm test` et n’est pas distribuée.

## V94 — Mini-jeu caché
Depuis l'onglet « Comparaison de farm », cliquer sur 🌽 à droite du titre pour ouvrir `mais.html`.
Le mini-jeu est indépendant des calculateurs et ne modifie aucune donnée enregistrée.
Le joueur et le rival se déplacent à 240 px/s. Le rival réagit après 250 ms et reste immobile entre deux maïs.

## V96 — Consultation des lots terminés

Suppression des informations de stock restant et de kamas en attente pour les lots terminés. Affichage de la marge nette en kamas et en pourcentage dans leur infobulle.
