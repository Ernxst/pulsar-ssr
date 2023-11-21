import path from 'node:path';
import fs from 'node:fs';
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from 'bun:test';
import { mkdirp } from 'mkdirp';
import { getLayoutsForPage } from '../utils';

describe('getLayoutsForPage', () => {
	const base = 'tmp/src/routes';
	const routesDir = path.join(process.cwd(), base);

	beforeAll(() => {
		if (!fs.existsSync(routesDir)) {
			fs.mkdirSync(routesDir, { recursive: true });
		}
	});

	afterAll(() => {
		if (fs.existsSync(routesDir)) {
			fs.rmSync(routesDir, { recursive: true, force: true });
		}
	});

	// Flat routes or not really don't matter here
	describe.each([
		{
			layouts: ['/layout.tsx', '/index.layout.tsx', '/users.layout.tsx'],
			page: '/index.page.tsx',
			expected: ['/layout.tsx', '/index.layout.tsx'],
		},
		{
			layouts: ['/layout.tsx', '/users/layout.tsx', '/users.index.layout.tsx'],
			page: '/index.page.tsx',
			expected: ['/layout.tsx', '/users/layout.tsx'],
		},
		{
			layouts: [
				'/layout.tsx',
				'/posts/layout.tsx',
				'posts/create.layout.tsx',
				'/posts/admin.layout.tsx',
			],
			page: '/posts.admin.page.tsx',
			expected: ['/layout.tsx', '/posts/layout.tsx', '/posts/admin.layout.tsx'],
		},
		{
			layouts: ['/layout.tsx', '/nested/layout.tsx', '/nested/page.layout.tsx'],
			page: '/nested/page.page.tsx',
			expected: [
				'/layout.tsx',
				'/nested/layout.tsx',
				'/nested/page.layout.tsx',
			],
		},
		{
			layouts: ['/layout.tsx', '/about.layout.tsx', '/contact.layout.tsx'],
			page: '/about.page.tsx',
			expected: ['/layout.tsx', '/about.layout.tsx'],
		},
		{
			layouts: ['/home.layout.tsx', '/about.layout.tsx', '/contact.layout.tsx'],
			page: '/blog.page.tsx',
			expected: [],
		},
		{
			layouts: ['/layout.tsx', '/dashboard.layout.tsx', '/admin.layout.tsx'],
			page: '/admin.page.tsx',
			expected: ['/layout.tsx', '/admin.layout.tsx'],
		},
		{
			layouts: [],
			page: '/empty.page.tsx',
			expected: [],
		},
	])('', ({ layouts, page, expected }) => {
		const files: string[] = [];

		beforeEach(() => {
			layouts.forEach((file) => {
				const fullPath = path.join(routesDir, file);
				// Create parent directories if they don't exist
				mkdirp.sync(path.dirname(fullPath));

				files.push(fullPath);
				fs.writeFileSync(fullPath, 'foo', { encoding: 'utf-8' });
			});
		});

		afterEach(() => {
			files.forEach((file) =>
				fs.rmSync(file, { force: true, recursive: true })
			);
		});

		describe(`for page ${page}`, () => {
			test(`should return correct layouts`, () => {
				const matchedLayouts = getLayoutsForPage({
					absoluteFilePath: path.join(routesDir, page),
					routesDir,
				});

				const expectedLayouts = expected.map((file) =>
					path.join(routesDir, file)
				);

				expect(matchedLayouts).toEqual(expectedLayouts);
			});
		});
	});
});
