<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Code2, Download, FileSpreadsheet, Globe, Smartphone, Terminal } from '@lucide/vue'
import { useDownloadSizes } from '@/api/useSeries'
import { API_BASE, API_ORIGIN, APP_LATEST, APP_RELEASES_URL, DOCS_URL, REPO_URL, SWAGGER_URL } from '@/app/facts'
import { usePageHead } from '@/app/head'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'
import CopyButton from '@/components/CopyButton.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// The entry point for the API and the app (the role the old pico-hub page had). Sulawesi Tengah first, then the rest.
const { t } = useI18n()
const f = useFormat()
const { localize } = useLocale()
const sizes = useDownloadSizes()
usePageHead({ title: () => t('mulai.title'), description: () => t('mulai.description') })

const EXAMPLE_PATH = '/provinces/72/cases?start_date=2024-01-13&end_date=2024-01-14'
const curl = `curl -s "${API_BASE}${EXAMPLE_PATH}"`
const js = `const res = await fetch('${API_BASE}${EXAMPLE_PATH}')\nconst { data } = await res.json()\nconsole.log(data.data[0].cumulative.positive)`
const mb = (n: number) => (n >= 1e6 ? `${f.num(n / 1e6, 1)} MB` : `${f.num(Math.max(1, Math.round(n / 1e3)))} KB`)
const FILES = [
  { file: 'kabupaten-sulteng', label: 'mulai.files.kabupaten' },
  { file: 'provinsi', label: 'mulai.files.provinsi' },
  { file: 'indonesia', label: 'mulai.files.indonesia' },
] as const
const status = computed(() => [
  { key: 'play', label: t('mulai.app.play'), ok: false },
  { key: 'apple', label: t('mulai.app.apple'), ok: false },
  { key: 'apk', label: t('mulai.app.apk'), ok: true },
])
const TOC = ['api', 'unduh', 'aplikasi', 'kode'] as const
const pre = 'm-0 overflow-x-auto rounded-md bg-cotton-deep p-4 text-sm leading-relaxed text-ink'
</script>

