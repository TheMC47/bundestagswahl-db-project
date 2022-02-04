# manage.py: a bridge to the database

The `manage.py` script bundles a set of utilities that facilitate interacting
with the database. To setup the connection to the detabase, the following
environment variables need to be set: `HOST`, `POSTGRES_DB`,
`POSTGRES_PASSWORD`, and `POSTGRES_USER`. If not set, these will fallback to the
default values defined in the `.env` file at the root of the project.

## Requirements

The requirements for the script are in the `requirements.txt` file. To install
the requirements, run `pip install -r requirements.txt`.

## Getting started

After launching the database, it needs to be initialized with the schema and
loaded with the initial data. This can be done by running:

```sh
python manage.py setup
```

The command will execute the schema migrations (located in `migrations/`), seed
the election data, calculate the election results and refresh the `postgREST`
server.

### Preparing the demo

The database setup script **does not** populate the tables related to
vote-casting (`erststimmen`, `zweitstimmen` and `waehler`). This is because it
is expensive to do so (~ 30 minutes), especially for the `waehler` table: around
60 Million UUID strings need to be generated _and_ loaded into the database.
Thus, to allow for casting votes and see the live refresh, these tables are
populated for a given region. In order to do so, the following command can be
used:

```sh
python manage.py demo -w 220
```

The `-w` specifies the number corresponding to the given region (in this case,
`Münch en-West/Mitte`). These can be found online, for example on
[bundeswahlleiter][wahlkreise]. The command will populate the aforementioned
tables, generate a "Helper Key", ten activation keys, and ten voter keys. Refer
to [the voting documentation](../docs/Voting.org) for more details on the role
of each key.

#### Refreshing the results

After casting votes, the results can be refreshed in two steps:

1. Updating the cached tally for the region
2. Re-distributing the seats

The following two commands achieve the desired outcome:

```sh
python manage.py aggregate -w 220
python manage.py calculate-results
```

## Utilities overview

```
$ python manage.py --help
Usage: manage.py [OPTIONS] COMMAND [ARGS]...

Options:
  --help  Show this message and exit.

Commands:
  add-helper              Add helpers for a polling station
  aggregate               Refresh polling-station aggregates
  calculate-results       Calculates election results
  count-votes             Aggregate votes and compute results
  create-activation-keys  Create activation keys
  create-voter-keys       Create voter keys
  deaggregate             Create votes and voter keys from aggregated data
  demo                    Prepare a region for the demo
  generate-votes          Generate votes based on aggregated results
  migrate                 Load the database schema
  run-script              Run an SQL script
  seed                    Load data from csv files into the database
  setup                   Prepare and populate the database
```

Running `python manage.py COMMAND --help` will display its description.

[wahlkreise]: https://www.bundeswahlleiter.de/dam/jcr/d3739c3a-9886-47ed-bf88-99a497bffe8d/btw17_karte_wahlkreise_a1.pdf
