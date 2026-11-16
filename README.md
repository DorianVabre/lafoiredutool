# La Foire du Tool — V203

## V203 — Témoignages plus variés

Les nouvelles affaires E9 comportent au maximum un témoignage de chaque type, et deux distances chiffrées au total en regroupant PM, fourchettes de PO et distances à vol de tofu. La déduction sans supposition, la diversité des familles et la solution unique sont conservées. Les anciennes clés E1 à E8 reproduisent toujours leurs enquêtes ; cliquer sur « Nouvelle affaire » pour appliquer ces limites.

## V202 — Portée minimale et maximale dans l’enquête

Les nouvelles affaires E8 peuvent proposer une portée entre deux suspects, avec une PO minimale et maximale incluses. La portée ignore les obstacles et ne garantit pas la ligne de vue. Ces témoignages participent à la déduction et à la solution détaillée, avec les autres familles d’indices. Glossaire complété. Les anciennes clés E1 à E7 conservent exactement leurs enquêtes ; utiliser « Nouvelle affaire » pour passer à E8.

## V201 — Nouveaux témoignages d’enquête

Nouvelles affaires E7 : diagonale non orientée entre suspects, comparaison de proximité et équidistance au contact des décors, en PM. Les trajets vers les décors s’arrêtent sur une case libre voisine. Nouvelles familles intégrées au générateur et au déroulé de solution, avec diversité, unicité et déduction sans supposition conservées. Anciennes clés E1 à E6 inchangées ; lancer une Nouvelle affaire pour utiliser E7. Glossaire complété.

## V200 — Suivi d’élevage par lot

Consignes du suivi raccourcies : retrait temporaire sans explication de phase, ajout/reprise sans complément et mention « objectif atteint » seule. Origine et destination conservées pour les transferts.

Corrections du suivi : distinguer les montures réellement sélectionnées des occupants d’enclos en attente de retrait, avec messages nommant la monture et l’enclos bloquants. Conservation des DD dans leur enclos compatible au départ et entre phases afin d’éviter les transferts gratuits. Consignes explicites pour les transferts, attentes temporaires, reprises et objectifs atteints, y compris sur les plans déjà sauvegardés. Les suivis en cours restent conservés ; recalcul après pause pour bénéficier du nouvel ordonnancement.

Confirmation d’une action : suivi automatiquement réduit. En-tête d’enclos compact avec sélection/suppression alignées. Affectation exclusive Fécondité / XP / Aucun depuis les onglets, reprise des anciennes affectations et protection des suivis en cours ; lancement sur les enclos affectés à l’objectif. Tris de la sélection des montures (nom, robe, proximité du but, sérénité, jauges, XP et fécondité) avec sens inversable et préférences séparées par objectif. Niveau requis indiqué uniquement sur les enclos verrouillés.

Suivi : consignes regroupées par enclos, Pause placée avant Arrêter ce suivi, bouton de lancement pleine largeur mis en valeur. Recherche par nom dans la réserve latérale et retrait du champ de renommage des enclos.

Suivi par lot commun de montures : sélection indépendante des enclos, file d’attente, priorité aux fins proches et remplissage par phases compatibles. Version maintenue en V200 pendant la finalisation de cette fonctionnalité.

## V199 — Contrôles dans le thème du site

Suivi d’élevage par lot commun : choix indépendant des montures (réserve et enclos libres) et des enclos de travail. Priorité au travail restant estimé, remplissage des places par phases compatibles, confirmation des transferts et recharges, progression terminées/en enclos/en attente. Montures en attente réservées au suivi ; celles terminées et retirées redeviennent disponibles pour l’autre objectif. Deux suivis indépendants, modification après pause et recalcul, anciens suivis conservés. Les durées et achats sont une prévision du plan proposé, sans garantie d’optimum global.

Stratégies d’élevage sélectionnables par boutons enfoncés/relâchés, à sélection unique. Titre centré et mis en valeur ; quatre paliers soulignés d’un trait fin et regroupés sous « Vitesse ». Intitulé « Objectif » avec le même trait fin au-dessus du sélecteur Fécondité/Niveau. Rangée dédiée avec cible et unité en mode XP, adaptée aux petits écrans.

Cœur coloré dans le tri de la réserve. Objectif XP explicitement distingué du plafond de niveau 200 ; la cible de niveau 100 est une valeur par défaut configurable, pas une limite du moteur.

Fiche compactée : niveau et XP côte à côte, icônes alignées avec les noms des jauges et cœur coloré dans le rappel d’accessibilité.

Fiches des montures éditables depuis la réserve ou les enclos : nom, espèce/robe avec sélecteur illustré, jauges, capacité et niveau/XP. Limites de saisie conservées ; modification des montures suivies après mise en pause.

Contrôles harmonisés sur toutes les pages : cases à cocher vertes, barres de défilement sombres et suppression des flèches numériques sur les champs de grands nombres. Flèches conservées sur les stocks possédés et les petites valeurs bornées (niveaux, minutes, pourcentages).

