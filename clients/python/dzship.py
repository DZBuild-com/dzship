"""dzship — Python client for the free Algerian shipping API at freeship.dzbuild.com.

Single file, standard library only (works on Python 3.8+). Drop it into any
project — Django, Flask, FastAPI, a plain script, an Odoo module.

Docs: https://freeship.dzbuild.com · guides: https://github.com/DZBuild-com/dzship

    from dzship import Dzship

    client = Dzship("yalidine", {"apiId": "…", "apiToken": "…"}, options={"fromWilaya": 16})
    res = client.create_order({
        "recipient": {
            "fullName": "Amine Bouzid", "phone": "0551234567",
            "wilayaCode": 16, "communeName": "Bab Ezzouar",
        },
        "deliveryType": "home", "productList": "Sneakers Air x1", "codAmount": 4500,
    })
    print(res["trackingNumber"])
"""

import json
import urllib.error
import urllib.parse
import urllib.request

GATEWAY = "https://freeship.dzbuild.com"
_USER_AGENT = "dzship-python/1.0"


class DzshipError(Exception):
    """Raised on any non-2xx gateway response (or a network failure).

    Attributes:
        status: HTTP status (0 = network error).
        code: machine code — invalid_input, invalid_phone, courier_error,
            rate_limited, overloaded…
        fields: per-field validation errors (on invalid_input), or None.
        retry_after: seconds to wait before retrying (on rate_limited /
            overloaded), or None.
    """

    def __init__(self, status, code, message, fields=None, retry_after=None):
        super().__init__(message)
        self.status = status
        self.code = code
        self.fields = fields
        self.retry_after = retry_after


def _request(method, url, body=None, timeout=30):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"User-Agent": _USER_AGENT, **({"Content-Type": "application/json"} if data else {})},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return json.loads(res.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read().decode() or "{}")
        except ValueError:
            payload = {}
        error = payload.get("error", {})
        retry_after = e.headers.get("retry-after")
        raise DzshipError(
            e.code,
            error.get("code", "http_%d" % e.code),
            error.get("message", "Request failed with HTTP %d" % e.code),
            error.get("fields"),
            int(retry_after) if retry_after else None,
        ) from None
    except urllib.error.URLError as e:
        raise DzshipError(0, "network_error", "Could not reach the dzship gateway: %s" % e.reason) from None


class Dzship:
    """A client bound to one courier account.

    Args:
        courier: courier key, e.g. "yalidine" — see :func:`couriers`.
        credentials: your own courier account credentials (sent per request,
            never stored by the gateway). Omit for the "sandbox" courier,
            which needs none.
        options: optional adapter tuning — fromWilaya, baseUrl (Ecotrack
            tenant URL), timeoutMs.
    """

    def __init__(self, courier, credentials=None, options=None, gateway=GATEWAY, timeout=30):
        self.courier = courier
        self.credentials = credentials
        self.options = options
        self.gateway = gateway.rstrip("/")
        self.timeout = timeout

    def create_order(self, order):
        """Create a parcel. Returns {"trackingNumber": …, "status": "created"}."""
        return self._post("/v1/orders", {"order": order})

    def track(self, tracking_number):
        """Track a parcel. Returns {"status": …, "events": [...]}."""
        return self._post("/v1/track", {"trackingNumber": tracking_number})

    def rates(self, query):
        """Quote a delivery fee. `query` needs at least toWilaya + deliveryType."""
        return self._post("/v1/rates", {"query": query})

    def _post(self, path, extra):
        # The sandbox courier takes no credentials; every other one names what it needs.
        body = {"courier": self.courier}
        if self.credentials:
            body["credentials"] = self.credentials
        if self.options:
            body["options"] = self.options
        body.update(extra)
        return _request("POST", self.gateway + path, body, self.timeout)


def _quote(value):
    return urllib.parse.quote(str(value), safe="")


def _reference(path, query, gateway):
    """Build the query string the reference endpoints understand, then fetch."""
    qs = ""
    if isinstance(query, bool):
        qs = ""
    elif isinstance(query, int):
        qs = "?%d" % query                       # ?16 — the shorthand the API takes
    elif isinstance(query, str) and query:
        qs = "?q=" + _quote(query)
    elif isinstance(query, dict) and query:
        parts = []
        for key in ("code", "wilaya", "q", "platform"):
            value = query.get(key)
            if value not in (None, ""):
                parts.append("%s=%s" % (key, _quote(str(value))))
        if query.get("all"):
            parts.append("all=1")
        if parts:
            qs = "?" + "&".join(parts)
    return _request("GET", gateway.rstrip("/") + path + qs)


def couriers(query=None, gateway=GATEWAY):
    """Every supported courier with its required credential fields. No credentials needed.

    couriers()                          -> all of them
    couriers({"platform": "ecotrack"})  -> one family
    couriers("rocket")                  -> search name, key and aliases
    """
    return _reference("/v1/couriers", query, gateway)


def wilayas(query=None, gateway=GATEWAY):
    """Wilayas. Cacheable — cache it.

    wilayas()              -> the 58 wilayas couriers deliver to
    wilayas(16)            -> one wilaya
    wilayas("oran")        -> search, French or Arabic
    wilayas({"all": True}) -> all 69 of the 2026 division, each with shipAs
    """
    return _reference("/v1/wilayas", query, gateway)


def communes(query=None, gateway=GATEWAY):
    """Communes, in the spelling courier APIs expect.

    communes()                            -> all 1,541
    communes(16)                          -> one wilaya
    communes({"q": "bab", "wilaya": 16})  -> search inside a wilaya
    """
    return _reference("/v1/communes", query, gateway)
