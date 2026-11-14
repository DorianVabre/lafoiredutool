# La Foire du Tool — V116

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


## V103 — Trajets et navigation

Nouvel onglet « Trajets et zaaps » dans Autres : coordonnées collées, choix de monde et de portion de carte, meilleur zaap selon les passages connus, commandes `/zaap` et `/travel` à copier, parcours et zaaps alternatifs. Les zaaps sélectionnés sont mémorisés localement. Données Dofus 3.7.13.17 chargées au premier calcul ; accès à conditions inconnues et deux zaaps incomplets exclus.

L’historique d’achats passe dans Rentabilité, dans l’ordre : Comparaison de farm, Historique d’achats, Brisage.

## V104 — Chargement local des trajets

Correction du chargement des zaaps et des trajets lorsque la page est ouverte directement depuis `index.html` : les données sont chargées à la demande par un script classique, sans `fetch` JSON. Le chargement HTTP reste pris en charge. Un message précise le fichier manquant si le dossier `data` n’accompagne pas la page.

## V105 — Commande de trajet combinée

La commande `/zaap … ; /travel …` est copiée automatiquement après un calcul ou un changement de destination ou de zaap. Un champ unique et un bouton permettent de la recopier si nécessaire ; le navigateur peut refuser la copie automatique. Suppression du détail du parcours et de la phrase d’instruction. Le bas de page commun mentionne seulement les données locales et l’accessibilité de certaines API, avec les sources conservées dans les crédits.

## V106 — Copie du zaap conseillé

Une icône en haut à droite de la bulle « Zaap conseillé » copie uniquement `/zaap x,y`. La commande combinée reste disponible et copiée automatiquement au calcul. Le bouton principal est renommé « Copier la commande ».


## V107 — Pied de page simplifié

Suppression du lien « Sources et méthode » et du document associé.


## V108 — Copie des noms d’objets et de runes

Icônes de copie dans les recherches, les recettes principales et leurs composants, le multicraft et sa liste de courses, le brisage et la forgemagie (objets et runes), ainsi que dans le titre des lots de l’historique. Le clic de copie reste indépendant de la sélection de l’objet. Confirmation visuelle et repli de copie pour les pages locales.


## V109 — Noms soulignés et copiables

Retour à la structure de mise en page précédant les icônes de copie : suppression des boutons, des conteneurs de recherche supplémentaires et des espacements associés. Les noms eux-mêmes sont désormais cliquables et soulignés en pointillés, sans ajout de largeur ou de hauteur. Copie aussi accessible avec Entrée ou Espace ; les autres zones des résultats conservent la sélection de l’objet.


## V110 — Craft unitaire compact

Espacement vertical réduit entre les composants et champs plus compacts dans le craft unitaire. Le bouton « Fabriquer » se place directement sous le nom et la quantité du composant, au lieu d’occuper une ligne séparée sous tous les champs.


## V111 — Titre du craft et confirmation de copie

Le titre du craft unitaire affiche l’icône de l’objet à la place du préfixe « 2. ». Les résultats de recherche de tous les outils et des recettes manuelles retrouvent des noms simples, sans copie au clic. Les noms copiables des objets sélectionnés, composants et runes affichent brièvement une infobulle « Copié ! » après une copie réussie, sans déplacer la mise en page.


## V112 — Multicraft compact et aide contextuelle

Composants et en-têtes du multicraft resserrés. Le bouton « Fabriquer » se place sous le nom de son composant, avant sa ligne séparatrice ; la grille conserve uniquement les quatre colonnes réellement utilisées. Dans le craft unitaire, l’explication des composants fabricables n’apparaît que si la recette en contient au moins un.

## V113 — Recalcul du parchotage par défaut

La Vitalité est explicitement retenue si aucune caractéristique n’est encore sélectionnée au chargement. Le résultat est recalculé à l’ouverture de l’onglet, au retour sur la page et lors de la validation des champs, en plus de la saisie, pour prendre en compte les valeurs restaurées par le navigateur sans événement `input`. Les prix et niveaux restent sauvegardés séparément par caractéristique.


## V114 — Trajet le plus court sans choix de portion

Le calcul de trajet compare automatiquement tous les accès correspondant aux coordonnées et retient le plus court depuis les zaaps sélectionnés. Le choix et la mention des portions disparaissent de l’interface ; la commande combinée est copiée directement. L’espace horizontal entre « Fabriquer » et l’indication « Craft/Achat moins cher » est augmenté dans les crafts unitaire et multicraft.

## V115 — Ancienneté des prix

Une petite horloge accompagne les prix renseignés dans le craft unitaire, le multicraft, le parchotage, l’XP forgemagie, le brisage et la comparaison de farm. Son infobulle indique l’ancienneté et la date de dernière saisie ; elle devient orange après 7 jours. Les dates sont enregistrées localement et partagées quand le prix l’est déjà. Les anciens prix sans date sont signalés comme à vérifier, sans leur inventer une date. Seule une nouvelle saisie du prix remet son ancienneté à zéro.

## V116 — La forge secrète du Gelano

Dans la recherche de runes de l’XP forgemagie, saisir « Gelano » puis Entrée ouvre `gelano.html` (casse indifférente). Le Gelano commence avec 1 PA. Sur un objet vide, le PA passe à 66 % et le PM à 1,5 % ; avec le PA, le PM passe à 1,5 % ; avec le PM, le PA passe à 26 %. Un échec retire le bonus présent. L’objectif est 1 PA + 1 PM, avec historique des 20 dernières tentatives, nombre total de runes consommées, écran de victoire et bouton pour recommencer. Le meilleur score est sauvegardé dans une clé indépendante des calculateurs. Les trois illustrations DofusDude sont incluses localement ; le mini-jeu fonctionne sans appel à l’API.