## V198 — Sélecteur illustré et limites de saisie

Sélection multiple : défilement de la réserve conservé. Destination conservée tant que les montures déjà saisies tiennent dans l’enclos ; petit avertissement orange à côté de « Destination du lot » et sur le bouton « Terminer », avec tooltip, si la fiche actuelle ferait dépasser la capacité. Bascule sur la réserve dès que le lot déjà saisi dépasse les places disponibles, ou à la validation d’un lot trop grand.

Saisie multiple : sélection de la monture via la même modale illustrée et filtrable que dans les enclos, ouverte au-dessus de la fiche. Champs numériques d’élevage ramenés automatiquement à leurs bornes pendant la saisie (jauges 0–20 000, sérénité −5 000–5 000, réserves 0–200 000, niveaux 1–200 et XP selon leur plafond).

## V197 — Ajout rapide de plusieurs montures

Gestion des montures renommée et bouton pleine largeur de saisie en série : trois jauges accessibles par Tab, robe, nom, sérénité, capacité et niveau. Continuer ouvre la monture suivante ; Terminer enregistre tout le lot dans la réserve ou un enclos disponible, avec vérification atomique des places, du déblocage et des suivis actifs.

## V196 — Réduction du suivi et alerte visible

Bouton de réduction remplacé par un petit − dans le coin du suivi. Badge rouge ! affiché quand une action est attendue, y compris dans le suivi réduit.

## V195 — Affichage des durées du plan

Signe + déplacé de la durée cumulée vers l’incrément dans le tableau des actions d’élevage. Calculs inchangés.

## V194 — Jauges compactes et icônes harmonisées

Activation et désactivation indiquées par + et −. Icônes d’origine reprises (éclair, goutte, cœur, étoile) ; résumé des jauges sur deux lignes : sérénité et XP, puis endurance, maturité et amour. Affichage uniquement.

## V193 — Actions et jauges du suivi d’élevage

Actions illustrées : retrait rouge, ajout vert, hausse/baisse de sérénité par flèches violettes et symboles des autres jauges. Résumé par enclos des jauges à reprendre après chaque étape, avec mini-jauges ON/OFF, dans le suivi et le plan.

## V192 — Crédits communs

Mention de Murdoku retirée des crédits communs ; attribution conservée sur la page de l’enquête.

## V191 — Crédits de l’enquête

Retrait des références au dépôt de code décompilé dans les crédits et le README. Aucun changement du moteur de jeu.

## V190 — Sources et crédits centralisés

Crédits complétés pour DofusDB, Dofus Wiki, Dofus pour les Noobs, les références de l’enquête et Google Fonts, avec information sur les appels externes. Sources retirées de la modale XP métier et regroupées en bas de page ; liens vers les crédits depuis les mini-jeux.

## V189 — Minimap dans Trajets et zaaps

Minimap partagée avec la chasse : zoom, glissement, coordonnées au survol et clic pour choisir la destination. Repères du zaap conseillé et de la destination dans le Monde des Douze. Carte masquée pour les autres mondes.

## V188 — Aperçu et commandes de sauvegarde

Placements définitifs entourés d’un jeton rond dans l’aperçu pour les distinguer des brouillons. Boutons de sauvegarde regroupés sur une ligne séparée sous les autres actions.

## V187 — Point de sauvegarde de l’enquête

Sauvegarde manuelle des placements, brouillons et KO, conservée au rechargement. Bouton pour écraser ou charger ce point, avec aperçu de la grille au survol et au focus clavier. Chargement annulable ; chronomètre et consultation de Solution conservés. Point réinitialisé au changement d’affaire.

## V186 — Direction et distance de chasse visibles

Grande flèche verte et nombre de maps au-dessus du résultat de chasse, conservés lors du passage automatique à la position suivante. Liste des indices affichée intégralement, sans défilement interne sur ordinateur ni mobile.

## V185 — Suppression des indices

Suppression du bouton Indice, de son panneau et de la logique de conseils et corrections automatiques. La solution complète et le marquage discret de sa consultation sont conservés.

## V184 — Indices liés au plan du joueur

Chaque indice propose une seule déduction depuis les placements, brouillons et KO actuels, sans exploiter des étapes intermédiaires non reportées. Sans changement du plan, le bouton conserve la même piste. Le déroulé complet de Solution reste inchangé.

## V183 — Titre du glossaire

Ajout de « Glossaire : » en gras avant les définitions PM, ligne de vue et directions.

## V182 — Contexte et contrôles de l’enquête

Rapport reformulé en un paragraphe de contexte et de principe, avec les deux règles clés en gras rouge, puis un paragraphe « Contrôles : » consacré aux interactions.

## V181 — Intitulés de règles harmonisés

« Les directions » apparaît également en gras et en rouge, comme « PM : » et « Ligne de vue : ».

## V180 — Couleur des intitulés de règles

Rouge réservé aux intitulés « PM : », « Ligne de vue : » et « Les directions » ; explications dans la couleur habituelle.

## V179 — Rapport du Corbac clarifié

