import { describe, expect, test } from 'bun:test';
import { transformPathToUrl } from '../transform-path-to-url';

const extensions = [
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.mts',
  '.cts',
  '.mjs',
  '.cjs',
];
describe('transformPathToUrl - flat routing', () => {
  describe('creates proper route paths', () => {
    const tests: [string, string][] = [
      ['routes.[...param]', '/routes/*'],
      ['routes.sub.[...param]', '/routes/sub/*'],
      ['routes.[slug]', '/routes/:slug'],
      ['routes.sub.[slug]', '/routes/sub/:slug'],
      ['[...param]', '*'],
      ['flat.[...param]', '/flat/*'],
      ['[slug]', '/:slug'],
      ['nested/index', '/nested'],
      ['nested.[...param]', '/nested/*'],
      ['nested.[slug]', '/nested/:slug'],
      ['nested._layout.[param]', '/nested/:param'],

      ['flat.[slug]', '/flat/:slug'],
      ['flat.sub', '/flat/sub'],
      ['_layout/index', '/'],
      ['_layout.test', '/test'],
      ['_layout.[param]', '/:param'],
      ['[slug][.]json', '/:slug.json'],
      ['sub.[sitemap.xml]', '/sub/:sitemap.xml'],
      ['posts.[slug].[image.jpg]', '/posts/:slug/:image.jpg'],

      // Optional segment routes
      ['(routes).[...param]', '/routes?/*'],
      ['(routes).(sub).[...param]', '/routes?/sub?/*'],
      ['(routes).([slug])', '/routes?/:slug?'],
      ['(routes).sub.([slug])', '/routes?/sub/:slug?'],
      ['(nested).[...param]', '/nested?/*'],
      ['(flat).[...param]', '/flat?/*'],
      ['([slug])', '/:slug?'],
      ['(nested).([slug])', '/nested?/:slug?'],
      ['(flat).([slug])', '/flat?/:slug?'],
      ['flat.(sub)', '/flat/sub?'],
      ['_layout.(test)', '/test?'],
      ['_layout.([user])', '/:user?'],
      ['(nested)._layout.([param])', '/nested?/:param?'],
      ['([slug].json)', '/:slug.json?'],
      ['(sub).([sitemap.xml])', '/sub?/:sitemap.xml?'],
      ['(sub).[(sitemap.xml)]', '/sub?/:sitemap.xml?'],
      ['(posts).([slug]).([image.jpg])', '/posts?/:slug?/:image.jpg?'],
      [
        '([$dollabills]).([.]lol).(what).([$]).([up])',
        '/:$dollabills?/.lol?/what?/:$?/:up?',
      ],
      ['(beef])', '/beef?'],
      ['([index])', '/:index?'],

      // Opting out of parent layout
      ['user.projects.[id].roadmap@(user)', '/user/projects/:id/roadmap'],
      ['app.projects.[id].roadmap@(projects)', '/app/projects/:id/roadmap'],
      [
        'shop.projects.[id].roadmap@(shop)@(projects)',
        '/shop/projects/:id/roadmap',
      ],
    ];

    describe.each(extensions)('with valid file extensions', (extension) => {
      const cases = tests.map(
        ([input, expected]) => [`${input}${extension}`, expected] as const
      );

      describe.each(cases)(`with ${extension} files`, (input, expected) => {
        test(`"${input}" -> "${expected}"`, () => {
          // if (input.endsWith('/route') || input.endsWith('/index')) {
          //   input = input.replace(/\/(route|index)$/, '');
          // }

          const pathname = transformPathToUrl(input);
          expect(pathname).toBe(expected);
        });
      });
    });
  });
});
