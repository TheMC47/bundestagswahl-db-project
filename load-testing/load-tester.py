import random

from locust import HttpUser, between, task, events

# locust -H http://localhost:3000 -u n -r n --autostart --watit-time t -f load-tester.py


@events.init_command_line_parser.add_listener
def _(parser):
    parser.add_argument("--wait-time", type=int, default=1, help="Parameterized wait-time")


class PerEndpointUser(HttpUser):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.t = self.environment.parsed_options.wait_time

    def wait_time(self):
        return between(self.t*0.8, self.t*1.2)(self)

    @task(25)
    def sitzverteilung(self):
        self.client.get("/sitze_pro_partei_full")

    @task(10)
    def abgeordnete(self):
        self.client.get("/abgeordnete")

    @task(25)
    def alle_ergebnisse(self):
        wahlkreis = random.randint(1, 298)
        self.client.get("/bundeslaender?select=*,wahlkreise(*)")
        self.client.get(
            f"/wahlkreis_uebersicht?wahlkreis=eq.{wahlkreis}",
            name="/wahlkreis_uebersicht",
        )
        self.client.get(
            f"/alle_ergebnisse?wahlkreis=eq.{wahlkreis}",
            name="/alle_ergebnisse",
        )

    @task(10)
    def wahlkreisssieger(self):
        bundesland = random.randint(1, 16)
        self.client.get(f"/gewinner_parteien?bundesland=eq.{bundesland}", name="/gewinner_parteien")

    @task(10)
    def ueberhangsmandate(self):
        year = random.choice([1, 2])
        self.client.get(f"/ueberhangsmandate?wahl=eq.{year}", name="/ueberhangsmandate")

    @task(20)
    def knappste_sieger(self):
        year = random.choice([1, 2])
        party = random.randint(1, 63)
        self.client.get(f"/knappste_sieger?wahl=eq.{year}&partei_id=eq.{party}", name="/knappste_sieger")
