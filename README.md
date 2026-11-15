# La Foire du Tool — V141

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
