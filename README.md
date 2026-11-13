# La Foire du Tool — V102

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

## V97 — Taxes HDV

Mise en vente (2 %) et changements de prix (1 % du nouveau prix) sur des lignes distinctes, déduites de la marge. Ces actions concernent tout le stock restant. Une vente directe crée la mise en vente manquante. Les anciennes ventes conservent leur calcul historique.


## V98 — Actions HDV

Quatre boutons : Mise en vente, Changement de prix, Retrait et Vente. Seule la mise en vente (2 %) est possible au départ et après retrait. Vente est ensuite sélectionnée par défaut. Le changement coûte 1 %. Le retrait conserve les taxes payées ; les ventes partielles laissent le stock restant en HDV. Texte et champ Prix actualisés.


## V99 — Vente au dernier prix HDV

La vente reprend automatiquement le prix de la dernière mise en vente ou du dernier changement de prix, sans champ de prix à saisir. Un message accompagne le retrait du stock HDV.


## V100 — Alignement du changement de prix

Le texte explicatif des taxes occupe sa propre ligne pour aligner le champ Prix et les boutons Enregistrer le changement de prix et Supprimer le lot, avec retour à la ligne sur les petits écrans.


## V101 — Position de la modale et statut HDV

La modale des lots garde une position haute fixe lors du changement d’action et grandit vers le bas, avec défilement pour les longs historiques. Les lots en cours mis en vente ont un fond hachuré orangé ; après retrait, ils retrouvent leur aspect initial. Les couleurs des lots terminés restent liées à leur marge.


## V102 — Nom de l’adversaire du mini-jeu

Dans le mini-jeu du maïs, le rival est renommé Guildeux organisé dans le score, le message de récolte et le libellé accessible du personnage.
