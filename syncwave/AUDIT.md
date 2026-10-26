# Revue de cohérence — référence du 26 octobre 2026

## Corrections apportées

- Les cinq livrables sont utilisés partout : titre, filtres, cartes, calendrier, équipe et dépôt.
- Les comptes d’objectifs et les jalons proviennent du même planning, sans total figé différent selon les vues.
- L’historique de réalisation est conservé sans liens ni dépendance à l’ancien outil de suivi.
- Les échéances encore ouvertes avant le 26 octobre ont été remplacées par des cibles proposées : environnements le 28/10, secrets le 30/10, pipeline le 04/11, schéma de données le 28/10, baseline par règles le 30/10, logiciel du Pi le 28/10.
- Le montage du 30/10 concerne l’alimentation et le NFC. La validation du 06/11 porte sur ce prototype et les fonctions du dashboard, pas sur un lot final déjà fabriqué.
- La remontée du SOS au cloud passe au 16/11, après la validation locale du SOS au 13/11.
- La baseline par règles du 06/11 et le premier modèle entraîné du 16/11 sont des objectifs distincts. L’évaluation suit le 18/11.
- La duplication proposée au 25/11 dépend de la stabilisation du 22/11. Les boîtiers du 27/11 utilisent les montages réels mesurés.
- Le Go du 07/12 précède les sessions pilote des 08–09/12. L’exploitation du pilote contribue à son bilan ; elle ne dépend plus d’un pilote déjà terminé.
- Les résultats et le transfert final dépendent du pilote terminé. L’analyse est proposée au 10/12 et le transfert au 11/12.
- L’état « en cours » des permissions API ne reposait pas sur un travail correspondant exactement à cet objectif. Il est remis à confirmer.
- Les statuts de réalisation, preuves et dates sont cohérents. Une sauvegarde ne peut plus être annoncée comme réussie avant son enregistrement effectif.
- Les compteurs de la vue équipe respectent la personne sélectionnée. Les fractions de clôtures de l’ancien suivi ne sont plus mélangées avec le statut courant du Gantt.
- Les fichiers sont conservés côté serveur. Les affectations et le calendrier utilisent le même état partagé.

## Contrôles techniques

Repères uniques, cinq livrables, affectations valides, critères présents, dates valides, ordre des prérequis, absence de cycles, cohérence des clôtures, ressources d’interface présentes, absence de liens vers l’ancien outil, persistance après redémarrage et protection contre les mises à jour concurrentes.

## Points de projet à confirmer

Les nouvelles cibles sont des propositions de replanification. L’équipe doit confirmer la disponibilité des modules NFC/localisation, la capacité à stabiliser le prototype et l’opportunité du lot de quatre. Le planning n’invente pas d’estimation d’effort ni de performance IA minimale. La marge du 7 au 11 décembre reste courte.

Un contrôle structurel sans erreur ne démontre pas la disponibilité du matériel ni l’achèvement d’un travail. Les clôtures historiques restent des déclarations antérieures. Les nouveaux essais exigent leurs preuves.
