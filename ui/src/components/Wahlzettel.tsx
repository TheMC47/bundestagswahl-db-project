import { useEffect, useState } from 'react';
import { Deputy, Direktkandidat, Landesliste, LandeslistenKandidaten, Party, Region, State } from '../models'
import {
  getDeputies,
  getListenKandidaten_Zweitstimme,
  getSitzVerteilung,
  getStimmzettel_Erststimme,
  getStimmzettel_Zweitstimme
} from '../api'
import { Container, Table } from 'react-bootstrap';
import { rank } from "d3";




export default function Wahlzettel(): JSX.Element {
  const [wahlkreis, setWahlkreis] = useState<number>(1);
  const [bundesland, setBundesland] = useState<number>(1);


  return (
    <Container className = "mb-4">
      <h1 className="mb-5">Sie haben   <strong> 2  </strong>   Stimmen</h1>
      <div className="row">
        <div className="col-6 d-flex justify-content-end text-secondary" >
           <strong> hier 1 Stimme  </strong>
        </div>
        <div className="col-6 d-flex justify-content-start text-primary">
          <strong> hier 1 Stimme  </strong>
        </div>
        </div>
      <div className="row">
        <div className="col-6 d-flex justify-content-end text-secondary">
          für die Wahl
        </div>
        <div className="col-6 d-flex justify-content-start text-primary">
          für die Wahl
        </div>
      </div>
      <div className="row">
        <div className="col-6 d-flex justify-content-end text-secondary">
          <strong> eines/einer Wahlkreisabgeordneten</strong>
        </div>
        <div className="col-6 d-flex justify-content-start text-primary">
          <strong> einer Landesliste (Partei) </strong>
        </div>
      </div>
        <div className="row">
          <div className="col-6 d-flex justify-content-end"/>

          <div className="col-6 d-flex justify-content-lg-start text-primary">
            - maßgebende Stimme für die Verteilung der Sitze insgesamt auf die einzelnen Parteien-
          </div>
      </div>
        <div className="row">
          <div className="col-6 d-flex justify-content-end text-secondary" >
            <strong> Erststimme  </strong>
          </div>
          <div className="col-6 d-flex justify-content-start text-primary">
            <strong>  Zweitstimme  </strong>
          </div>
        </div>
      <div className="row">
        <div className="col-6" >
          < Erststimme wahlkreis={wahlkreis} />
        </div>
        <div className="col-6 d-flex justify-content-start">
          <Zweitstimme  bundesland={bundesland} />
        </div>
      </div>

      <button type="button" className="btn btn-dark">Bestätigen</button>

    </Container>
  )


}

export interface ErststimmeZettelProps {
  wahlkreis: number;
}


function Erststimme({wahlkreis}: ErststimmeZettelProps): JSX.Element {
  const [direktkandidaten, setdirektkandidaten] = useState<Direktkandidat[]>([]);
  useEffect(() => {
    getStimmzettel_Erststimme(wahlkreis).then(d => setdirektkandidaten(d))
  }, [])

  return (
    <table className="table table-bordered table-hover">
      <tbody className="text-secondary">
      {
        direktkandidaten.map((d) =>
      <tr key={d.rank}>
        <th scope="row">{d.rank}</th>
        <td className="d-block">
          <div className='d-flex justify-content-start'>
            <div className="d-block " >
              <h5  className="d-flex" >{d.kandidat_vorname +" "+ d.kandidat_nachname}</h5>
              <p className="d-flex " >With supporting</p>
            </div>
          </div>
          <div className='d-flex justify-content-end'>
            <div className="d-block" >
              <h5 className="d-flex justify-content-start">{d.partei_abk}</h5>
              <p className="d-flex justify-content-start">{d.partei_name}</p>
            </div>
          </div>
        </td>
        <td>
          <input type="checkbox" className="form-check-input" id="exampleCheck1" />

        </td>
      </tr>
        )}
      </tbody>
    </table>

)
}



export interface ZweitstimmeZettelProps {
  bundesland: number;
}
function Zweitstimme({bundesland}: ZweitstimmeZettelProps): JSX.Element {
  const [landeslisten, setlandeslisten] = useState<Landesliste[]>([]);
  const [listenKandidaten, setListenKandidaten] = useState<LandeslistenKandidaten[]>([]);

  useEffect(() => {
    getStimmzettel_Zweitstimme(bundesland).then(d => setlandeslisten(d))
  }, [])

  useEffect(
    () => {
      getListenKandidaten_Zweitstimme(bundesland).then ( d => setListenKandidaten(d))
    }, []
  )

  return (
    <table className="table table-bordered table-hover">
      <tbody className = "text-primary">
      {
        landeslisten.map((d) =>
          <tr key={d.rank}>
            <td>
              <input type="checkbox" className="form-check-input" id="exampleCheck1" />

            </td>
            <td className="d-block">
              <div className='d-flex justify-content-start'>
                <div className="d-block " >
                  <h5  className="d-flex" >{d.partei_abk}</h5>
                  <p className="d-flex " >{d.partei_abk}</p>
                </div>
              </div>
              <div className='d-flex justify-content-end'>
                <div className="d-block" >

                  <p className="d-flex justify-content-start">{d.partei_name}</p>
                </div>
              </div>
            </td>

            <th scope="row">{d.rank}</th>
          </tr>
        )}
    </tbody>
    </table>
  )
}