Consignes de placement simplifiées ; règles PM et ligne de vue séparées et mises en valeur en rouge clair. La précision sur les directions rejoint ce bloc de règles.

## V178 — Lisibilité du temps de victoire

Texte du résultat et du temps en vert sombre sur fond doré, avec ou sans consultation de la solution.

## V177 — Enquête chronométrée

Scène et témoignages masqués avant « Commencer », chronomètre sauvegardé et figé à la victoire. La consultation de Solution est mémorisée et modifie discrètement la ponctuation du résultat.

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

## V117 — Sessions multicraft sauvegardées

Un panneau sous « Ajouter des objets » permet d’enregistrer la sélection en cours avec un titre et de charger ou supprimer les sessions précédentes. Les recettes et composants chargés, quantités, choix achat/craft, stratégie et possessions sont sauvegardés localement. Les prix partagés et leur ancienneté restent ceux des derniers relevés. Un chargement ou une suppression peut être annulé.

## V118 — Aide Fabriquer en infobulle

La phrase d’aide des ingrédients composites quitte le haut du craft unitaire pour une petite bulle « ? », alignée à côté de chaque bouton Fabriquer dans les crafts unitaire et multicraft. L’explication apparaît au survol, au focus clavier ou au clic.

## V119 — Craft ou revente des composants possédés

Le récapitulatif du craft unitaire passe à six cartes. La première carte de la deuxième ligne compare la vente de tous les objets fabriqués, moins les achats manquants, à la revente des composants possédés qui seraient utilisés. Les branches composites suivent le choix achat/craft effectif ; les stocks excédentaires ou inutilisés sont exclus. Les prix manquants empêchent une comparaison trompeuse. Le champ du prix HDV final perd son style facultatif en pointillés.

## V120 — Récapitulatif des coûts et aides de calcul

Les six cartes du craft unitaire disposent d’une aide « ? » avec leur formule et la prise en compte des possessions. La carte « Différence des coûts » affiche le coût de fabrication puis le coût d’achat HDV pour la quantité sélectionnée, en vert pour le moins cher et en rouge pour le plus cher (neutre en cas d’égalité ou de données incomplètes). La comparaison de revente est renommée « Vente du produit VS vente des composants » et son verdict positif devient « Vendre après craft est plus rentable ».

## V121 — Valeurs brutes et marges sans stock

Textes des infobulles revus. « Comparaison des coûts » garde la déduction des possessions. « Valeurs brutes totales » affiche la valeur HDV de tous les composants de la recette puis celle des produits finis, avec le moins cher en vert. Les marges journalières en kamas et en pourcentage utilisent le coût de fabrication sans stock (en conservant le choix optimisé achat/craft des composites). Le taux par objet est indépendant de la quantité sélectionnée. Les économies personnelles continuent de déduire le stock.

## V122 — Conclusions du craft unitaire

Deux phrases sous le récapitulatif recommandent acheter ou crafter selon le stock et comparent la valeur brute de l’objet à celle des composants. Les résultats sont mis en évidence en vert et en gras ; les égalités sont explicites et chaque conclusion reste masquée si ses prix sont incomplets.

## V123 — Synthèse compacte et conseils selon l’objectif

Les économies et les marges journalières regroupent chacune leurs valeurs en kamas et en pourcentage, avec seulement l’aide du montant en kamas. Le récapitulatif passe à quatre cartes. Les conclusions distinguent garder l’objet et faire de l’achat/revente : acheter ou crafter selon le stock, puis crafter et revendre si la valeur du produit dépasse celle des composants, vendre les composants possédés sinon, ou signaler l’absence de rentabilité sans stock.

## V124 — Revendre son stock avant d’acheter

Le conseil pour garder l’objet compare trois coûts : compléter son stock pour crafter, acheter directement et revendre le stock utile au craft puis acheter. La troisième option apparaît dans la carte Comparaison des coûts quand la revente a une valeur positive. La valeur des stocks est plafonnée aux quantités réellement utilisées par le parcours achat/craft retenu ; les surplus inutilisés restent communs aux scénarios. Les prix manquants empêchent une recommandation incomplète. Le conseil achat/revente en boucle compare uniquement les composants et le produit fini, sans stock. Les cas reproductibles figurent dans `data/craft-scenarios-v124.json`.

## V125 — Gain explicite après revente et achat

Quand la revente du stock couvre plus que le prix du produit final, la ligne « Revente + achat » affiche « Gain de … K » au lieu d’un coût négatif. Les coûts nuls ou positifs conservent leur affichage habituel.

## V126 — Couleurs en cas de gain net

Si « Revente + achat » affiche un gain net, ce gain reste vert et les deux alternatives « Fabrication » et « Achat HDV » passent toutes deux en rouge.

## V127 — Aides simplifiées et revente toujours visible

Les infobulles Comparaison des coûts et Valeurs brutes totales reprennent les textes demandés. La ligne Revente + achat reste visible : sans stock revendable, elle affiche le prix d’achat ; si les données nécessaires manquent, elle affiche un tiret. Le conseil précise désormais « achat/revente sans stock en boucle ».

