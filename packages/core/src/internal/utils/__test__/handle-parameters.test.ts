import { describe, expect, it } from 'bun:test';
import { handleParameters } from '../file-to-pathname';

describe('handleParameters', () => {
	it('[spark]', () => {
		expect(handleParameters('[spark]')).toBe(':spark');
	});

	it('index', () => {
		expect(handleParameters('index')).toBe('index');
	});

	it('user/:id', () => {
		expect(handleParameters('/user/[id].ts')).toBe('/user/:id');
	});

	it('user Profile', () => {
		expect(handleParameters('/user/[...id]/profile')).toBe('/user/*/profile');
	});

	it('profile/settings.ts', () => {
		expect(handleParameters('/profile/settings')).toBe('/profile/settings');
	});

	it('profile/:id/spark', () => {
		expect(handleParameters('/profile/[id]/spark.ts')).toBe(
			'/profile/:id/spark'
		);
	});

	it('profile/:id-:spark', () => {
		expect(handleParameters('/profile/[id]-[spark].ts')).toBe(
			'/profile/:id-:spark'
		);
	});

	it('profile/:id-:spark/:nice', () => {
		expect(handleParameters('/profile/[id]-[spark]/[nice].ts')).toBe(
			'/profile/:id-:spark/:nice'
		);
	});
});
