import { describe, expect, it } from 'bun:test';
import { transformPathToUrl } from '../file-to-pathname';

describe('transformPathToUrl', () => {
  describe('index routes', () => { });
  it('index route with no extension', () => {
    expect(transformPathToUrl('/')).toBe('/');
  });

  it('index route with extension', () => {
    expect(transformPathToUrl('/index.tsx')).toBe('/');
  });

  it('index.js', () => {
    expect(transformPathToUrl('/index.js')).toBe('/');
  });

  it('/profile/[game]/index.tsx', () => {
    expect(transformPathToUrl('/profile/[game]/index.tsx')).toBe(
      '/profile/:game'
    );
  });

  describe('nested routes', () => {
    it('nested index route', () => {
      expect(transformPathToUrl('user/profile/index.tsx')).toBe(
        '/user/profile'
      );
    });

    it('nested route with path parameter', () => {
      expect(transformPathToUrl('user/profile/[id].tsx')).toBe(
        '/user/profile/:id'
      );
    });

    it('nested route with spread path parameter', () => {
      expect(transformPathToUrl('user/[...profile]/settings.tsx')).toBe(
        '/user/*/settings'
      );
    });

    it('user [game]', () => {
      expect(transformPathToUrl('user/[game].tsx')).toBe('/user/:game');
    });
  });
});
