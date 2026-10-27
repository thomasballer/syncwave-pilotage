# Syncwave — site statique de pilotage du projet IoT

Cette version contient uniquement l’interface HTML, CSS, JavaScript et les données du planning. Elle ne comporte ni backend applicatif, ni API, ni dépôt de fichiers. Le code est versionné dans le dépôt GitHub du projet ; le déploiement est confié au collègue chargé de l’hébergement.

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
- Organisation sans saisie de disponibilités : calendrier des heures prévues pour chaque personne, sur un plafond étudiant de 4 h par semaine, abaissé à 3 h pour Nazim et à 3 h 30 pour Gabriel, marge comprise. Des semaines différentes et un bilan global proche de 80/20 sur les treize semaines du projet.
- Dépendances hors du Gantt : prérequis directs, résultat visé, résultats suivants et chaîne complète en amont. Les cartes ouvrent les mêmes fiches éditables.
- Parcours de construction physique et embarquée réordonné à partir des deux guides : NFC et batterie jusqu’au 6 novembre, puis fonctions locales/radio, cloud, boîtier d’essai, autonomie et stabilisation avant duplication.
- LED branchée et allumée enregistrée comme acquis confirmé le 27 octobre ; la date exacte du premier essai n’est pas inventée.
- Historique de réalisation repris le 26 octobre 2026, sans lien ni connexion à l’ancien outil de suivi.
- Modifications enregistrées uniquement dans le navigateur avec `localStorage`. Elles ne sont pas synchronisées entre personnes, appareils ou navigateurs.
- Export du suivi au format JSON, avec objectifs, cadence, heures prévues et marge par personne et par semaine, pour conserver ou transmettre une copie.
- Contrôles de dates, de prérequis et de clôture appliqués dans le navigateur.

Les périodes de sprint sont un cadre proposé : deux semaines calendaires, puis une clôture du 7 au 11 décembre. Les périodes passées regroupent seulement les réalisations historiques. Les objectifs sont affichés dans leur période d’échéance, ou de réalisation pour les objectifs terminés. Les heures sont une projection indicative et ne constituent pas un relevé du temps réel. Les semaines passées sont reconstituées. La répartition, arrondie au quart d’heure, prévoit 41 h 30 de travail et 10 h 30 de marge sur 52 h pour quatre personnes. Nazim a une enveloppe allégée de 39 h : 31 h 15 prévues et 7 h 45 de marge, soit environ 80,1 % / 19,9 %. Ses semaines vont de 2 h à 2 h 30 prévues, dans un plafond de 3 h. Gabriel a une enveloppe de 45 h 30 : 36 h 30 prévues et 9 h de marge, avec des semaines entre 2 h 15 et 3 h dans un plafond de 3 h 30. Les quatre autres profils restent entre 2 h 30 et 3 h 30 prévues dans un plafond de 4 h. La marge reste d’au moins 30 minutes chaque semaine. Le total équipe est de 233 h 45 prévues et 58 h 45 de marge sur 292 h 30. Les profils hebdomadaires sont différents selon les personnes. Le volume des objectifs n’est pas automatiquement déduit de ces heures. Il n’y a pas d’attribution de personne de secours.

Le fichier `public/organization-plan.json` contient la base de cette projection : plafond, cible et profils hebdomadaires. L’ancienne saisie de disponibilités dans le navigateur n’est plus utilisée. Si le travail prévu exige plus d’heures, l’équipe ajuste le périmètre plutôt que d’augmenter le plafond étudiant.

Le chargement reprend les modifications réellement faites sur l’ancienne version sans rétablir ses dates ou ses dépendances remplacées. Une copie locale de la saisie antérieure est conservée lors de cette migration. Si une saisie contredit les nouveaux prérequis, le nouveau planning est affiché et un bouton permet de télécharger l’ancienne saisie. `public/baseline-20261026.json` et `public/baseline-20261027.json` sont uniquement des références de migration ; le planning courant est `public/objectifs.json`. La révision des affectations transfère les contrôles USB et l’essai batterie de Nazim vers Basile, en conservant Maia sur ces deux objectifs. Les anciennes sauvegardes reprennent ces transferts tout en conservant leurs autres modifications compatibles.

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