## V128 — Revente sans stock grisée

Sans stock renseigné sur les composants de la recette, la ligne « Revente + achat » reste visible mais grisée, avec son montant neutre. Elle retrouve ses couleurs habituelles dès qu’un stock est renseigné.

## V129 — Date du relevé des ventes

Le nombre d’articles vendus sur 30 jours dispose de la même horloge que les prix : ancienneté et date exacte de dernière saisie, rappel orange après sept jours. La date est sauvegardée par objet, indépendamment de celle du prix HDV. Les volumes déjà enregistrés sans date sont signalés comme à vérifier.

## V130 — Conclusions avant les chiffres

Le bloc des deux conseils du craft unitaire apparaît désormais au-dessus des quatre cartes analytiques, après les champs de prix et de ventes.

## V131 — Stocks persistants et remise à zéro

Les possessions du craft unitaire sont mémorisées par recette et par branche, y compris les composites. Un bouton près du nom de l’objet réinitialise les stocks de la recette courante. En multicraft, le bouton près de « Liste d’achats et possessions » remet à zéro l’inventaire mémorisé ; charger une session sauvegarde aussi ses possessions dans le navigateur. Les prix et les sessions enregistrées sont conservés. La conclusion de revente devient « L’achat/revente sans stock en boucle est/n’est pas rentable », avec la couleur sur le verdict.

## V132 — Stock commun aux crafts

Un stock unique par identifiant d’objet est partagé entre craft unitaire et multicraft, y compris après rechargement. Les anciennes possessions sont reprises (priorité à l’inventaire multicraft ; pour les anciennes branches unitaires, maximum par objet, sans additionner les vues). Le stock est réparti entre les branches d’une recette pour éviter le double comptage. Modifier, réinitialiser ou charger le stock d’une session multicraft se répercute dans l’autre outil. La conclusion utilise « à la chaine » au lieu de « en boucle ».

## V133 — Lignes de courses réglées

Dans la liste d’achats multicraft, les lignes dont la quantité « À acheter » est nulle prennent une teinte verte atténuée. L’état se met à jour pendant la saisie du stock et disparaît si un achat redevient nécessaire, sans désactiver les champs ni la copie des noms.

## V134 — Quantités manquantes en craft unitaire

Chaque ligne affiche une colonne « À acheter » entre le prix unitaire et le montant en kamas. La quantité manquante et le montant se mettent à jour pendant la saisie des possessions. Les besoins sont libellés « nécessaires » et les sous-composants suivent la quantité de composites restant à fabriquer. La grille s’adapte aux petits écrans.

## V135 — Lignes unitaires réglées

Les ingrédients du craft unitaire dont « À acheter » vaut zéro prennent la même teinte verte atténuée que la liste multicraft. La couleur suit les modifications du stock et de la quantité à crafter ; les champs et les boutons restent actifs.

## V136 — Libellés de sauvegarde multicraft

Le panneau est renommé « Sauvegarder un multicraft », son champ « Nom du multicraft » et son bouton « Enregistrer le multicraft en cours ».

## V137 — Identité Corbac

