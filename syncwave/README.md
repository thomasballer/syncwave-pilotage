# Syncwave — pilotage du projet IoT

Version locale préparée pour une future mise sur GitHub. Aucun dépôt GitHub ni déploiement n’a été effectué dans cette livraison.

## Démarrer

Prérequis : Node.js 20 ou plus récent. Aucune dépendance à installer.

```sh
npm start
```

Ouvrir `http://127.0.0.1:8770`. Le serveur écoute uniquement sur la machine locale par défaut.

```sh
npm test
npm run audit
```

## Fonctionnement

- Cinq livrables, objectifs avec prérequis, calendrier et vue par personne.
- Gantt avec synthèse des livrables, détail au clic, dates lisibles, grand format et comparaison prévu/réalisé facultative. Le lien `/#gantt` ouvre directement cette vue.
- Historique de réalisation repris le 26 octobre 2026, sans lien ni connexion à l’ancien outil de suivi.
- Modifications du planning enregistrées sur le serveur. Un conflit entre deux fenêtres est refusé au lieu d’écraser une mise à jour.
- Dépôt de fichiers jusqu’à 50 Mo avec titre, version, auteur, livrable et objectif facultatif. Les fichiers sont conservés sur disque et téléchargés en pièces jointes.
- Un fichier déposé ne termine jamais automatiquement un objectif. Il peut servir de preuve après vérification.
- Une clôture exige une preuve, une date de réalisation et des prérequis terminés.

Le mode statique seul permet la consultation. Il ne simule ni enregistrement partagé ni dépôt de fichiers.

## Structure

`public/` contient l’interface, les ressources et le planning initial. `server.mjs` fournit le stockage et les téléchargements. `storage/` est créé au premier démarrage et contient `state.json`, `files.json` et les fichiers déposés. Il est exclu de Git.

`SYNCWAVE_DATA_DIR` permet de choisir un répertoire de données persistant. `PORT` change le port. `HOST` permet au responsable du déploiement de choisir l’interface d’écoute.

## Transmission au collègue chargé de l’hébergement

Le dépôt doit contenir les sources, pas `storage/`, les fichiers déposés ni les éventuels secrets. Sauvegarder le répertoire de données séparément. Le bouton Exporter le suivi exporte le planning et la liste des fichiers, pas leurs contenus binaires.

Ce serveur local ne fournit pas de comptes utilisateurs : le champ « Déposé par » est déclaratif. Avant une exposition à l’équipe sur Internet, le responsable de l’hébergement doit mettre en place le contrôle d’accès, HTTPS et un volume persistant avec sauvegarde. Un hébergement purement statique, tel que GitHub Pages, ne suffit pas pour les dépôts et le suivi partagé.

## Cohérence du planning

`audit-results.json` présente les contrôles exécutés. `audit-changes.json` contient les ajustements de dates et de dépendances. `AUDIT.md` explique les décisions et les points de projet restant à confirmer.

Les prérequis doivent être terminés avant la validation du résultat. Les travaux préparatoires peuvent se dérouler en parallèle. Les barres du Gantt représentent ces périodes de préparation, pas une estimation de charge.
