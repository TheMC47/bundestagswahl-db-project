#!/usr/bin/env bash

set -e

LAST_APPLIED="${LAST_APPLIED:=0}"

cd "$(dirname "$0")"

if [ $LAST_APPLIED -gt 0 ]
then
    echo Last applied migration has the number "${LAST_APPLIED}" based on the \$LAST_APPLIED environment variable.
    read -p "Apply migrations? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]
    then
        echo bye
        exit 0
    fi
fi

for f in $(find ./*.sql | sort); do
    BASE="${f%%-*}"
    NUM="${BASE:2}"
    if [ $LAST_APPLIED -lt "$NUM" ]
    then
        AT_LEAST_ONCE=1
        echo Applying "${f}"
        docker-compose exec db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" < "${f}"
    fi
done

if [ -z ${AT_LEAST_ONCE+x} ]
then
    echo Already up-to-date.
fi
