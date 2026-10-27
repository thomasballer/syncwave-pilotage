# Revue de cohérence du planning Syncwave

Référence historique : 26 octobre 2026. Révision matérielle : 27 octobre 2026, version 20261027.8.

## Décisions confirmées par l’équipe

Le matériel est un Raspberry Pi Pico et un tag NFC passif. Le tag se lit avec un téléphone ou un lecteur externe compatible, sans connexion électrique au Pico. La LED est déjà branchée au Pico et s’allume. Cet acquis est confirmé le 27 octobre ; la date exacte du premier essai reste inconnue. L’interface affiche donc « Confirmé le » et ne le transforme pas en validation de la batterie, du SOS ou de l’autonomie.

Les deux priorités du 26 octobre au 6 novembre sont conservées : NFC et alimentation batterie. La localisation ne conditionne plus le jalon ciblé du 6 novembre.

## Ordre physique et embarqué retenu

- Acquis : LED branchée et allumée, confirmé le 27/10.
- 28/10 : vérifier le montage USB existant et rendre le programme du Pico reproductible.
- 30/10 : qualifier la batterie et le chemin d’alimentation de la LED ; démontrer la lecture du tag NFC et son exploitation dans le logiciel.
- 06/11 : faire fonctionner le Pico et la LED sur batterie sans USB, consolider le NFC dans l’application et valider ce même prototype sur ce périmètre.
- 10–13/11 : valider l’assemblage Pico/modem sous USB, le bouton et les états LED en local, puis GNSS, LTE-M et mesure batterie.
- 16–19/11 : vérifier la réception des messages dans le cloud puis la reprise après coupure. Les dimensions réelles et le boîtier d’essai peuvent avancer en parallèle après les tests locaux et radio.
- 18–20/11 : montage compact et boîtier d’essai, autonomie réelle d’au moins deux heures dans le scénario POC et lecture du tag après fermeture et en conditions portées.
- 22–23/11 : stabiliser ce premier prototype, puis valider mise à jour et retour arrière avant la diffusion sur le lot.
- 25/11–06/12 : assembler quatre électroniques, adapter les boîtiers aux montages réels et valider les quatre bracelets.
- 07–11/12 : recette et Go, sessions pilote les 8–9, analyse le 10 et transfert final le 11.

Les dates futures sont des cibles proposées. Les prérequis des fiches définissent l’ordre exact de validation ; une préparation peut avancer en parallèle.

## Références et différences entre guides

`Guide_construction_bracelet_festival_v3.docx` décrit les contrôles USB, une liaison temporaire Pico/modem par huit fils, le montage compact, la qualification batterie, le boîtier et le tag passif.

`IoT_Physical_Tutorial_V4.pdf` est intitulé « Tutorial V3 » dans son contenu. Sa version corrigée retient directement l’empilement Pico/Waveshare ; les huit fils temporaires ne deviennent donc pas un objectif obligatoire. Ses pages 10–14 distinguent tests locaux USB, qualification batterie et intégration portable. La qualification du 30/10 ne déclare pas connus la référence de batterie, les courants, le convertisseur ou la gestion des deux sources.

La batterie reste une priorité de la quinzaine selon la décision de l’équipe. Le premier essai sans USB vise le Pico et la LED. Après ajout du modem et des fonctions complètes, un nouvel essai d’autonomie est requis. Une alimentation USB correcte ou une LED allumée ne démontre pas que la LED dispose encore de son alimentation adaptée sans USB.

La fiche NXP NTAG213/215/216 confirme le fonctionnement du tag par couplage sans contact. Aucun paiement sécurisé ni portée de lecture garantie ne sont déduits du tag seul.

## Cohérence des vues et des sauvegardes

Les cinq livrables, les compteurs, les fiches, le Gantt, les dépendances, le calendrier, l’équipe, les sprints et le parcours matériel utilisent les mêmes 57 objectifs. Les clôtures historiques restent accompagnées de preuves et dates ; la nouvelle confirmation de LED est explicitement distinguée.

La migration compare les saisies anciennes à leur référence avant d’appliquer uniquement les vrais changements locaux à la nouvelle référence. Les objectifs ajoutés restent présents. Une saisie incompatible est conservée et téléchargeable ; elle ne remplace pas silencieusement le nouveau planning. L’ancienne référence est un fichier de migration et n’est pas le planning affiché.

Le site reste statique, avec sauvegarde dans le navigateur et export JSON. Aucun backend applicatif, dépôt de fichiers, lien ou connexion à l’ancien outil de suivi. Les fichiers d’interface sont versionnés pour éviter le mélange de versions au chargement, et les liens directs vers les onglets sont pris en charge.

## Organisation et capacité

L’organisation affiche une projection de charge de l’équipe sans saisie de disponibilités. Le plafond confirmé par l’équipe est de quatre heures par personne et par semaine, marge comprise. Sur les treize semaines du 14 septembre au 11 décembre, quatre profils prévoient 41 h 30 de travail et 10 h 30 de marge sur 52 h. La charge prévue de Nazim est réduite d’environ 25 % grâce à une enveloppe de 3 h maximum par semaine : 31 h 15 prévues et 7 h 45 de marge sur 39 h. Les arrondis donnent 79,8 % / 20,2 % pour les quatre profils et 80,1 % / 19,9 % pour Nazim. Gabriel reçoit également une enveloppe allégée de 3 h 30 par semaine : 36 h 30 prévues et 9 h de marge sur 45 h 30, soit environ 80,2 % / 19,8 %. Les bilans et les totaux équipe sont calculés à partir des enveloppes individuelles.

