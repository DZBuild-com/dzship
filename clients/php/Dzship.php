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
     * @param array  $credentials your own courier account credentials (sent per request, never stored)
     * @param array  $options     optional adapter tuning: fromWilaya, baseUrl (Ecotrack tenant), timeoutMs
     */
    public function __construct($courier, array $credentials, array $options = [], $gateway = self::GATEWAY, $timeout = 30)
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

    /** All supported couriers with their required credential fields. No credentials needed. */
    public static function couriers($gateway = self::GATEWAY)
    {
        return self::request('GET', rtrim($gateway, '/') . '/v1/couriers', null, 30);
    }

    /** The 58 wilayas (code + FR/AR names). Cache it — it never changes. */
    public static function wilayas($gateway = self::GATEWAY)
    {
        return self::request('GET', rtrim($gateway, '/') . '/v1/wilayas', null, 30);
    }

    private function post($path, array $extra)
    {
        $body = array_merge([
            'courier' => $this->courier,
            'credentials' => $this->credentials,
        ], $this->options ? ['options' => $this->options] : [], $extra);

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
