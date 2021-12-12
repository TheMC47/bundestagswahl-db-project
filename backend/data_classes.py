from dataclasses import dataclass



@dataclass
class Landesliste:
    pk: int
    party_candidacy_pk: int
    bundesland_pk: int


@dataclass
class Party:
    pk: int
    name: str
    abbrv: str
    real_party: bool
    ideologie: str

    @property
    def abbrv_or_name(self):
        return self.abbrv if self.abbrv else self.name


@dataclass
class Candidacy:
    pk: int
    party_pk: int
    vote_id: int
    additional_txt: str


@dataclass
class Direktcandidate:
    pk: int
    candidate: int
    wahlkreis_pk: int
    party_candidacy_pk: int
