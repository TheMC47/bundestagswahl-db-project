from dataclasses import dataclass


@dataclass
class Landesliste:
    pk: int
    party_candidacy_pk: int
    bundesland_pk_: int


@dataclass
class PartyDB:
    pk: int
    name: str
    abbrv: str

    @property
    def abbrv_or_name(self):
        return self.abbrv if self.abbrv else self.name


@dataclass
class CandidacyDB:
    pk: int
    party_pk: int
    vote_id: int
    additional_txt: str
