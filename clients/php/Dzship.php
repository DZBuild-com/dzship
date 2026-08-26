<?php
/**
 * dzship — PHP client for the free Algerian shipping API at freeship.dzbuild.com.
 *
 * Single file, no dependencies beyond ext-curl. Drop it into any project
 * (plain PHP, Laravel, Symfony, WordPress/WooCommerce) and require it.
 *
 * Docs: https://freeship.dzbuild.com · guides: https://github.com/DZBuild-com/dzship
 *
 *   require 'Dzship.php';
 *   $client = new Dzship('yalidine', ['apiId' => '…', 'apiToken' => '…'], ['fromWilaya' => 16]);
 *   $res = $client->createOrder([
 *       'recipient' => [
 *           'fullName' => 'Amine Bouzid', 'phone' => '0551234567',
 *           'wilayaCode' => 16, 'communeName' => 'Bab Ezzouar',
 *       ],
 *       'deliveryType' => 'home', 'productList' => 'Sneakers Air x1', 'codAmount' => 4500,
 *   ]);
 *   echo $res['trackingNumber'];
 */

class DzshipException extends \RuntimeException
{
    /** @var int HTTP status (0 = network error) */
    public $status;
    /** @var string machine code: invalid_input, invalid_phone, courier_error, rate_limited, overloaded… */
    public $errorCode;
    /** @var array|null per-field validation errors (on invalid_input) */
    public $fields;
    /** @var int|null seconds to wait before retrying (on rate_limited / overloaded) */
    public $retryAfter;

    public function __construct($status, $errorCode, $message, $fields = null, $retryAfter = null)
    {
        parent::__construct($message);
        $this->status = $status;
        $this->errorCode = $errorCode;
        $this->fields = $fields;
        $this->retryAfter = $retryAfter;
    }
}

class Dzship
{
    const GATEWAY = 'https://freeship.dzbuild.com';

    private $courier;
    private $credentials;
    private $options;
    private $gateway;
    private $timeout;

    /**
     * @param string $courier     courier key, e.g. 'yalidine' — see Dzship::couriers()
     * @param array  $credentials your own courier account credentials (sent per request, never
     *                            stored). Empty for the 'sandbox' courier, which needs none.
     * @param array  $options     optional adapter tuning: fromWilaya, baseUrl (Ecotrack tenant), timeoutMs
     */
    public function __construct($courier, array $credentials = [], array $options = [], $gateway = self::GATEWAY, $timeout = 30)
    {
        $this->courier = $courier;
        $this->credentials = $credentials;
        $this->options = $options;
        $this->gateway = rtrim($gateway, '/');
        $this->timeout = $timeout;
    }

    /** Create a parcel. Returns ['trackingNumber' => …, 'status' => 'created']. */
    public function createOrder(array $order)
    {
        return $this->post('/v1/orders', ['order' => $order]);
    }

    /** Track a parcel. Returns ['status' => …, 'events' => [...]]. */
    public function track($trackingNumber)
    {
        return $this->post('/v1/track', ['trackingNumber' => $trackingNumber]);
    }

    /** Quote a delivery fee. $query needs at least toWilaya + deliveryType. */
    public function rates(array $query)
    {
        return $this->post('/v1/rates', ['query' => $query]);
    }

    /**
     * Every supported courier with its required credential fields. No credentials needed.
     *
     *   Dzship::couriers();                          // all of them
     *   Dzship::couriers(['platform' => 'ecotrack']);
     *   Dzship::couriers(['q' => 'rocket']);         // search name, key and aliases
     *
     * @param array|string|null $query
     */
    public static function couriers($query = null, $gateway = self::GATEWAY)
    {
        return self::reference('/v1/couriers', $query, $gateway);
    }

    /**
     * Wilayas. Cacheable — cache it.
     *
     *   Dzship::wilayas();                  // the 58 wilayas couriers deliver to
     *   Dzship::wilayas(16);                // one wilaya
     *   Dzship::wilayas('oran');            // search, French or Arabic
     *   Dzship::wilayas(['all' => true]);   // all 69 of the 2026 division, with shipAs
     *
     * @param array|int|string|null $query
     */
    public static function wilayas($query = null, $gateway = self::GATEWAY)
    {
        return self::reference('/v1/wilayas', $query, $gateway);
    }

    /**
     * Communes, in the spelling courier APIs expect.
     *
     *   Dzship::communes();                              // all 1,541
     *   Dzship::communes(16);                            // one wilaya
     *   Dzship::communes(['q' => 'bab', 'wilaya' => 16]);
     *
     * @param array|int|string|null $query
     */
    public static function communes($query = null, $gateway = self::GATEWAY)
    {
        return self::reference('/v1/communes', $query, $gateway);
    }

    /** Build the query string the reference endpoints understand, then fetch. */
    private static function reference($path, $query, $gateway)
    {
        $qs = '';
        if (is_int($query)) {
            $qs = '?' . $query;                      // ?16 — the shorthand the API takes
        } elseif (is_string($query) && $query !== '') {
            $qs = '?q=' . rawurlencode($query);
        } elseif (is_array($query) && $query) {
            $parts = array();
            foreach (array('code', 'wilaya', 'q', 'platform') as $k) {
                if (isset($query[$k]) && $query[$k] !== '') {
                    $parts[] = $k . '=' . rawurlencode($query[$k]);
                }
            }
            if (!empty($query['all'])) {
                $parts[] = 'all=1';
            }
            if ($parts) {
                $qs = '?' . implode('&', $parts);
            }
        }

        return self::request('GET', rtrim($gateway, '/') . $path . $qs, null, 30);
    }

    private function post($path, array $extra)
    {
        // An empty PHP array encodes as [] rather than {}, and the sandbox courier needs
        // no credentials at all — so the key is left out entirely when there are none.
        $body = array_merge(
            ['courier' => $this->courier],
            $this->credentials ? ['credentials' => (object) $this->credentials] : [],
            $this->options ? ['options' => (object) $this->options] : [],
            $extra
        );

        return self::request('POST', $this->gateway . $path, $body, $this->timeout);
    }

    private static function request($method, $url, $body, $timeout)
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_USERAGENT => 'dzship-php/1.0',
            CURLOPT_HEADER => true,
        ]);
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }
        $raw = curl_exec($ch);
        if ($raw === false) {
            $err = curl_error($ch);
            curl_close($ch);
            throw new DzshipException(0, 'network_error', 'Could not reach the dzship gateway: ' . $err);
        }
        $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);

        $headers = substr($raw, 0, $headerSize);
        $data = json_decode(substr($raw, $headerSize), true);

        if ($status >= 400 || $status === 0) {
            $error = isset($data['error']) ? $data['error'] : [];
            $retryAfter = preg_match('/^retry-after:\s*(\d+)/mi', $headers, $m) ? (int) $m[1] : null;
            throw new DzshipException(
                $status,
                isset($error['code']) ? $error['code'] : 'http_' . $status,
                isset($error['message']) ? $error['message'] : 'Request failed with HTTP ' . $status,
                isset($error['fields']) ? $error['fields'] : null,
                $retryAfter
            );
        }

        return $data;
    }
}
