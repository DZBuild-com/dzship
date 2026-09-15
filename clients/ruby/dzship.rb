# frozen_string_literal: true

require "net/http"
require "json"
require "uri"

# Ruby client for dzship (https://freeship.dzbuild.com), the free Algerian
# shipping API — create and track COD parcels through Yalidine, ZR Express,
# Maystro, NOEST, Zimou, DHD and every Ecotrack courier with one request shape.
#
# Stdlib only. Credentials are sent per request, never persisted.
#
#   client = DzShip.new(
#     courier:     "yalidine",
#     credentials: { apiId: "...", apiToken: "..." },
#     options:     { fromWilaya: 16 }
#   )
#   result = client.create_order(
#     recipient: { fullName: "Amine Bouzid", phone: "0551234567",
#                  wilayaCode: 16, communeName: "Bab Ezzouar" },
#     deliveryType: "home", productList: "Sneakers Air x1", codAmount: 4500
#   )
#   result["trackingNumber"] # => "yal-ABC123"
#
#   client.track("yal-ABC123")
#   client.rates(toWilaya: 31, deliveryType: "home")
#
#   DzShip.couriers          # => supported couriers + required credential fields
#   DzShip.wilayas           # => the 58 shippable wilayas, cache this — it rarely changes
#   DzShip.wilayas(all: true) # => all 69 (April 2026 territorial reorganization);
#                              #    codes 59-69 come back courierSupported: false
#                              #    with a shipAs code — see WILAYA HANDOFF below
#   DzShip.communes(wilaya: 16) # => communes in wilaya 16, for order.recipient.communeName
#   DzShip.stats              # => total requests served, as one number
#
# WILAYA HANDOFF (v1.1, April 2026 division):
# Couriers themselves haven't caught up to the 69-wilaya map yet, so any
# wilaya 59-69 must be sent to a courier under its `shipAs` code, never its
# own code. DzShip.wilaya_ship_code(code) resolves this for you: it returns
# the code unchanged for 1-58, and looks up `shipAs` for 59-69. Use it before
# putting a wilayaCode into an order — see #create_order below.
#
# Failures raise DzShip::Error rather than returning an error shape.
# `error.code` carries the API's machine code ("invalid_phone",
# "VALIDATION_ERROR", "CONFIGURATION_ERROR", "EGRESS_BLOCKED", "NOT_FOUND",
# "COURIER_ERROR", "HTTP_ERROR", "rate_limited", "overloaded",
# "network_error"...); `error.retryable?` is true for rate_limited/overloaded,
# with `.retry_after` read from the Retry-After header when present.
class DzShip
  GATEWAY = "https://freeship.dzbuild.com"
  USER_AGENT = "dzship-ruby/1.1"
  RETRYABLE_CODES = %w[rate_limited overloaded].freeze

  class Error < StandardError
    attr_reader :status, :code, :fields, :retry_after

    def initialize(message, status: 0, code: "network_error", fields: nil, retry_after: nil)
      super(message)
      @status = status
      @code = code
      @fields = fields
      @retry_after = retry_after
    end

    def retryable?
      RETRYABLE_CODES.include?(code)
    end
  end

  class << self
    # GET /v1/couriers — supported couriers + required credential fields. No credentials needed.
    #
    # @param platform [String, nil] filter by platform, e.g. "ecotrack"
    # @param q [String, nil] free-text search, e.g. "rocket"
    def couriers(platform: nil, q: nil, gateway: GATEWAY)
      request(:get, "#{gateway}/v1/couriers", query: {platform: platform, q: q})
    end

    # GET /v1/wilayas — wilaya reference data. No credentials needed.
    #
    # Defaults to the 58 wilayas couriers can currently ship to. Pass
    # `all: true` for all 69 (the April 2026 division) — the 11 new ones
    # (59-69) come back with `courierSupported: false` and a `shipAs` code,
    # since couriers haven't mapped them yet. Feed that through
    # DzShip.wilaya_ship_code before sending a wilayaCode to a courier.
    #
    # @param all [Boolean] return all 69 instead of just the 58 shippable ones
    # @param code [Integer, nil] look up a single wilaya by code
    # @param q [String, nil] free-text search, FR or AR
    def wilayas(all: false, code: nil, q: nil, gateway: GATEWAY)
      query = {q: q}
      query[:all] = 1 if all
      query[:code] = code if code
      request(:get, "#{gateway}/v1/wilayas", query: query)
    end

    # GET /v1/communes — the 1,541 communes, for order.recipient.communeName
    # and rates query.toCommune. No credentials needed.
    #
    # @param wilaya [Integer, nil] restrict to one wilaya's communes
    # @param q [String, nil] free-text search, e.g. "bab"
    def communes(wilaya: nil, q: nil, gateway: GATEWAY)
      request(:get, "#{gateway}/v1/communes", query: {wilaya: wilaya, q: q})
    end

    # GET /stats — total requests served, as one number. No documented JSON
    # shape beyond that, so the raw parsed body is returned as-is.
    def stats(gateway: GATEWAY)
      request(:get, "#{gateway}/stats")
    end

    # Resolves the code a courier actually expects for a wilaya. Wilayas
    # 1-58 ship under their own code unchanged; 59-69 (new in the April 2026
    # division) must go out under their `shipAs` code instead, since courier
    # systems don't recognize the new codes yet. Looks the mapping up via
    # DzShip.wilayas(all: true) — pass a cached copy of that response in
    # `wilayas_all` to avoid a network round-trip on every call.
    #
    # @param wilaya_code [Integer] the wilaya code as entered by your user
    # @param wilayas_all [Array<Hash>, nil] a cached DzShip.wilayas(all: true) response
    # @return [Integer] the code to send in order.recipient.wilayaCode or a rates query
    # @raise [Error] (code: "NOT_FOUND") if wilaya_code doesn't exist at all
    def wilaya_ship_code(wilaya_code, wilayas_all: nil, gateway: GATEWAY)
      return wilaya_code if wilaya_code.to_i <= 58

      all = wilayas_all || wilayas(all: true, gateway: gateway)
      entry = all.find { |w| w["code"] == wilaya_code.to_i }
      raise Error.new("Unknown wilaya code #{wilaya_code}", status: 404, code: "NOT_FOUND") unless entry

      entry["shipAs"] || entry["code"]
    end

    # GET /health — raw liveness body, no documented JSON shape.
    def health(gateway: GATEWAY)
      uri = URI("#{gateway}/health")
      res = fetch(uri, Net::HTTP::Get.new(uri))
      raise error_from(res) if res.code.to_i >= 400

      res.body
    end

    def request(method, url, body: nil, query: nil, timeout: 30)
      uri = URI(url)
      uri.query = URI.encode_www_form(query.compact) if query && !query.compact.empty?

      req = (method == :get) ? Net::HTTP::Get.new(uri) : Net::HTTP::Post.new(uri)
      if body
        req["Content-Type"] = "application/json"
        req.body = JSON.generate(body)
      end

      res = fetch(uri, req, timeout: timeout)
      raise error_from(res) if res.code.to_i >= 400

      res.body.to_s.strip.empty? ? {} : JSON.parse(res.body)
    rescue JSON::ParserError => e
      raise Error.new("dzship returned a non-JSON response: #{e.message}", status: res.code.to_i, code: "invalid_response")
    end

    private

    def fetch(uri, req, timeout: 30)
      req["User-Agent"] = USER_AGENT
      req["Accept"] = "application/json"
      Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", open_timeout: timeout, read_timeout: timeout) do |http|
        http.request(req)
      end
    rescue => e
      # SocketError, Errno::*, Net::OpenTimeout/ReadTimeout, OpenSSL::SSL::SSLError, etc.
      raise Error, "Could not reach the dzship gateway (#{uri}): #{e.class}: #{e.message}"
    end

    def error_from(res)
      status = res.code.to_i
      body = JSON.parse(res.body) rescue nil # rubocop:disable Style/RescueModifier
      err = body.is_a?(Hash) ? body["error"] || {} : {}
      retry_after = begin
        Integer(res["Retry-After"])
      rescue ArgumentError, TypeError
        nil
      end

      Error.new(
        err["message"] || "dzship request failed with HTTP #{status}",
        status: status,
        code: err["code"] || "http_#{status}",
        fields: err["fields"],
        retry_after: retry_after
      )
    end
  end

  # @param courier [String, Symbol] "yalidine", "zrexpress", "maystro", "noest", or "ecotrack"
  # @param credentials [Hash] your own courier account credentials — see DzShip.couriers
  # @param options [Hash] adapter tuning: fromWilaya, baseUrl, timeoutMs — see the docs
  def initialize(courier:, credentials: nil, options: {}, gateway: GATEWAY, timeout: 30)
    @courier = courier.to_s
    @credentials = credentials
    @options = options
    @gateway = gateway.to_s.chomp("/")
    @timeout = timeout
  end

  # POST /v1/orders — create a shipment. Returns e.g. { "trackingNumber" => "yal-ABC123", "status" => "created" }.
  #
  # If recipient.wilayaCode might be 59-69 (the April 2026 division), resolve
  # it through DzShip.wilaya_ship_code first — couriers don't recognize the
  # new codes yet:
  #
  #   order[:recipient][:wilayaCode] = DzShip.wilaya_ship_code(order[:recipient][:wilayaCode])
  #   client.create_order(order)
  def create_order(order)
    post("/v1/orders", order: order)
  end

  # POST /v1/track — status + event history. `events[]["rawStatus"]` is the courier's original wording.
  def track(tracking_number)
    post("/v1/track", trackingNumber: tracking_number)
  end

  # POST /v1/rates — delivery + return fee for a route. Needs at least toWilaya + deliveryType.
  def rates(query)
    post("/v1/rates", query: query)
  end

  private

  def post(path, extra)
    body = {courier: @courier, **extra}
    body[:credentials] = @credentials if @credentials && !@credentials.empty?
    body[:options] = @options unless @options.empty?
    self.class.request(:post, "#{@gateway}#{path}", body: body, timeout: @timeout)
  end
end
