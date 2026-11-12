# La Foire du Tool — V90

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
