import { describe, it, expect } from 'vitest'
import { stripBase, withBase, matchRoute, resolveRoute } from './route-match'

describe('stripBase', () => {
  it('removes the deploy base', () => {
    expect(stripBase('/doserx/obat/paracetamol', '/doserx/')).toBe('/obat/paracetamol')
    expect(stripBase('/doserx/', '/doserx/')).toBe('/')
    expect(stripBase('/doserx', '/doserx/')).toBe('/')
  })

  it('is a no-op at the root base used by the dev server', () => {
    expect(stripBase('/obat', '/')).toBe('/obat')
    expect(stripBase('/', '/')).toBe('/')
  })

  it('does not strip a path that merely starts with the same letters', () => {
    expect(stripBase('/doserx-other/obat', '/doserx/')).toBe('/doserx-other/obat')
  })

  it('normalises trailing slashes', () => {
    expect(stripBase('/doserx/obat/', '/doserx/')).toBe('/obat')
  })
})

describe('withBase', () => {
  it('round-trips with stripBase', () => {
    const base = '/doserx/'
    for (const p of ['/', '/obat', '/obat/paracetamol', '/hitung/preset']) {
      expect(stripBase(withBase(p, base), base)).toBe(p)
    }
  })
})

describe('matchRoute', () => {
  it('matches a static path exactly', () => {
    expect(matchRoute('/obat', '/obat')).toEqual({})
    expect(matchRoute('/obat', '/obat/paracetamol')).toBeNull()
    expect(matchRoute('/obat', '/hitung')).toBeNull()
  })

  it('captures named params', () => {
    expect(matchRoute('/obat/:id', '/obat/paracetamol')).toEqual({ id: 'paracetamol' })
    expect(matchRoute('/hitung/:mode', '/hitung/puyer')).toEqual({ mode: 'puyer' })
  })

  it('decodes encoded params', () => {
    expect(matchRoute('/obat/:id', '/obat/asam%20folat')).toEqual({ id: 'asam folat' })
  })

  it('does not match a param against a missing segment', () => {
    expect(matchRoute('/obat/:id', '/obat')).toBeNull()
  })

  it('supports a trailing wildcard', () => {
    expect(matchRoute('/hitung/*', '/hitung/preset')).toEqual({})
    expect(matchRoute('/hitung/*', '/hitung')).toEqual({})
  })

  it('distinguishes no-params from no-match', () => {
    expect(matchRoute('/', '/')).toEqual({})   // truthy-checked as a match
    expect(matchRoute('/', '/obat')).toBeNull()
  })
})

describe('resolveRoute', () => {
  const routes = [
    { path: '/', id: 'home' },
    { path: '/obat', id: 'catalog' },
    { path: '/obat/:id', id: 'drug' },
    { path: '*', id: 'notfound' },
  ]

  it('returns the first matching route', () => {
    expect(resolveRoute(routes, '/obat')?.route.id).toBe('catalog')
    expect(resolveRoute(routes, '/obat/amoksisilin')?.route.id).toBe('drug')
    expect(resolveRoute(routes, '/obat/amoksisilin')?.params).toEqual({ id: 'amoksisilin' })
  })

  it('falls through to the catch-all', () => {
    expect(resolveRoute(routes, '/tidak-ada')?.route.id).toBe('notfound')
  })
})
