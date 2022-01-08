import { useEffect, useState } from 'react'
import { Direktkandidat, Landesliste } from '../models'
import {
  getbundesland,
  getStimmzettel_Erststimme,
  getStimmzettel_Zweitstimme,
} from '../api'
import { Alert, Container, Form, Table } from 'react-bootstrap'
import jwt_decode from 'jwt-decode'
import { submitVote } from '../api'

export interface ErststimmeZettelProps {
  wahlkreis: number
  direktkandidaten: ErststimmeErgebnisse[]
  setdirektkandidaten: (kandidaten: ErststimmeErgebnisse[]) => void
}

interface ErststimmeErgebnisse {
  direktkandidat: Direktkandidat
  checked: boolean
}

export interface ZweitstimmeZettelProps {
  bundesland: number
  landeslisten: ZweitstimmeErgebnisse[]
  setlandeslisten: (kandidaten: ZweitstimmeErgebnisse[]) => void
}

interface ZweitstimmeErgebnisse {
  landesliste: Landesliste
  checked: boolean
}
interface WahlzettelProps {
  token: string
}

interface Token {
  exp: number
  role: string
  wahlkreis: number
}

export default function Wahlzettel({ token }: WahlzettelProps): JSX.Element {
  const [bundesland, setBundesland] = useState<number>(1)

  const [wahlkreis, setwahlkreis] = useState<number>(1)
  const [direktkandidaten, setdirektkandidaten] = useState<
    ErststimmeErgebnisse[]
  >([])
  const [landeslisten, setlandeslisten] = useState<ZweitstimmeErgebnisse[]>([])
  const [key, setkey] = useState<string>('')
  const [message, setMessage] = useState<string | undefined>(undefined)
  const [result, setResult] = useState<'success' | 'danger'>('success')

  useEffect(() => {
    setwahlkreis((jwt_decode(token) as Token).wahlkreis)
  }, [])

  useEffect(() => {
    getbundesland(wahlkreis).then(d => {
      setBundesland(d.bundesland)
    })
  }, [])

  return (
    <Container className='mb-4'>
      <Form.Group className='mb-3'>
        <Form.Label>Geben Sie Ihren Stimm-Schlüssel ein</Form.Label>
        <Form.Control
          placeholder='Schlüssel'
          value={key}
          onChange={newKey => {
            setkey(newKey.target.value)
          }}
        />
      </Form.Group>

      {token && (
        <div>
          <h1 className='mb-5'>
            Sie haben <strong> 2 </strong> Stimmen
          </h1>
          <div className='row'>
            <div className='col-6 d-flex justify-content-end text-secondary'>
              <strong> hier 1 Stimme </strong>
            </div>
            <div className='col-6 d-flex justify-content-start text-primary'>
              <strong> hier 1 Stimme </strong>
            </div>
          </div>
          <div className='row'>
            <div className='col-6 d-flex justify-content-end text-secondary'>
              für die Wahl
            </div>
            <div className='col-6 d-flex justify-content-start text-primary'>
              für die Wahl
            </div>
          </div>
          <div className='row'>
            <div className='col-6 d-flex justify-content-end text-secondary'>
              <strong> eines/einer Wahlkreisabgeordneten</strong>
            </div>
            <div className='col-6 d-flex justify-content-start text-primary'>
              <strong> einer Landesliste (Partei) </strong>
            </div>
          </div>
          <div className='row'>
            <div className='col-6 d-flex justify-content-end' />

            <div className='col-6 d-flex justify-content-lg-start text-primary'>
              - maßgebende Stimme für die Verteilung der Sitze insgesamt auf die
              einzelnen Parteien-
            </div>
          </div>
          <div className='row'>
            <div className='col-6 d-flex justify-content-end text-secondary'>
              <strong> Erststimme </strong>
            </div>
            <div className='col-6 d-flex justify-content-start text-primary'>
              <strong> Zweitstimme </strong>
            </div>
          </div>
          <div className='row'>
            <div className='col-6'>
              <Erststimme
                wahlkreis={wahlkreis}
                direktkandidaten={direktkandidaten}
                setdirektkandidaten={setdirektkandidaten}
              />
            </div>
            <div className='col-6 d-flex justify-content-start'>
              <Zweitstimme
                bundesland={bundesland}
                landeslisten={landeslisten}
                setlandeslisten={setlandeslisten}
              />
            </div>
          </div>

          <button
            type='button'
            className='btn btn-dark mb-3'
            onClick={() => {
              submitVote(
                {
                  direktkandidat: direktkandidaten.filter(d => d.checked)
                    ? null
                    : direktkandidaten.filter(d => d.checked)[0].direktkandidat
                        .kandidat_id,
                  landesliste: landeslisten.filter(d => d.checked)
                    ? null
                    : landeslisten.filter(d => d.checked)[0].landesliste
                        .liste_id,
                  waehlerschlussel: key,
                },
                token
              )
                .then(() => {
                  setMessage('Ihre Abstimmung wurde erfolgreich geschickt.')
                  setResult('success')
                    {/* setTimeout(() => (window.location.href = '/'), 3000) */ }
                })
                .catch((e: { message: string }) => {
                  setMessage(e.message)
                  setResult('danger')
                })
            }}
          >
            Stimme abgeben
          </button>
        </div>
      )}

      {message && <Alert variant={result}> {message} </Alert>}
    </Container>
  )
}

