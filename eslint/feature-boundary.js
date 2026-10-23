import { readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import importX, { createNodeResolver } from 'eslint-plugin-import-x'

/**
 * ADR-0105: a feature never imports from another feature.
 * One restricted zone per feature folder, so new features are covered with no config edit.
 * @param {string} base project root (directory that holds `src/`)
 */
export function featureBoundary(base) {
  const dir = join(base, 'src', 'features')
  const features = existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : []
  return [{
    files: ['src/**/*.{ts,vue}'],
    plugins: { 'import-x': importX },
    settings: { 'import-x/resolver-next': [createNodeResolver({ extensions: ['.ts', '.vue', '.js', '.json'] })] },
    rules: {
      'import-x/no-restricted-paths': [
        'error',
        {
          basePath: base,
          zones: features.map((f) => ({
            target: `./src/features/${f}`,
            from: './src/features',
            except: [`./${f}`],
            message: `features/${f} must not import from another feature. Move shared code to components/, api/ or app/.`,
          })),
        },
      ],
    },
  },
  {
    // The alias form would skip the zone check above, so features import their own files relatively.
    files: ['src/features/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: ['@/features/*', '@/features/**'], message: 'Import feature files relatively. Cross-feature imports are not allowed.' }] }],
    },
  }]
}
