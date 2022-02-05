from typing import Iterable, Union

import psycopg2
from decouple import config

HOST = config("HOST", "localhost")
POSTGRES_DB = config("POSTGRES_DB", "app_db")
POSTGRES_PASSWORD = config("POSTGRES_PASSWORD", "app_user")
POSTGRES_USER = config("POSTGRES_USER", "password")


class Transaction:
    def __init__(self):
        self.__connection = psycopg2.connect(
            host=HOST,
            database=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
        )

        self.__cursor = self.__connection.cursor()

    def run_script(self, script_path: str):
        with open(script_path, "r") as f:
            self.run_query(f.read(), fetch=False)

    def refresh(self, view: str):
        self.run_query(f"REFRESH MATERIALIZED VIEW {view}", fetch=False)

    def run_query(self, query: str, dataklass=None, fetch=True):
        self.__cursor.execute(query)
        if not fetch:
            return []
        ts = self.__cursor.fetchall()
        if dataklass is None:
            return ts
        return [dataklass(*t) for t in ts]

    def do(self, fun: str):
        self.run_query(f"SELECT {fun};", fetch=False)

    def healthcheck(self):
        self.run_query("SELECT version()")
        return self.__cursor.fetchone()

    def select_where(
        self, table: str, pk: int, pk_name: str = "id", dataklass=None
    ):
        return self.run_query(
            f"SELECT * FROM {table} WHERE {pk_name} = {pk}", dataklass
        )

    def disable_constraints(self, table: str):
        self.run_query(f"ALTER TABLE {table} DISABLE TRIGGER ALL", fetch=False)

    def enable_constraints(self, table: str):
        self.run_query(f"ALTER TABLE {table} ENABLE TRIGGER ALL", fetch=False)

    def select_all(self, table: str, dataklass=None):
        return self.run_query(f"SELECT * FROM {table}", dataklass)

    def __normalize_val(self, attr) -> str:
        if attr is None:
            return "NULL"
        if isinstance(attr, str):
            if attr == "":
                return "NULL"
            return "'" + attr.replace("'", "''") + "'"
        return str(attr)

    def __normalize_vals(self, tup: tuple) -> str:
        return f"{','.join(map(self.__normalize_val, tup))}"

    def __normalize_tuple(self, tup: tuple) -> str:
        return f"({self.__normalize_vals(tup)})"

    def __normalize_attr(self, attr: str) -> str:
        return attr  # Hmmmm?

    def __normalize_attrs(self, attrs: list[str]) -> str:
        if attrs is None or not attrs:
            return ""
        return f"({','.join(map(self.__normalize_attr, attrs))})"

    def insert_into(
        self,
        table: str,
        val: Union[tuple, Iterable[tuple]],
        attrs: list[str] = None,
        dataklass=None,
    ):
        values: str
        if isinstance(val, tuple):  # multiple imports
            val = [val]
        values = ",".join([self.__normalize_tuple(x) for x in val])
        attr_str: str = self.__normalize_attrs(attrs)
        return self.run_query(
            f"INSERT INTO {table}{attr_str} VALUES {values} RETURNING *;",
            dataklass,
        )

    def __replicate_tuple(self, tup: tuple, n: int) -> str:
        vals: str = self.__normalize_tuple(tup)
        return (vals + ",") * (n - 1) + vals

    def insert_bulk(
        self, table: str, attrs: list[str], tup: tuple, number: int
    ):
        attr_str: str = self.__normalize_attrs(attrs)
        vals: str = self.__normalize_vals(tup)
        query = f"""INSERT INTO {table}{attr_str} (
            SELECT {vals}
            FROM generate_series(1, {number})
        )"""
        self.run_query(query, fetch=False)

    def rollback(self):
        self.__cursor.rollback()

    def commit(self):
        self.__connection.commit()

    def close(self):
        self.__cursor.close()
        self.__connection.close()

    def __del__(self):
        self.close()