function Erststimme({
  wahlkreis,
  direktkandidaten,
  setdirektkandidaten,
}: ErststimmeZettelProps): JSX.Element {
  useEffect(() => {
    getStimmzettel_Erststimme(wahlkreis).then(d => {
      setdirektkandidaten(d.map(l => ({ direktkandidat: l, checked: false })))
    })
  }, [])

  return (
    <table className='table table-bordered table-hover'>
      <tbody className='text-secondary'>
        {direktkandidaten.map(d => (
          <tr key={d.direktkandidat.rank}>
            <th scope='row'>{d.direktkandidat.rank}</th>
            <td className='d-block'>
              <div className='d-flex justify-content-start '>
                <div className='d-block '>
                  <h5 className='d-flex'>
                    {d.direktkandidat.kandidat_vorname +
                      ' ' +
                      d.direktkandidat.kandidat_nachname}
                  </h5>
                  <p className='d-flex '> {d.direktkandidat.kandidat_beruf}</p>
                </div>
              </div>
              <div className='d-flex justify-content-end'>
                <div className='d-block'>
                  <h5 className='d-flex justify-content-start '>
                    {d.direktkandidat.partei_abk}
                  </h5>
                  <p className='d-flex justify-content-start'>
                    {d.direktkandidat.partei_name}
                  </p>
                </div>
              </div>
            </td>
            <td>
              <input
                name='direktkandidat'
                type='radio'
                className='form-check-input'
                id='id'
                checked={d.checked}
                onClick={() => {
                  setdirektkandidaten(
                    [...direktkandidaten]
                      .map(object => {
                        if (object.direktkandidat !== d.direktkandidat) {
                          return {
                            ...object,
                            checked: false,
                          }
                        } else return object
                      })
                      .map(object => {
                        if (object.direktkandidat === d.direktkandidat) {
                          return {
                            ...object,
                            checked: !d.checked,
                          }
                        } else return object
                      })
                  )
                }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Zweitstimme({
  bundesland,
  landeslisten,
  setlandeslisten,
}: ZweitstimmeZettelProps): JSX.Element {
  useEffect(() => {
    getStimmzettel_Zweitstimme(bundesland).then(d => {
      setlandeslisten(d.map(l => ({ landesliste: l, checked: false })))
    })
  }, [])

  return (
    <table className='table table-bordered table-hover'>
      <tbody className='text-primary'>
        {landeslisten.map(d => (
          <tr key={d.landesliste.rank}>
            <td>
              <input
                name='landesliste'
                type='radio'
                className='form-check-input'
                id='id'
                checked={d.checked}
                onClick={() => {
                  setlandeslisten(
                    [...landeslisten]
                      .map(object => {
                        if (object.landesliste !== d.landesliste) {
                          return {
                            ...object,
                            checked: false,
                          }
                        } else return object
                      })
                      .map(object => {
                        if (object.landesliste === d.landesliste) {
                          return {
                            ...object,
                            checked: !d.checked,
                          }
                        } else return object
                      })
                  )
                }}
              />
            </td>
            <td className='d-block'>
              <div className='d-flex justify-content-start'>
                <div className='d-block '>
                  <h5 className='d-flex align-content-center'>
                    {d.landesliste.partei_abk}
                  </h5>
                </div>
              </div>
              <div className='d-flex justify-content-end'>
                <div className='d-block'>
                  <h5 className='d-flex justify-content-start '>
                    {d.landesliste.partei_name}
                  </h5>
                  <p className='d-flex justify-content-start'>
                    {d.landesliste.kandidaten}
                  </p>
                </div>
              </div>
            </td>
            <th scope='row'>{d.landesliste.rank}</th>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
