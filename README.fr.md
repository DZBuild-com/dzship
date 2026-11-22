# dzship

**Le SDK de livraison pour l'Algérie : une seule API pour 101 transporteurs.**
Créez un colis, suivez-le, imprimez son bordereau, annulez-le, calculez les
frais et listez les points relais avec le même code pour Yalidine, ZR Express,
Maystro, NOEST, Osen Express et 96 autres.

[![npm](https://img.shields.io/npm/v/dzship)](https://www.npmjs.com/package/dzship) [![transporteurs](https://img.shields.io/badge/transporteurs-101-0a7d33)](data/couriers.json) [![licence](https://img.shields.io/badge/licence-MIT-666)](LICENSE)

**[Documentation](https://freeship.dzbuild.com/docs)** · **[Référence de l'API](docs/endpoints.md)** · **[Serveur MCP](#depuis-un-assistant-ia)** · **[Questions fréquentes](#questions-fréquentes)** · **[English](README.md)**

## Installation

```bash
npm install dzship                                           # Node 18+, types inclus, aucune dépendance
composer require dzbuild/dzship                              # PHP 7.2+, ext-curl seulement
pip install git+https://github.com/DZBuild-com/dzship.git    # Python 3.8+, bibliothèque standard seulement
```

Pour Ruby, un seul fichier à copier : [`clients/ruby/dzship.rb`](clients/ruby/dzship.rb).
Tout autre langage parle à la même [API HTTP](docs/endpoints.md).

Pas d'inscription et pas de clé API. Vous envoyez les identifiants de votre
propre compte transporteur avec chaque appel.

## Envoyer un premier colis

Vous n'avez pas besoin d'un compte transporteur pour commencer. Le transporteur
`sandbox` ne demande aucun identifiant, vérifie votre commande comme le ferait
un vrai transporteur, et ne crée rien.

```ts
import dzship from 'dzship';

const shipping = dzship('sandbox');

const { trackingNumber } = await shipping.createOrder({
  recipient: {
    fullName: 'Amine Bouzid',
    phone: '0551234567',
    wilayaCode: 16,
    communeName: 'Bab Ezzouar',
  },
  deliveryType: 'home',
  productList: 'Sneakers x1',
  codAmount: 4500,
});

const { status, events } = await shipping.track(trackingNumber);
```

Quand votre compte transporteur est prêt, une seule ligne change :

```ts
const shipping = dzship('yalidine', { apiId: '…', apiToken: '…' });
// dzship('zrexpressnew', { apiKey: '…', tenantId: '…' })
// dzship('osenexpress', { token: '…' })
// dzship('dhd', { token: '…' })
```

La commande, le résultat du suivi et les noms de statuts gardent la même forme
pour tous les transporteurs. Passer une boutique d'un transporteur à un autre,
c'est cette seule ligne.

En PHP :

```php
require __DIR__ . '/vendor/autoload.php';

$shipping = new Dzship('yalidine', ['apiId' => '…', 'apiToken' => '…']);

$parcel = $shipping->createOrder([
    'recipient' => [
        'fullName' => 'Amine Bouzid', 'phone' => '0551234567',
        'wilayaCode' => 16, 'communeName' => 'Bab Ezzouar',
    ],
    'deliveryType' => 'home', 'productList' => 'Sneakers x1', 'codAmount' => 4500,
]);

echo $shipping->track($parcel['trackingNumber'])['status'];
```

Le client PHP fonctionne en PHP simple, avec Laravel et avec WooCommerce. Le
[guide d'intégration](docs/integrating.md) donne un exemple pour chacun, ainsi
que pour Python, Ruby, Google Sheets et le HTTP brut.

## Ce que font les clients

| | Node | PHP | Python | HTTP |
|---|---|---|---|---|
| Créer un colis | `createOrder(order)` | `createOrder($order)` | `create_order(order)` | `POST /v1/orders` |
| Le suivre | `track(trackingNumber)` | `track($trackingNumber)` | `track(tracking_number)` | `POST /v1/track` |
| Calculer les frais | `rates(query)` | `rates($query)` | `rates(query)` | `POST /v1/rates` |
| Lister les points relais | `desks(wilayaCode)` | `desks($wilayaCode)` | `desks(wilaya_code)` | `POST /v1/desks` |
| Imprimer le bordereau | `label(trackingNumber)` | `label($trackingNumber)` | `label(tracking_number)` | `POST /v1/label` |
| Annuler un colis | `cancel(trackingNumber)` | `cancel($trackingNumber)` | `cancel(tracking_number)` | `POST /v1/cancel` |
| Lister les transporteurs | `dzship.couriers()` | `Dzship::couriers()` | `dzship.couriers()` | `GET /v1/couriers` |
| Lister les wilayas | `dzship.wilayas()` | `Dzship::wilayas()` | `dzship.wilayas()` | `GET /v1/wilayas` |
| Lister les communes | `dzship.communes(16)` | `Dzship::communes(16)` | `dzship.communes(16)` | `GET /v1/communes` |

En TypeScript, la clé du transporteur se complète dans votre éditeur et les
identifiants sont vérifiés pour ce transporteur : un champ manquant est une
erreur de compilation, pas un colis raté.

## Depuis un assistant IA

dzship est aussi un serveur MCP. Claude Code, Cursor, VS Code et tout autre
client MCP peuvent trouver un transporteur, créer un colis, le suivre, calculer
ses frais et l'annuler, sans connexion :

```bash
claude mcp add --transport http dzship https://freeship.dzbuild.com/mcp
```

```json
{ "mcpServers": { "dzship": { "url": "https://freeship.dzbuild.com/mcp" } } }
```

La première ligne est pour Claude Code, la seconde pour `.cursor/mcp.json`.
Demandez un colis sandbox pour essayer. Pour un vrai transporteur, gardez vos
identifiants dans un en-tête `X-Courier-Credentials` de la connexion : ils ne
passent alors jamais par la conversation. Le
[guide MCP](https://freeship.dzbuild.com/docs/mcp) montre comment. Le serveur
est dans le registre MCP officiel sous le nom `com.dzbuild/dzship`.

## Transporteurs

101 transporteurs : Yalidine et ses réseaux (Yalitec, Guepex, Easy & Speed,
Economiqua, We Can), ZR Express sur ses deux plateformes, Maystro, NOEST,
Zimou, Colivraison, Ecom Delivery, Elogistia, Near Delivery, MDM, Osen Express,
Terminal Delivery et les 82 transporteurs de la plateforme Ecotrack (DHD,
Conexlog, MSM Go, World Express et les autres).

Le [tableau du README anglais](README.md#what-each-courier-supports) dit ce que
chaque transporteur propose : création, suivi, tarifs, points relais, bordereau,
annulation. `GET /v1/couriers` renvoie la liste à jour, avec les identifiants
que chacun demande. Les guides par transporteur sont dans
[`docs/couriers`](docs/couriers).

## Wilayas et communes

Le dépôt contient un jeu de données dans le domaine public (CC0) : les 58
wilayas desservies par les transporteurs et les 1 541 communes, en français et
en arabe, en JSON et en CSV, dans [`data/`](data). Il contient aussi le
découpage 2026 en 69 wilayas, avec le code sous lequel expédier chaque nouvelle
wilaya tant que les transporteurs ne l'acceptent pas.

## Où vont vos identifiants

Ils voyagent dans la requête qui en a besoin, vont à ce transporteur, et ne sont
pas stockés. Celui qui les détient peut créer des colis sur votre compte :
appelez dzship depuis votre serveur, jamais depuis du JavaScript de navigateur.

L'API hébergée est gratuite : 200 commandes par heure et par IP, 60 appels de
suivi par minute. Les limites sont dans la
[référence de l'API](docs/endpoints.md#rate-limits).

## Questions fréquentes

**Comment utiliser l'API Yalidine en Node.js ou en PHP ?**
`dzship('yalidine', { apiId, apiToken })` en Node, `new Dzship('yalidine', [...])`
en PHP. Le [guide Yalidine](docs/couriers/yalidine.md) couvre la wilaya
d'origine et les points relais. Guepex, Yalitec et les autres réseaux Yalidine
utilisent le même appel avec leur propre clé.

**Comment intégrer l'API ZR Express dans mon site e-commerce ?**
Installez `dzship` (npm) ou `dzbuild/dzship` (Composer), puis créez un client
`zrexpress` avec votre `token` et votre `key`, ou `zrexpressnew` avec `apiKey`
et `tenantId` si votre compte est sur la nouvelle plateforme. Voir le
[guide ZR Express](docs/couriers/zr-express.md).

**Est-ce que ça marche avec DHD et les autres transporteurs Ecotrack ?**
Oui. Chacun des 82 a sa propre clé (`dhd`, `conexlog`, `rocketdelivery`, …) et
prend le token du tableau de bord de ce transporteur. Le
[guide Ecotrack](docs/couriers/ecotrack.md) les liste.

**Est-ce que ça marche avec Laravel, WooCommerce ou Django ?**
Oui. Le client PHP fonctionne dans tout projet Composer, et le
[guide d'intégration](docs/integrating.md) donne un exemple pour chacun.

**dzship est-il un SDK ou une API ?**
Les deux. L'API est hébergée et gratuite, et les SDK sont de petits clients
typés pour elle. Vous n'écrivez aucune intégration transporteur vous-même, et
il n'y a rien à héberger.

**Y a-t-il un mode test ?**
Le transporteur `sandbox`. Pas de compte, pas d'identifiants, rien de créé.

## Guides

Les guides sont en anglais, avec les libellés de statuts en français et en
arabe : [intégration](docs/integrating.md), [référence de l'API](docs/endpoints.md),
[choisir un transporteur](docs/choosing-a-courier.md),
[statuts de livraison](docs/statuses.md),
[paiement à la livraison](docs/cash-on-delivery.md),
[wilayas et communes](docs/wilayas-and-communes.md). Les mêmes, avec une
recherche, sont sur [freeship.dzbuild.com/docs](https://freeship.dzbuild.com/docs).

## Une boutique complète ?

dzship, c'est la couche livraison. Pour une boutique complète,
[DZBuild](https://dzbuild.com) fait le reste : vitrines en arabe et en français,
landing pages, gestion des commandes avec confirmation, transporteurs déjà
connectés, stock et statistiques, sans code.
