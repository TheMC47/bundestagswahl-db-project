# Loadtesting
Load-testing was performed on the API-layer (i.e. no UI-rendering)[^1]. To
faciliatate writing and running the tests, the [locust](https://locust.io/)
load-testing tool is used. The definition of the tests are to be found
[here](load-tester.py). The requirements need to be installed by `pip install -
r requirements.txt`

To generate the benchmark, change the `N` (number of users) and `T` (average
wait-time) parameters in the command bellow:
``` sh
locust -H http://localhost:3000 -u N -r N --autostart --wait-time T -f load-tester.py
```

## Tasks
Each UI-view is assigned a task, that emulates the calls to the server performed
by the client. The following table shows the mapping of UI views to API
endpoints:

| Task ID | Name             | URLs                                    |
|---------|------------------|-----------------------------------------|
| Q1      | Sitzverteilung   | /sitze_pro_partei_full                  |
| Q2      | Abgeordnete      | /abgeordnete                            |
| Q3      | Alle Ergebnisse  | /wahlkreis_uebersicht, /alle_ergebnisse |
| Q4      | Wahlkreissieger  | /gewinner_parteien                      |
| Q5      | Überhangsmandate | /ueberhangsmandate                      |
| Q6      | Knappste Sieger  | /knappste_sieger                        |

### Tests
All tests ran a total of five minutes (CPU: Intel i7-8750H (12) @ 4.100GHz, RAM:
12GB), OS: Manjaro Linux x86_64, 4.19.217-1-MANJARO). No request failed. The
detailed results for each test can be found in `TEST_NUMBER.html`.

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


[^1]: This is done for pragmatic reasons: the bottleneck is the database and the
    server, not the UI, since it is executed on the client. Moreover, in a
    production setting, the UI can run on its own machine(s) or a dedicated
    Content Distribution Network (CDN), thus separating the two components
    entirely. Another reason is that it is not practical to emulate many
    browsers *with javascript* on a consumer-grade machine; and testing just the
    protocol requires only HTTP and in this way less resources, allowing to focus
    the benchmark on the database.
