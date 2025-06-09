// Cloudflare Worker CORS Proxy with Domain and Country Restrictions
// Deploy this to your Cloudflare Workers domain

// Configuration
const MY_DOMAIN = "testing-az7.pages.dev" // Your Cloudflare Pages domain
const BLOCKED_REDIRECT_URL = "https://www.youtube.com/watch?v=cdG-Y55v-ng" // YouTube redirect
const TIER_1_COUNTRIES = ["US", "CA", "GB", "FR", "DE", "JP", "AU"] // Countries to block for external domains

// CORS headers to add to all responses
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  "Access-Control-Max-Age": "86400", // 24 hours
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // Handle preflight OPTIONS requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: CORS_HEADERS,
      })
    }

    // Extract the target URL from the path
    // Expected format: https://worker.mydomain.com/https://target.api.com/data
    const targetUrl = url.pathname.slice(1) // Remove leading slash

    if (!targetUrl || !isValidUrl(targetUrl)) {
      return createErrorResponse("Invalid target URL. Format: /https://example.com/api", 400)
    }

    // Get the origin of the request
    const origin = request.headers.get("Origin") || request.headers.get("Referer")
    const isFromMyDomain = origin && isOriginFromMyDomain(origin)

    // If request is NOT from my domain, check country restrictions
    if (!isFromMyDomain) {
      const countryCode = request.cf?.country

      // If visitor is from a tier-1 country, redirect them
      if (countryCode && TIER_1_COUNTRIES.includes(countryCode)) {
        return Response.redirect(BLOCKED_REDIRECT_URL, 302)
      }
    }

    try {
      // Prepare headers for the proxied request
      const proxyHeaders = new Headers(request.headers)

      // Remove problematic headers that might cause CORS issues
      proxyHeaders.delete("Origin")
      proxyHeaders.delete("Referer")
      proxyHeaders.delete("Host")

      // Add User-Agent if not present
      if (!proxyHeaders.has("User-Agent")) {
        proxyHeaders.set("User-Agent", "CORS-Proxy-Worker/1.0")
      }

      // Create the proxied request
      const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: proxyHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : null,
      })

      // Fetch the target URL
      const response = await fetch(proxyRequest)

      // Create response with CORS headers
      const proxyResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers),
          ...CORS_HEADERS,
        },
      })

      return proxyResponse
    } catch (error) {
      console.error("Proxy error:", error)
      return createErrorResponse(`Proxy error: ${error.message}`, 500)
    }
  },
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(string) {
  try {
    const url = new URL(string)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Check if the origin is from my domain
 */
function isOriginFromMyDomain(origin) {
  try {
    const originUrl = new URL(origin)
    const hostname = originUrl.hostname

    // Check if hostname matches exactly or is a subdomain
    return hostname === MY_DOMAIN || hostname.endsWith(`.${MY_DOMAIN}`)
  } catch {
    return false
  }
}

/**
 * Create an error response with CORS headers
 */
function createErrorResponse(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  })
}
