# Syncwave — site statique de pilotage du projet IoT

Cette version contient uniquement l’interface HTML, CSS, JavaScript et les données du planning. Elle ne comporte ni backend applicatif, ni API, ni dépôt de fichiers. Aucun dépôt GitHub ni déploiement n’a été effectué dans cette livraison.

## Ouvrir l’aperçu local

Depuis ce dossier, avec Python installé :

```sh
python3 -m http.server 8770 --bind 127.0.0.1 --directory public
```

Ouvrir `http://127.0.0.1:8770`. Cette commande sert uniquement les fichiers statiques de l’interface. Il n’y a aucune route d’enregistrement côté serveur.

## Fonctionnalités

- Cinq livrables et des objectifs avec dates, personnes assignées et critères de validation.
- Gantt synthétique par livrable, objectifs détaillés au clic et mode agrandi. Le lien `/#gantt` ouvre directement cette vue.
- Calendrier mensuel ou sur deux semaines et vue « Qui fait quoi ».
- Historique de réalisation repris le 26 octobre 2026, sans lien ni connexion à l’ancien outil de suivi.
- Modifications enregistrées uniquement dans le navigateur avec `localStorage`. Elles ne sont pas synchronisées entre personnes, appareils ou navigateurs.
- Export du suivi au format JSON pour conserver ou transmettre une copie.
- Contrôles de dates, de prérequis et de clôture appliqués dans le navigateur.

Effacer les données du navigateur efface ses modifications locales. Le planning de référence reste dans `public/objectifs.json`.

## Mise sur GitHub et hébergement

Le dossier `public/` contient tous les fichiers à servir par un hébergement statique. Il peut être utilisé par le collègue chargé de l’hébergement, sans serveur Node.js ni stockage de fichiers déposés à configurer. Les modifications locales du navigateur ne changent pas automatiquement les fichiers du dépôt GitHub.

## Contrôles facultatifs pour le développeur

Node.js 20 ou plus récent suffit, sans dépendance à installer :

```sh
npm test
npm run audit
```

Les fichiers `AUDIT.md`, `audit-changes.json` et `audit-results.json` documentent les corrections du planning et les contrôles effectués. Node.js sert uniquement à ces contrôles, pas au fonctionnement du site hébergé.
