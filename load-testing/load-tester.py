import random
from locust import HttpUser, between, task

# locust -H http://localhost:3000 -u n -r n --autostart  -f load-tester.py


class WebsiteUser(HttpUser):
    wait_time = between(0.8, 1.2) # TODO adapt

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
    def stimmkreissieger(self):
        pass

    @task(10)
    def ueberhangsmandate(self):
        pass

    @task(20)
    def knappste_sieger(self):
        pass
