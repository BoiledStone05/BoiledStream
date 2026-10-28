# Sources avec compte et sources premium

BoiledStream peut proposer plusieurs hébergeurs pour une même langue, pour un
film comme pour un épisode. Les sources publiques gardent leur lecteur habituel.
Les sources `account` ou `premium` s'ouvrent dans un nouvel onglet chez l'hébergeur,
même si un `embedUrl` est renseigné. Chaque spectateur y utilise son propre compte.

## Ajouter des sources

Dans un film de `scripts/videos.js`, ou dans les sources d'un épisode :

```js
sources: {
  FR: [
    {
      sourceId: "lecteur-standard",
      sourceName: "Hébergeur standard",
      sourceUrl: "https://example.com/film",
      embedUrl: "https://example.com/embed/film"
    },
    {
      sourceId: "lecteur-premium",
      sourceName: "Hébergeur premium",
      access: "premium",
      sourceUrl: "https://premium.example.com/film",
      loginUrl: "https://premium.example.com/login"
    }
  ],
  EN: {
    sourceName: "Hébergeur anglais",
    sourceUrl: "https://example.com/en/film",
    embedUrl: "https://example.com/embed/en/film"
  }
}
```

- `sourceId` : identifiant stable et unique dans une langue. Le lien partagé peut
  contenir `?lang=FR&source=lecteur-premium`. Sans identifiant, un identifiant
  `source-1`, `source-2`, etc. est créé selon l'ordre des sources de cette langue.
- `access: "account"` : compte requis, sans présumer qu'un abonnement payant existe.
- `access: "premium"` : droits premium requis chez l'hébergeur.
- `loginUrl` : page de connexion facultative. Utiliser uniquement une page publique.

Les anciens objets `sources: { FR: {...}, EN: {...} }` restent compatibles, ainsi
que les tableaux `sources: [{ language: "FR", ... }]`. Un changement de langue,
de saison ou d'épisode réinitialise le choix d'hébergeur. Une source absente ne
réutilise pas le lecteur d'une autre langue.

Pour une fiche proposant uniquement un accès membre, utiliser `provider:
"externalPage"`, `sourceUrl` et `access: "account"` au niveau du film.

Nobody (2021) propose deux sources françaises : l'accès premium par la
[fiche French Stream](https://fs27.lol/15107747-nobody.html), et un lecteur Vidzy
de secours intégré. La lecture premium a été confirmée le 28 octobre 2026 dans
une session autorisée, connectée par QR code. L'URL du lecteur FSvid contient
une signature ; le même lecteur sans signature répond `403 Forbidden`, y
compris dans le navigateur connecté. Le catalogue conserve donc la fiche
publique et laisse chaque spectateur y sélectionner « Premium » avec son compte.
Le lecteur Vidzy a aussi été vérifié sans signature de compte dans l'URL.

## Pourquoi le lien blob ne convient pas

Une URL `blob:` désigne une ressource en mémoire créée par une page du navigateur.
Elle dépend de son contexte d'origine et de sa durée de vie. Copier cette URL
dans le catalogue ne fournit pas un flux permanent aux autres spectateurs.
BoiledStream refuse ces URL et conserve la fiche source. Voir [MDN : URL blob](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/blob).

GitHub Pages héberge des fichiers statiques : les mots de passe, cookies privés
et jetons de session placés dans les fichiers seraient accessibles aux visiteurs.
Le site ne contient donc aucun formulaire de connexion à un hébergeur tiers et
ne partage aucune session. L'accès se fait chez l'hébergeur ; une lecture intégrée
avec compte nécessiterait une méthode officiellement prise en charge par celui-ci,
à valider avant de l'ajouter. Références : [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
et [politique de même origine](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy).

## Vérification locale

```sh
node --test
node scripts/generate-watch-pages.js
python -m http.server 8000 --bind 127.0.0.1
```

Ouvrir `http://127.0.0.1:8000/watch/nobody-2021.html` pour vérifier l'accès membre.
Tester aussi un film multilingue et un épisode existant. Ne jamais ajouter des
identifiants, des cookies ou une URL signée privée au catalogue public.
