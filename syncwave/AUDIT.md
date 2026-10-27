# Revue de cohérence — référence du 26 octobre 2026

## Version actuelle du site

Le site est entièrement statique. Le backend, les routes API, le dépôt de livrables et les composants de téléchargement de fichiers ont été retirés. Les anciens fichiers de stockage ont été conservés à part du projet livré, sans être inclus dans l’archive des sources.

Les dates, statuts et affectations restent modifiables. Les modifications sont sauvegardées dans le navigateur uniquement, et l’interface le précise. L’export JSON conserve une copie du suivi. Aucun enregistrement partagé entre personnes n’est annoncé.

## Corrections du planning conservées

- Cinq livrables utilisés dans les cartes, les filtres, l’équipe, le calendrier et le Gantt.
- Compteurs et jalons calculés depuis le même planning.
- Historique de réalisation conservé sans connexion à l’ancien outil de suivi.
- Anciennes échéances ouvertes remplacées par des cibles proposées : environnements le 28/10, secrets le 30/10, pipeline le 04/11, schéma de données le 28/10, baseline par règles le 30/10, logiciel du Pi le 28/10.
- Montage d’essai du 30/10 limité à l’alimentation et au NFC. Validation ciblée du même prototype le 06/11.
- Remontée du SOS au cloud proposée au 16/11, après sa validation locale du 13/11.
- Baseline par règles du 06/11 distincte du premier modèle entraîné proposé au 16/11, puis évalué le 18/11.
- Duplication proposée au 25/11 après stabilisation du 22/11. Boîtiers adaptés aux montages réels le 27/11.
- Recette et Go le 07/12, sessions pilote les 08–09/12, analyse le 10/12 et transfert le 11/12.
- Objectifs terminés accompagnés d’une preuve et d’une date, avec prérequis terminés.
- Compteurs de la vue équipe cohérents avec la personne sélectionnée.
- Gantt avec synthèse des cinq livrables, dates lisibles, détail au clic, mode agrandi et comparaison prévu/réalisé facultative.

## Organisation et dépendances

La règle retenue est 80 % de capacité planifiable et 20 % de marge. La disponibilité est renseignée séparément pour chaque personne et chaque sprint. Une valeur absente reste inconnue ; les totaux sont marqués partiels tant que les six disponibilités ne sont pas connues. Zéro heure reste une valeur valide. Aucune estimation en heures par objectif ni répartition égale n’est déduite du nombre d’objectifs.

Les sprints couvrent deux semaines calendaires pour conserver les échéances existantes du dimanche. Le 7–11 décembre est une clôture de cinq jours. Les périodes antérieures au 26 octobre sont seulement des regroupements historiques, et ne sont pas présentées comme des sprints attestés. Le cadre organisationnel reste à confirmer avec l’équipe.

La vue Dépendances utilise le graphe réel des 50 objectifs, sans agréger les cinq livrables en un faux graphe linéaire. Elle montre les prérequis directs, les successeurs et les ancêtres uniques dans un ordre de validation valide. Les statuts sont ceux du planning : un prérequis non terminé ne modifie pas le statut en « Bloqué ». Les préparations peuvent avancer en parallèle. Aucun système de personne de secours n’est ajouté.

## Contrôles

Repères uniques, affectations valides, critères présents, dates valides, ordre des prérequis, absence de cycles, cohérence des clôtures et ressources d’interface présentes. Vérification de l’absence de backend applicatif, d’appels API et d’interface de dépôt. Tests du budget 80/20, des capacités inconnues ou nulles, de la couverture continue des périodes et des chaînes de dépendances pour chaque objectif, sans doublons ni inversion de prérequis.

## Points de projet à confirmer

Les nouvelles cibles sont des propositions. L’équipe doit confirmer la disponibilité des modules NFC/localisation, sa capacité à stabiliser le prototype et l’opportunité du lot de quatre. Le planning ne contient pas d’estimation de charge ni de performance IA minimale inventée. La marge du 7 au 11 décembre reste courte.

Les clôtures historiques restent des déclarations antérieures. Un contrôle structurel sans erreur ne démontre pas la disponibilité du matériel ni l’achèvement d’un nouvel essai.

## Correction du chargement et des liens directs

La navigation prend en charge les changements de fragment (`#organization`, `#dependencies`) après le chargement initial. Une demande de changement de vue avant la disponibilité des données ne masque plus la vue initiale. Les deux nouveaux contenus sont préparés dès que les données sont prêtes. Les scripts, feuilles de style et modules utilisent un numéro de version pour éviter le mélange de fichiers de versions différentes dans le cache. Trois tests supplémentaires vérifient ces cas et le rendu effectif des cartes avec le planning de référence.