<template>
  <div class="flex flex-col gap-8 px-4 py-8">
    <header>
      <h1 class="text-xl md:text-2xl">{{ t('mulai.title') }}</h1>
      <p class="mt-2 max-w-prose text-ink-muted">{{ t('mulai.lead') }}</p>
      <nav :aria-label="t('mulai.jump')" class="mt-4">
        <ul class="m-0 flex list-none flex-wrap gap-2 p-0">
          <li v-for="k in TOC" :key="k">
            <Button as-child variant="outline" size="sm"><a :href="`#${k}`" class="text-primary-strong no-underline">{{ t(`mulai.${k === 'api' ? 'api' : k === 'unduh' ? 'files' : k === 'aplikasi' ? 'app' : 'code'}.title`) }}</a></Button>
          </li>
        </ul>
      </nav>
    </header>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-lg"><Globe class="size-5" aria-hidden="true" />{{ t('mulai.web.title') }}</CardTitle>
        <CardDescription>{{ t('mulai.web.text') }}</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-wrap gap-2">
        <Button as-child><RouterLink :to="localize('/data')" class="text-on-primary no-underline">{{ t('mulai.web.data') }}</RouterLink></Button>
        <Button as-child variant="outline"><RouterLink :to="localize('/tabel-data')" class="text-primary-strong no-underline">{{ t('mulai.web.table') }}</RouterLink></Button>
      </CardContent>
    </Card>

    <section aria-labelledby="api">
      <SectionHeading id="api" :level="2">{{ t('mulai.api.title') }}</SectionHeading>
      <Card class="mt-3">
        <CardContent class="flex flex-col gap-5">
          <p class="m-0">{{ t('mulai.api.text') }}</p>
          <div>
            <p class="m-0 text-sm font-semibold text-ink-muted">{{ t('mulai.api.base') }}</p>
            <div class="mt-1 flex flex-wrap items-center gap-3">
              <code class="rounded-md bg-cotton-deep px-3 py-2 text-sm" data-testid="api-base">{{ API_ORIGIN }}</code>
              <CopyButton :value="API_ORIGIN" :label="t('mulai.what.base')" />
            </div>
            <p class="mt-2 text-sm text-ink-muted">{{ t('mulai.api.version') }}</p>
          </div>
          <div>
            <p class="m-0 text-sm font-semibold text-ink-muted">{{ t('mulai.api.example') }}</p>
            <Tabs default-value="curl" class="mt-2">
              <TabsList>
                <TabsTrigger value="curl"><Terminal aria-hidden="true" />{{ t('mulai.api.tabCurl') }}</TabsTrigger>
                <TabsTrigger value="js"><Code2 aria-hidden="true" />{{ t('mulai.api.tabJs') }}</TabsTrigger>
              </TabsList>
              <TabsContent value="curl">
                <pre :class="pre" tabindex="0"><code>{{ curl }}</code></pre>
                <div class="mt-2"><CopyButton :value="curl" :label="t('mulai.what.command')" /></div>
              </TabsContent>
              <TabsContent value="js">
                <pre :class="pre" tabindex="0"><code>{{ js }}</code></pre>
                <div class="mt-2"><CopyButton :value="js" :label="t('mulai.what.command')" /></div>
              </TabsContent>
            </Tabs>
            <p class="mt-2 text-sm text-ink-muted">{{ t('mulai.api.note') }}</p>
          </div>
          <ul class="m-0 flex list-none flex-wrap gap-2 p-0">
            <li><Button as-child><a :href="DOCS_URL" rel="noopener" class="text-on-primary no-underline">{{ t('mulai.api.docs') }}</a></Button></li>
            <li><Button as-child variant="outline"><a :href="SWAGGER_URL" rel="noopener" class="text-primary-strong no-underline">{{ t('mulai.api.swagger') }}</a></Button></li>
            <li><Button as-child variant="outline"><a :href="`${API_ORIGIN}/docs/swagger.json`" rel="noopener" class="text-primary-strong no-underline">{{ t('mulai.api.openapi') }}</a></Button></li>
          </ul>
        </CardContent>
      </Card>
    </section>

    <section aria-labelledby="unduh">
      <SectionHeading id="unduh" :level="2">{{ t('mulai.files.title') }}</SectionHeading>
      <Card class="mt-3">
        <CardContent class="flex flex-col gap-4">
          <p class="m-0">{{ t('mulai.files.text') }}</p>
          <Table>
            <caption class="sr-only">{{ t('mulai.files.caption') }}</caption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{{ t('mulai.files.area') }}</TableHead>
                <TableHead scope="col">{{ t('mulai.files.csv') }}</TableHead>
                <TableHead scope="col">{{ t('mulai.files.xlsx') }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="x in FILES" :key="x.file">
                <TableCell class="font-semibold">{{ t(x.label) }}</TableCell>
                <TableCell>
                  <Button as-child variant="outline" size="sm"><a :href="`/unduh/${x.file}.csv`" download class="text-primary-strong no-underline"><Download aria-hidden="true" />CSV<span v-if="sizes.data.value?.[x.file]" class="num text-ink-muted"> {{ mb(sizes.data.value[x.file]!.csv) }}</span></a></Button>
                </TableCell>
                <TableCell>
                  <Button as-child variant="outline" size="sm"><a :href="`/unduh/${x.file}.xlsx`" download class="text-primary-strong no-underline"><FileSpreadsheet aria-hidden="true" />XLSX<span v-if="sizes.data.value?.[x.file]" class="num text-ink-muted"> {{ mb(sizes.data.value[x.file]!.xlsx) }}</span></a></Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p class="m-0 text-sm text-ink-muted">{{ t('mulai.files.columns') }} <RouterLink :to="localize('/metodologi')">{{ t('footer.methodology') }}</RouterLink>.</p>
          <p class="m-0 text-sm text-ink-muted">{{ t('mulai.files.licence') }}</p>
        </CardContent>
      </Card>
    </section>

    <section aria-labelledby="aplikasi">
      <SectionHeading id="aplikasi" :level="2">{{ t('mulai.app.title') }}</SectionHeading>
      <Card class="mt-3">
        <CardContent class="flex flex-col gap-5">
          <p class="m-0">{{ t('mulai.app.text') }}</p>
          <div>
            <h3 class="m-0 text-md">{{ t('mulai.app.status') }}</h3>
            <ul class="m-0 mt-2 flex list-none flex-col gap-2 p-0" data-testid="app-status">
              <li v-for="s in status" :key="s.key" class="flex flex-wrap items-center gap-3">
                <Smartphone class="size-4 text-ink-muted" aria-hidden="true" />
                <span class="min-w-40 font-semibold">{{ s.label }}</span>
                <Badge :variant="s.ok ? 'default' : 'outline'">{{ s.ok ? t('mulai.app.available') : t('mulai.app.notPublished') }}</Badge>
              </li>
            </ul>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <Button as-child size="lg"><a :href="APP_RELEASES_URL" rel="noopener" class="text-on-primary no-underline"><Download aria-hidden="true" />{{ t('mulai.app.download') }}</a></Button>
            <span class="num text-sm text-ink-muted">{{ t('mulai.app.version', { version: APP_LATEST.version, size: f.num(APP_LATEST.mb, 1) }) }}</span>
          </div>
          <div>
            <h3 class="m-0 text-md">{{ t('mulai.app.howTitle') }}</h3>
            <ol class="mt-2 pl-5">
              <li>{{ t('mulai.app.step1') }}</li>
              <li>{{ t('mulai.app.step2') }}</li>
              <li>{{ t('mulai.app.step3') }}</li>
            </ol>
          </div>
          <p class="m-0 rounded-md border border-line bg-cotton-deep p-4 text-sm">{{ t('mulai.app.warn') }}</p>
        </CardContent>
      </Card>
    </section>

    <section aria-labelledby="kode">
      <SectionHeading id="kode" :level="2">{{ t('mulai.code.title') }}</SectionHeading>
      <Card class="mt-3">
        <CardContent>
          <p class="m-0">{{ t('mulai.code.text') }}</p>
          <ul class="m-0 mt-3 grid list-none gap-1 p-0 sm:grid-cols-2">
            <li><a class="inline-flex min-h-touch items-center" :href="REPO_URL" rel="noopener">{{ t('mulai.code.web') }}</a></li>
            <li><a class="inline-flex min-h-touch items-center" href="https://github.com/banua-coder/pico-api-go" rel="noopener">{{ t('mulai.code.api') }}</a></li>
            <li><a class="inline-flex min-h-touch items-center" href="https://github.com/banua-coder/pico-api-docs" rel="noopener">{{ t('mulai.code.docs') }}</a></li>
            <li><a class="inline-flex min-h-touch items-center" href="https://github.com/ryanaidilp/PICO_SULTENG_FLUTTER" rel="noopener">{{ t('mulai.code.app') }}</a></li>
          </ul>
        </CardContent>
      </Card>
    </section>
  </div>
</template>