Le Corbac remplace le losange à côté du nom du site et sert de favicon aux pages principale et mini-jeux. L’image originale est incluse localement dans `data/corbac.png` (monstre Corbac n°281, visuel 170, source : https://api.dofusdb.fr/img/monsters/170.png ; éléments DOFUS © Ankama).

## V138 — Emojis des titres

Les grands titres des outils reprennent à droite l’emoji de leur bouton de menu, à titre décoratif. La comparaison de farm conserve son maïs et son accès au mini-jeu existant.

## V139 — Entrée secrète du brisage

Le brisage utilise 🏺 dans le menu et le titre. Le marteau près de « Rentabilité du brisage » peut être pris pour suivre la souris : chaque coup sur le vase fait trembler la page et le troisième ouvre `concasseur.html`, page volontairement vide. Échap, un second clic sur le marteau ou le changement d’outil permettent de le reposer.

## V140 — Le concasseur rythmique

Mini-jeu de 60 secondes à cinq pistes, accessible par les trois coups de marteau. Des équipements THL et des Chachas descendent vers des cercles de frappe. Souris, tactile ou touches D/F/Espace/J/K ; timing parfait à ±45 ms, bon à ±95 ms, tolérance maximale ±140 ms. Le score dépend du timing, du coefficient de l’objet et du combo. Un brisage retire 24 points de coefficient à l’objet et ajoute 7 aux autres, entre 20 % et 220 %. Les Chachas touchés miaulent et coûtent 250 points ; les objets ratés et frappes à vide sont également pénalisés. Pause manuelle et automatique, résultats, record local et bouton Rejouer. Les visuels DofusDude sont inclus dans `data/concasseur/` ; sons synthétisés avec Web Audio, désactivables. Aucun prix ni stock des calculateurs n’est utilisé.

Chaque équipement conserve une colonne fixe, identifiée par son icône et son nom en haut de piste. Les Chachas restent des intrus possibles sur toutes les pistes pour éviter une colonne qu’il suffirait d’ignorer.

## V141 — Clavier du concasseur après réglage du son

Un clic sur le bouton du son rend le focus à la piste pendant la partie et le décompte. D/F/Espace/J/K restent prioritaires pendant le jeu, même si un bouton a le focus ; Espace ne réactive plus le son et son maintien ne fait pas défiler la page.


## V142 — Chasse au trésor

Nouvelle page dans Autres, sous Trajets et zaaps : API DofusDB, coordonnées collables, croix directionnelle, indices filtrés sans accents et copie automatique de /travel. Affichage de la distance, copie manuelle de secours et bouton Indice trouvé pour reprendre la destination au prochain indice. Les Phorreurs restent à repérer en jeu.


## V143 — Une nouvelle surprise

Ajout d’un mini-jeu secret lié à la chasse au trésor : enquêtes de logique aléatoires à solution unique, clés partageables et vérifiées, sauvegarde locale et annulation des placements. Le format de clé E1 fige le générateur pour reproduire les mêmes niveaux.


## V144 — Accès secret révisé

La rose des vents reste inerte, sans animation, avant la séquence directionnelle secrète. Une fois déverrouillée, un seul clic ouvre le mini-jeu.


## V145 — Brouillons et décors d’enquête

Mode Brouillon : plusieurs cases possibles par suspect, plusieurs suspects par case, sauvegarde et annulation communes aux placements. Six décors illustrés originaux bloquent des cases et servent de repères aux nouveaux témoignages. Les nouvelles affaires utilisent des clés E2 ; les clés E1 conservent leur enquête d’origine.


## V146 — Relations entre suspects et saisie directe

Nouvelles clés E3 : indices rééquilibrés (deux repères de décor maximum), distances en PM par le plus court chemin sans diagonale autour des obstacles fixes, et lignes de vue entre suspects. Le corps ne bloque pas la vue ; les décors et les autres suspects la bloquent. Le calcul PM ignore les autres suspects et le tacle. Géométrie centre à centre, coins seulement effleurés autorisés ; adaptation à notre grille plane, sans prétendre reproduire les différences de hauteur du jeu. Clés E1/E2 conservées. Brouillons au clic droit (Maj+clic ou N / Maj+Entrée au clavier), boutons de mode retirés. Suspects sur des jetons ronds colorés avec noms contrastés.


## V147 — Déductions sans suppositions

Nouvelles clés E4 : deux indices maximum par famille (PM, vue, direction, proximité, salle, moitié de plan, ligne, colonne ou décor), au moins quatre familles dont PM et vue ; dédoublonnage des indices par leur sens (contraintes équivalentes), puis contrôle par un moteur de propagation sans branchement ni accès à la réponse. Il élimine les cases incompatibles, croise les relations deux à deux et applique la règle des lignes/colonnes jusqu’au point fixe. Si le niveau ne se résout pas ainsi, ajout d’un indice utile ; suppression des indices dont ce raisonnement peut se passer. Les indices de vue sont propagés prudemment tant que les tiers ne sont pas placés. La preuve finale doit placer les six suspects ; les clés E1 à E3 restent identiques. Pour bénéficier de la garantie, lancer une Nouvelle affaire (E4).


## V148 — Salles aux formes variables

Nouvelles clés E5 : salles connexes de tailles et contours variables, noms de salles variés dans les indices de présence ou d’exclusion. Les bordures du plan suivent la carte des salles ; le survol indique leur nom. La scène du crime, le coupable et les indices utilisent cette même carte. Les limites des salles restent franchissables et transparentes. Résolution sans suppositions, dédoublonnage et limite de deux indices par famille conservés. Clés E1 à E4 inchangées.


## V149 — Plan allégé

Suppression de la phrase de légende sous le plan. Les consignes de placement et de brouillon ainsi que les règles de l’enquête restent disponibles.


## V150 — Brouillons nettoyés et aides de résolution

Un placement grise sa ligne et sa colonne et retire les brouillons incompatibles. Annuler restaure placements et notes. Consigne raccourcie et navigation personnalisée au clavier retirée. Indice retire d’abord les placements confirmés faux et s’arrête, puis propose une déduction expliquée au clic suivant. Solution affiche les éliminations successives, les positions finales et le coupable, sans remplir le plan. Les aides s’adaptent aux éditions précédentes ; si un ancien niveau dépasse la propagation simple, cela est signalé. Clés et niveaux inchangés.


## V151 — Déductions plus accessibles

Nouvelles affaires E6 : chaque application utile d’un témoignage réduit le suspect concerné à six cases maximum ; les relations sont exploitées lorsque l’autre suspect a lui aussi six possibilités maximum. Les indices de position trop vagues (plus de six cases libres dès le départ) sont exclus ; les plus précis se présentent avant les relations. Le générateur conserve les indices qui rendent cette progression possible, même si une propagation plus exigeante pourrait s’en passer. Les éliminations automatiques de ligne/colonne restent applicables à toutes les cases. Diversité, plafond de deux indices par famille, unicité et déduction sans supposition conservés. Clés E1 à E5 inchangées ; Indice et Solution suivent le nouveau parcours pour E6.


## V152 — Cases KO et sélection latérale

Pastilles rondes des suspects à gauche de la grille, avec prénom visible et nom complet au survol. Nouvel outil ∅ Vide pour marquer une case KO sans placer de suspect : suppression des brouillons de cette case, sauvegarde, retrait au clic et restauration complète par Annuler. Les cases KO restent des annotations du joueur, indépendantes des preuves utilisées par Indice et Solution. Réinitialiser efface également les marqueurs. Message de vérification en échec raccourci. Clés et enquêtes inchangées.


## V153 — Marquage en glissant

Clic maintenu et glissement pour les brouillons au clic droit, les cases KO aux deux boutons et le déplacement d’un suspect au clic gauche. Le premier marquage définit ajout ou effacement, les cases déjà parcourues ne basculent pas de nouveau et Annuler restaure le geste entier. Les brouillons supprimés pendant le déplacement d’un suspect correspondent uniquement à sa dernière position, sans suppression cumulée le long du trajet. Arrêt au relâchement ou à la perte de focus. Le rappel permanent sur les cases occupées est masqué dans les témoignages ; numérotation des aides et sauvegardes des cases cochées adaptées. Clés et enquêtes inchangées.


## V154 — Glissement au clic droit et indices contextuels

Glissement réservé au clic droit : le clic gauche reste ponctuel, sans déplacement ni nettoyage au survol. Indice tient compte des placements corrects, des listes de brouillons compatibles et des KO valides, écarte les déductions déjà marquées et propose seulement les nouvelles cases. Les brouillons ne sont retirés que lorsqu’une étape de déduction les contredit, avec explication ; les KO occupant une case de la solution peuvent également être corrigés. Chaque correction est annulable et interrompt le clic sans autre nouvelle proposition. Clés et enquêtes inchangées.


## V155 — Frappes simultanées du concasseur

Les frappes utilisent l’horodatage des événements clavier/pointeur, avec un suivi indépendant des touches pressées et relâchées. Le rendu, le HUD et l’animation du marteau sont mutualisés dans la frame suivante au lieu d’être refaits à chaque touche d’un accord ; le HUD ne réécrit plus les valeurs inchangées. Les états de touches sont réinitialisés en pause, à la reprise, au redémarrage et en fin de partie. Les fenêtres de jugement et les règles de score restent identiques.


## V156 — Texte des coefficients et version visible

Texte du concasseur reformulé : « À chaque brisage, l’objet perd 24 % de coefficient, et les autres en gagnent 7. » Version du site affichée dans le footer de la page principale et des quatre mini-jeux.


## V157 — Gestion des enclos

Nouvel onglet Élevage dans Optimisation : six enclos selon le niveau métier, dix dragodindes par enclos, jauges et réserves persistantes. Plan de fécondité par lots et ticks de 10 s, stratégies économie (réserve minimale) ou vitesse (remplissage maximal), combinaison de carburants au coût minimal parmi les prix saisis. Catalogue local de 120 carburants Dofusdude relevés le 15/11/2026. Parcours commun déterministe, sans garantie d’optimalité globale ni bonus Almanax. Suivi manuel avec confirmations, alarmes Web Audio partagées entre outils et reprises sur les autres pages ; son à réactiver après navigation, arrière-plan soumis aux restrictions du navigateur. Version V157 dans tous les footers.


## V158 — Espèces de montures et images des carburants

Images des consommables dans la saisie des prix. Sélecteur d’espèce (Dragodinde, Muldo, Volkorne) avant le nom de chaque monture, conservé dans la sauvegarde ; les anciennes entrées prennent Dragodinde par défaut. Libellés génériques « monture » dans l’outil et les plans. Version V158 dans tous les footers.


## V159 — Parcours et catalogue des montures

Sélecteur avec recherche et filtre de famille pour 306 montures élevables Dofusdude. Images et noms copiables pour les consommables, les achats et les recharges. Suivi compact hors Élevage, compte à rebours et heure de prochaine action. Parcours en colonnes durée cumulée / incrément / action ; les étapes confirmées disparaissent et le plan actif est restauré au rechargement. Recharges avancées au départ sans modifier les réserves simulées : premières recharges de chaque jauge, et regroupement des suivantes en économie lorsque tout reste au palier 1 sans perte ; les autres restent au bon moment. Version V159 dans tous les footers.


## V160 — Réserve persistante et suivi multi-enclos

Identifiants permanents et migration des montures existantes, réserve à gauche, drag & drop et sélecteur de déplacement entre enclos. Le retrait conserve la monture. Sélection des enclos pour un plan parallèle commun, actions simultanées regroupées et libellés courts. Confirmation des actions : recharge des carburants et transfert réel des montures dans la sauvegarde. Simulation persistante par ticks de 10 secondes, consommation partagée, pause/reprise et arrêt à chaque action attendue ; reprise sur les autres pages. Les déplacements pendant une pause arrêtent le plan pour pouvoir le recalculer. Prix dotés de l’horloge commune de dernière saisie. État estimé, toujours à rapprocher des valeurs en jeu. Version V160 dans tous les footers.


## V161 — Cartes de montures et jauges visuelles

Enclos présentés en cartes adaptatives sans défilement horizontal ; réserve compacte avec portraits, icônes de jauges et tri persistant (nom, espèce/robe, maturité, endurance, amour, fécondité, sens inversable). Carburants toujours visibles, icônes et barres graduées aux paliers 80k/140k/180k. Barres sous les jauges des montures, mises à jour pendant le suivi. Clic sur une monture : fiche détaillée et suppression, annulable dans la réserve ; une monture suivie ne peut être supprimée qu’après mise en pause, ce qui arrête le plan concerné. Planning adaptatif sur petit écran. Version V161 dans tous les footers.


## V162 — Suppression groupée et détails de présentation

Sélection de montures depuis les enclos ou la réserve, sélection globale par zone et suppression atomique du lot. Annulation du dernier lot avec restauration des identités et des jauges dans la réserve ; compatibilité avec les anciennes suppressions individuelles. Protection des montures suivies tant que le plan n’est pas en pause. Loupe accolée au nom de l’espèce, retrait du bouton Fiche et surlignage dynamique des jauges accessibles selon la sérénité. Espacement de 25 px entre la navigation et le bloc Mes montures. Version V162 dans tous les footers.


## V163 — Cartes déplaçables et Ctrl+clic

Glisser-déposer depuis toute la carte de monture en enclos et en réserve ; les champs restent modifiables. Ctrl+clic (ou Cmd+clic) ajoute ou retire une monture de la sélection sans ouvrir sa fiche. Glisser une monture sélectionnée déplace le lot entier, avec contrôle atomique des dix places, conservation des identités et protection du plan en cours. Version V163 dans tous les footers.


## V164 — Choix du palier de vitesse et amour à sérénité zéro

Cinq stratégies : économie au minimum nécessaire ou vitesse avec remplissage au palier 1 (80 000), 2 (140 000), 3 (180 000) ou 4 (200 000). Coûts, recharges et durées calculés selon le palier choisi, sans retirer les réserves déjà supérieures. Le choix historique speed correspond toujours au palier 4. L’amour est accessible dès 0 de sérénité dans le planificateur, les ticks du suivi, les surlignages et la fiche ; aucun passage à +1 n’est imposé. Version V164 dans tous les footers.


## V165 — Protecteurs et XP métier des routes de farm

Dans Comparaison de farm, option de fin de session (chronométrée ou manuelle) pour les 85 ressources récoltables reconnues : protecteurs vaincus donnant chacun un sac de 50, quantités saisies sacs inclus ou ajout automatique des sacs. XP métier estimée à partir du nombre d’actions ou d’un rendement moyen hors sacs ; XP par action proposée selon 10 + floor(niveau de récolte / 5), modifiable, avec bonus explicite. Historique détaillé, revenus incluant les sacs une seule fois et cumul d’XP par métier sur les sessions renseignées. Anciennes sessions inchangées, aucun XP fictif déduit des seuls sacs. Catalogue des compétences DofusDB relevé le 15/11/2026 dans data/farm-recoltes.json ; barème indicatif recoupé avec https://dofuswiki.fandom.com/wiki/Farmer/Gathering et https://www.reddit.com/r/Dofus/comments/1d9og13/ ; sacs confirmés par https://dofus.jeuxonline.info/article/1609/paysan. Version V165 dans tous les footers.


## V166 — Rendements et XP de récolte automatiques

Le formulaire des sessions demande désormais un niveau par métier, mémorisé par activité. Plus de saisie des actions, du rendement moyen ou de l’XP par action : fourchette et moyenne calculées par ressource, XP selon le barème fourni (10 à 50), après exclusion des sacs de 50. Bonus de quantité et d’XP séparés. Même calcul en session manuelle et chronométrée ; historique existant conservé sans recalcul.

Règles, sources, exceptions et limites dans [data/farm-rendements.json](data/farm-rendements.json). Modèle communautaire à niveau constant : progression normale + minimum tous les 30 niveaux, maximum tous les 10 ; exceptions à une unité. Rendement non confirmé pour Obsidienne, Pichon d’encre, Cristal liquide et Cristal pliable : pas d’XP inventée, sacs et revenus conservés. Les anciens tableaux contiennent quelques incohérences ; l’interface présente donc une estimation, pas une mesure exacte. Version V166 dans tous les footers.


## V167 — Réserve et saisie des jauges

Les pourcentages de la réserve occupent toute la largeur de leur carte et peuvent revenir à la ligne, y compris avec trois jauges à 100 % et le témoin de fécondité. Flèches numériques natives rétablies sur les jauges. Le déplacement de la carte est désactivé dès l’appui dans un champ et pendant son édition, puis rétabli sans déverrouiller les montures d’un plan actif. Version V167 dans tous les footers.


## V168 — Texte de l’estimation d’XP

Phrase explicative du farm raccourcie : « XP estimée à partir du rendement moyen, après retrait des sacs. » Version V168 dans tous les footers.


## V169 — Affichage du rendement de récolte

Format simplifié : « Récolte moyenne 17 (7-27) - 10 XP/récolte de base ». Version V169 dans tous les footers.


## V170 — Résumé d’XP compact

Aperçu et historique des récoltes : une ligne « XP totale = X (y de [Blé], z de [Orge]) », noms copiables et contributions par ressource. Les valeurs indisponibles restent signalées sans fabriquer de total complet. Version V170 dans tous les footers.


## V171 — XP par heure des activités

Le cumul d’XP par métier est remplacé par un indicateur compact XP / heure, dans l’activité sélectionnée et sa carte. Calcul pondéré : somme des XP / somme des durées des sessions dont l’XP est entièrement estimée ; anciennes sessions sans XP et estimations incomplètes exclues. L’historique affiche seulement l’XP totale en petit après les récoltes. Le détail par ressource reste dans l’aperçu de saisie. Version V171 dans tous les footers.


## V172 — Objectifs de niveau et suivis d’élevage parallèles

Bascule Fécondité / Niveau dans Mes montures, fécondité par défaut. Mode Niveau : niveau actuel, XP totale déjà acquise et niveau visé de 1 à 200, conservés par monture ; capacité Sage ×2. Stratégies et sélections d’enclos séparées pour chaque mode. Le plan XP optimise les achats selon les prix renseignés, indique l’XP de réserve consommée et à recharger par enclos, maintient le palier de vitesse choisi par des recharges successives, et retire chaque monture à son objectif. Le mode économie ne charge que le besoin restant, par remplissages plafonnés à 80 000 ; une réserve existante plus haute est conservée. Arrondis aux ticks de 10 secondes.

Deux suivis persistants indépendants sur des enclos distincts : pauses, confirmations, arrêts et fenêtres d’alertes séparés, y compris sur les autres pages. Les enclos occupés par l’autre suivi sont signalés et exclus. Les montures et leur progression restent sauvegardées lors des déplacements ou d’un arrêt. Les données et suivis de fécondité existants sont conservés.

Barème local des 200 niveaux dans [data/elevage-xp.json](data/elevage-xp.json), relevé le 15/11/2026 depuis [les tableaux d’expérience](https://www.dofuspourlesnoobs.com/tableaux-dexpeacuterience.html). Règles recoupées avec le [guide de l’éleveur actualisé le 13/10/2026](https://www.dofuspourlesnoobs.com/guide-de-l-eleveur.html). Hors bonus Almanax. Version V172 dans tous les footers.


## V173 — Cible XP commune et réduction des suivis

Cible du plan XP placée à côté de la stratégie : niveau de 1 à 200 ou XP totale de 0 à 867 582, sauvegardée et appliquée à toutes les montures des enclos sélectionnés. Les cartes conservent les valeurs actuelles ; la cible du suivi reste figée au lancement. Les anciens suivis gardent leurs objectifs. Bouton Réduire présent dans chaque fenêtre développée, même sur la page Élevage ; réduction indépendante maintenue au rafraîchissement, et bouton Détails pour rouvrir. Version V173 dans tous les footers.


## V174 — Minimap de chasse et étape automatique

Minimap du Monde des Douze dans la chasse : fond de carte DofusDB chargé à la consultation, grille, position actuelle, destination et dernier trajet, zoom, déplacement par glissement et coordonnées au clic. Géométrie publique relevée le 16/11/2026 dans [data/chasse-minimap.json](data/chasse-minimap.json), source [API DofusDB](https://api.dofusdb.fr/worlds?id=1) ; tuiles DOFUS © Ankama diffusées par DofusDB. Le fond reste externe ; son indisponibilité ne bloque pas la recherche.

Case Étape suivante automatique cochée par défaut et préférence mémorisée : choisir un indice copie /travel, met la position à jour après une copie réussie, puis attend la direction suivante. La dernière commande reste accessible. Case décochée : validation manuelle conservée. Copie refusée : commande et bouton manuel disponibles, sans déplacement automatique de la position. Les réponses et copies devenues obsolètes ne modifient pas la saisie courante. Version V174 dans tous les footers.


## V175 — Cases de la minimap plus lisibles

Bouton Rechercher les indices supprimé : les flèches chargent les indices et permettent de réessayer en cas d’erreur. Grille de minimap contrastée à tous les zooms, rectangles de position actuelle et de destination. Survol : contour de la case et tooltip de coordonnées, sans recharger les tuiles. Le tooltip disparaît à la sortie de la carte et pendant le glissement ; le contour de la position choisie reste visible. Version V175 dans tous les footers.


## V176 — Zoom initial de la minimap

Zoom de départ augmenté de deux crans (0,4 → 0,8). Version V176 dans tous les footers.
