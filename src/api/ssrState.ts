import type { InjectionKey } from 'vue'

/**
 * Prerender only. Each page render gets a Set of the cache keys its components read. After the render, the values of those
 * keys go into the page as initial state, so the client starts with the same data and makes no request (spec 15).
 */
export const SSR_KEYS: InjectionKey<Set<string>> = Symbol('pico-ssr-keys')

export const STATE_ELEMENT_ID = 'pico-state'

/** JSON that is safe inside a <script> element. */
export const safeJson = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')

/** Errors of small resources during prerender. The build reads this in onFinished and fails when it is not empty. */
export const SSR_ERRORS_KEY = '__PICO_SSR_ERRORS__'
