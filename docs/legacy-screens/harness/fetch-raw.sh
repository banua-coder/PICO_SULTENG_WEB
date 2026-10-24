#!/bin/sh
# Pull live data from the new API into ./raw (used by build-mock.mjs)
cd "$(dirname "$0")"; mkdir -p raw; cd raw
B=https://pico-api.banuacoder.com/api/v1
curl -s "$B/national?all=true" -o national.json
curl -s "$B/provinces/72/cases?all=true" -o prov72.json
curl -s "$B/provinces" -o provinces.json
curl -s "$B/stats/tests?all=true&province_id=72" -o tests.json
for id in 7201 7202 7203 7204 7205 7206 7207 7208 7209 7210 7211 7212 7271; do
  curl -s "$B/regencies/$id/cases?all=true" -o reg$id.json
done
