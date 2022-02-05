# Bundestagswahlen

The project is implemented as part of the "Database Systems" lecture
taught by Prof. Dr. Alfons Kemper and Christian Winter during the winter
semester of 2021/2022. The course is part of the Elite Software Engineering
Graduate Program, offered by the University of Augsburg, the Technical
University of Munich, and the Ludwig-Maximilian University. The project is
created by Maisa Ben Salah and Yecine Megdiche

## Getting started

- Requirements: `docker`, `docker-compose` and `python`.

After cloning the project, the system can be started with:

```sh
docker-compose up
```

Once the setup is complete, the database can be loaded with:

```sh
python backend/manage.py setup
```

Note that the requirements of the [backend](backend) component need to be fulfilled.
Follow the instructions here to set it up.

The frontend website will be available at <localhost:3006>.

## Architecture and Overview:

This is an overview of the different subidrectories:

- [backend](backend): contains the data to seed the database and a CLI tool to manage it
- [docs](docs): documentation artifacts
- [load-testing](load-testing): the load testing tool and reports
- [mockups](mockups): initial ui mockups

The system is composed of three subsystems:

- a [PostgreSQL][postgresql] database,
- a [postgREST][postgrest] webserver providing a RESTful API,
- and a frontend website built by [React][react].

[postgrest]: https://postgrest.org/
[postgresql]: https://www.postgresql.org/
[react]: https://reactjs.org/