Les profils hebdomadaires varient selon les personnes et les phases, avec des semaines entre 2 h et 2 h 30 prévues pour Nazim, entre 2 h 15 et 3 h pour Gabriel et entre 2 h 30 et 3 h 30 pour les quatre autres. Les semaines plus soutenues sont compensées par des semaines plus légères ; le plafond individuel de trois, trois heures trente ou quatre heures est respecté et au moins trente minutes de marge subsistent chaque semaine. Les semaines passées sont clairement présentées comme reconstituées, sans preuve de temps réellement passé. La projection n’est pas calculée à partir du nombre d’objectifs ni une mesure de la vitesse de chacun.

Le calendrier permet d’examiner quatre semaines ou les treize semaines du projet, et d’ouvrir le sujet et les échéances associés à une cellule. Les bilans par personne, les totaux hebdomadaires et le bilan équipe utilisent les mêmes minutes entières. Le périmètre doit être ajusté si le travail réel dépasse cette enveloppe ; la projection seule ne démontre pas que chaque objectif est réalisable dans ces heures. Aucun système de personne de secours n’est ajouté.

Les sprints couvrent deux semaines calendaires, puis une clôture de cinq jours du 7 au 11 décembre. Les périodes antérieures au 26 octobre regroupent l’historique sans attester de sprints réellement exécutés.

## Contrôles et limites

Les tests couvrent dates, statuts, affectations, preuves, prérequis connus, absence de cycle, ordre des échéances, couverture des sprints, plafond hebdomadaire étudiant, arrondis et bilan global 80/20, navigation, migration des saisies et séquence matérielle. L’audit vérifie aussi les ressources d’interface, les références du parcours matériel et l’absence de composants backend ou de dépôt.

Ces contrôles ne prouvent pas un essai physique. Les références de composants, la compatibilité batterie/charge/alimentation LED, la disponibilité SIM/réseau et la faisabilité du lot doivent être confirmées par les essais de l’équipe. La semaine finale reste courte.

## Rééquilibrage des affectations

Les objectifs P12 (vérification du montage USB) et P2 (fonctionnement du Pico et de la LED sur batterie) passent de Maia/Nazim à Maia/Basile. Nazim conserve notamment le programme du Pico, les essais de connectivité, la reprise réseau et les mises à jour. Les objectifs terminés ne sont pas réattribués. Les échéances, critères et dépendances restent identiques.

Le planning de référence compte ainsi 15 objectifs ouverts pour Nazim et 14 pour Basile, dont respectivement 3 et 4 dans les priorités de la quinzaine. Ces nombres décrivent les engagements ; ils ne constituent pas une mesure d’effort. La migration de l’ancienne référence matérielle applique les deux transferts explicitement, même si une ancienne saisie portait encore ces affectations. Les autres modifications locales compatibles sont reprises. Le plafond horaire de Basile reste de quatre heures, sans hausse automatique de sa projection.

## Participation de Thomas renforcée

Thomas est ajouté aux objectifs L4 (vérification des rôles avec Tiéoulé), L3 (accès au logiciel déployé avec Gabriel) et L6 (scénarios et préparation de recette). Les responsables techniques restent associés. Cette révision portait ses engagements ouverts de 12 à 15 sur le projet, dont 5 sur la quinzaine prioritaire, avant l’ajustement IA ci-dessous. Les heures de sa projection et son plafond de quatre heures par semaine restent identiques ; le nombre de fiches ne constitue pas une estimation d’effort. Les critères, dates et dépendances ne changent pas. La migration de la révision 20261027.6 reprend ces ajouts sans perdre les autres saisies compatibles.

## Pilotage de la partie IA

Maia est la responsable principale des neuf objectifs IA. Thomas l’aide sur cinq objectifs : données, baseline par règles, nettoyage, évaluation et analyse du pilote. Gabriel l’aide sur quatre objectifs : baseline relançable, premier modèle, mode de repli et transfert. Tiéoulé ne figure plus dans les affectations IA ; ses engagements plateforme restent identiques. Chaque fiche IA précise le partage du travail. Les rôles affichés, le livrable IA et les sujets des semaines à venir reflètent cette organisation. Les sujets des semaines passées et les réalisations historiques sont conservés.

Les neuf objectifs gardent leurs dates, statuts, critères, prérequis et preuves. Les enveloppes horaires, pondérations, marges et réductions de Nazim et Gabriel restent identiques. Les aides sont ciblées et ne désignent pas un second travail complet sur chaque objectif. Le cumul avec le matériel doit être priorisé dans l’enveloppe existante, sans hausse automatique des heures. La référence compte désormais 24 engagements ouverts pour Maia, 16 pour Thomas, 18 pour Gabriel et 12 pour Tiéoulé ; ces nombres ne mesurent pas l’effort.

Une référence de migration de la révision 20261027.7 permet de conserver les saisies compatibles et de remplacer les anciennes affectations IA par celles confirmées par l’équipe. Les affectations de la version courante restent modifiables.
