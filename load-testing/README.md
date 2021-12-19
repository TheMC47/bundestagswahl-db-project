# Loadtesting

Command to generate the benchmark (grouped per endpoint)
``` sh
locust -H http://localhost:3000 -u N -r N --autostart --wait-time T -f load-tester.py PerEndpointUser
```

### Tests
All tests ran a total of five minutes. No request failed. The detailed results
for each test can be found in `TEST_NUMBER.html`

| Test Number  | Number of users | Wait-time (seconds) | Number of Requests | Requests per second |
|--------------|-----------------|---------------------|--------------------|---------------------|
| 0 (Baseline) | 1               | 1                   | 452                | 1.51                |
| 1            | 100             | 5                   | 8950               | 29.86               |
| 2            | 100             | 1                   | 43815              | 146.13              |
| 3            | 500             | 5                   | 44619              | 148.82              |
| 4            | 500             | 1                   | 51515              | 171.84              |

### Results Summary
Average wait time (in ms) per endpoint per test

| Endpoint                                    | 0 (baseline) | 1  | 2  | 3  | 4    |
|---------------------------------------------|--------------|----|----|----|------|
| GET /abgeordnete                            | 12           | 19 | 9  | 36 | 2155 |
| GET /alle_ergebnisse                        | 42           | 55 | 47 | 59 | 2283 |
| GET /bundeslaender?select=\*,wahlkreise(\*) | 11           | 19 | 8  | 43 | 2253 |
| GET /gewinner_parteien                      | 17           | 28 | 13 | 36 | 2211 |
| GET /knappste_sieger                        | 31           | 44 | 26 | 53 | 2230 |
| GET /sitze_pro_partei_full                  | 7            | 11 | 5  | 36 | 2219 |
| GET /ueberhangsmandate                      | 18           | 29 | 14 | 40 | 2145 |
| GET /wahlkreis_uebersicht                   | 3            | 11 | 5  | 21 | 2185 |
| Aggregated                                  | 18           | 27 | 17 | 41 | 2221 |
