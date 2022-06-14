///////////////////////////////////
//       Suck it WorkBoxJS       //
//                               //
//    This is the best(er)(er)   //
//  service worker on the planet //
///////////////////////////////////

const APP_VERSION = 1.00

// Document Cache is a cache of document files - html, js, css, etc
const DOCUMENT_CACHE_NAME = `DOC`
var DOCUMENT_CACHE = null
// Resource Cache is a cache of almost always static resources - images, fonts, .json files
const RESOURCE_VERSION = 1.00
const RESOURCE_CACHE_NAME = `RESv${RESOURCE_VERSION.toFixed(2)}`
var RESOURCE_CACHE = null

// Custom extensions
String.prototype.endsWithAny = function (...ends) {
    return ends.some(end => this.endsWith(end))
}

// For Debugging
const IS_TESTING = self.registration.scope.includes("127.0.0.1")
const STOP_CACHING = 1 && IS_TESTING // Set to true while testing, false for public builds
const log = (text, color="white") => 1 || IS_TESTING ? console.log(`%c${text}`, `color: black; background-color: ${color};`) : ""

self.addEventListener("install", event => {
    event.waitUntil((async () => {
        let doc_cache = await caches.open(DOCUMENT_CACHE_NAME)
        await self.skipWaiting()
    })())
});

self.addEventListener("activate", event => {
    log("Service Worker activated")
    // Remove obsolete caches
    event.waitUntil((async () => {
        await clients.claim()
        await Promise.allSettled([load_both_caches(), delete_obsolete_caches()])
    })())
});

async function load_both_caches() {
    DOCUMENT_CACHE = await caches.open(DOCUMENT_CACHE_NAME)
    RESOURCE_CACHE = await caches.open(RESOURCE_CACHE_NAME)
}

async function delete_obsolete_caches() {
    let cache_names = await caches.keys()
    await Promise.all(cache_names.map(cache_name => {
        if (![DOCUMENT_CACHE_NAME, RESOURCE_CACHE_NAME].includes(cache_name)) {
            log(`Deleting obsolete cache: '${cache_name}'`, "rgb(255, 128, 128)")
            return caches.delete(cache_name)
        }
    }))
    // Delete expired cached documents
    DOCUMENT_CACHE = await caches.open(DOCUMENT_CACHE_NAME)
    await DOCUMENT_CACHE.keys().then(requests => {
        return Promise.all(requests.map(async request => {
            let cached_document = await DOCUMENT_CACHE.match(request)
            if(isCachedResponseExpired(cached_document)) {
                log(`Deleting expired document: ${request.url}`)
                return await DOCUMENT_CACHE.delete(request)
            }
        }))
    })
}

self.addEventListener("fetch", request_event => {
    request_event.respondWith(STOP_CACHING ? fetch(request_event.request) : get_request(request_event))
});

async function get_request(request_event) {
    const request = request_event.request
    const url = request.url
    
    if(DOCUMENT_CACHE == null || RESOURCE_CACHE == null) {
        await load_both_caches()
    }
    
    // Check if the request is for a document
    if(url.endsWithAny([".html", ".js", ".css", "/"]) && !url.includes("apis.google.com")) {
        return await handle_document_request(request_event)
    }
    // Check if the request is for a resource
    else if(!url.includes("apis.google.com")) {
        return await handle_resource_request(request_event)
    }
    
    // Doesn't belong to either type of cache, so perform a network request

    return await fetch(request)
}

async function handle_document_request(request_event) {
    const request = request_event.request
    const url = request.url

    /**
    * So here's the game plan:
    * Check if a cache version exists.
    * | --- If it doesn't, then return a simple fetch request with no timeout
    * | --- If it does call a fetch request that times out after 'x' seconds, defaulting to the cache version
    * This ensures that the user gets the latest possible version, as fast as possible
    * 
    * PS: In all possible cases, cache the request after network-fetching it
    */
    
    // Check if a cache version exists
    let cache_match = await DOCUMENT_CACHE.match(request, { ignoreVary: true })
    if(cache_match == undefined || cache_match == null) {
        // A cached version DOESN'T exist
        log("A cached version DOESN'T exist, performing a network request", "rgb(128, 128, 255)")
        let network_match = await fetch(request).catch(err => null)
        if(network_match) {
            // Network match completed, cache a clone of the response
            cache_with_headers(request, network_match)
        }
        return network_match
    }
    else {
        // A cached version DOES exist
        log("A cached version DOES exist", "rgb(128, 128, 255)")

        log("Performing network match")
        const SECONDS_TO_TIMEOUT = 5
    
        const abort_controller = new AbortController()
        const abort_signal = abort_controller.signal
        const timeout_id = setTimeout(() => abort_controller.abort(), SECONDS_TO_TIMEOUT*1000)
        
        // Perform a network request
        let network_match = await fetch(request, {signal: abort_signal}).then(data => {
            clearTimeout(timeout_id)
            log("Network match completed before timeout", "rgb(128, 255, 128)")
            return data
        }).catch(err => {
            if(err.name == "AbortError") {
                log("Network request took too long, returning cached version", "rgb(255, 128, 128)")
                return null
            }
            throw err
        }).catch(err => null)
        
        if(network_match == undefined || network_match == null) {
            // The network request failed, send the cached version
            return cache_match
        }

        // The network request succeeded 🥵
        // Cache a cloned version and send the original response
        cache_with_headers(request, network_match)
        return network_match
    }
}

async function handle_resource_request(request_event) {
    const request = request_event.request
    const url = request.url

    // Perform a cache request
    let match = await RESOURCE_CACHE.match(request, { ignoreVary: true })
    if (match != undefined && match != null) return match
    // Since a cached version doesn't exist, perform a network request
    match = await fetch(request)
    RESOURCE_CACHE.put(request, match.clone())
    return match
}

/**
 * Caches a copy of the response object with the "sw-fetched-on" header
 */

async function cache_with_headers(request, response) {
    // Clone the response so we can work with it freely
    response = response.clone()

    const headers = new Headers(response.headers)
    headers.append("sw-fetched-on", new Date().getTime())

    let response_body = await response.blob()
    await DOCUMENT_CACHE.put(request, new Response(response_body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
    }))
}

/**
 * Returns true or false if the response headers says it is older than 15 days or not respectively
 */

function isCachedResponseExpired(response) {
    let fetched_on = response.headers.get("sw-fetched-on")
    if(!fetched_on) return true
    
    const TIMEOUT_IN_MS = 15 * 24 * 3600 * 1000

    if(new Date().getTime() - parseFloat(fetched_on) >= TIMEOUT_IN_MS) return true

    return false
}

self.addEventListener("message", event => {
    const message = event.data

    if(message == "version") {
        event.source.postMessage(APP_VERSION.toFixed(2))
    }
})