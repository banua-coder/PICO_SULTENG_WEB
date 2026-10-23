// @vitest-environment node
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain JS config module
import { featureBoundary } from '../../eslint/feature-boundary.js'

const cwd = fileURLToPath(new URL('./fixture', import.meta.url))

async function lint(file: string) {
  const eslint = new ESLint({
    cwd,
    overrideConfigFile: true,
    overrideConfig: [{ files: ['**/*.ts'], languageOptions: { parser: tseslint.parser } }, ...featureBoundary(cwd)],
  })
  const [res] = await eslint.lintFiles([file])
  return res!.messages
}

describe('feature boundary rule', () => {
  it('fails an import from features/a into features/b', async () => {
    const msgs = await lint('src/features/a/bad.ts')
    expect(msgs.map((m) => m.ruleId)).toContain('import-x/no-restricted-paths')
  })
  it('fails the alias form too', async () => {
    const msgs = await lint('src/features/a/alias.ts')
    expect(msgs.map((m) => m.ruleId)).toContain('no-restricted-imports')
  })
  it('allows an import inside the same feature', async () => {
    expect(await lint('src/features/a/ok.ts')).toEqual([])
  })
})
