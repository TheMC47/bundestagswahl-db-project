import 'bootstrap/dist/css/bootstrap.min.css'
import { useEffect, useState } from 'react'
import { Direktkandidat, Landesliste } from '../../models'
import { getbundesland, getStimmzettel_Erststimme, getStimmzettel_Zweitstimme, submitVote, } from '../../api'
import { Container, Form } from 'react-bootstrap'
import jwt_decode from 'jwt-decode'
import { Alert, AlertTitle } from "@mui/material";

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
  token: string | null
  setToken: (token: string | undefined) => void
}

interface Token {
  exp: number
  role: string
  wahlkreis: number
}

export default function Wahlzettel({
  token,
  setToken,
}: WahlzettelProps): JSX.Element {
  if (!token)
    return (
      <div style={{
        alignContent: 'center',
        justifyContent: 'center',
        padding: "50px",

      }}>
        <Alert severity="error"
        >
          <AlertTitle>Achtung</AlertTitle>

          Diese Machine wurde noch nicht <a href='/login'>aktiviert. </a>.
        </Alert>
      </div>
    )

  const [bundesland, setBundesland] = useState<number | undefined>(undefined)
  const wahlkreis: number = (jwt_decode(token) as Token).wahlkreis
  const [direktkandidaten, setdirektkandidaten] = useState<
    ErststimmeErgebnisse[]
  >([])
  const [landeslisten, setlandeslisten] = useState<ZweitstimmeErgebnisse[]>([])
  const [key, setkey] = useState<string>('')
  const [message, setMessage] = useState<string | undefined>(undefined)
  const [result, setResult] = useState<'success' | 'error'>('success')

  useEffect(() => {
    getbundesland(wahlkreis).then(d => {
      setBundesland(d.bundesland)
    })
  }, [])

  useEffect(() => {
    getStimmzettel_Erststimme(wahlkreis).then(d => {
      setdirektkandidaten(d.map(l => ({ direktkandidat: l, checked: false })))
    })
  }, [])

  useEffect(() => {
    if (bundesland)
      getStimmzettel_Zweitstimme(bundesland).then(d => {
        setlandeslisten(d.map(l => ({ landesliste: l, checked: false })))
      })
  }, [bundesland])

  return (
    <Container className='mb-4'>
      {bundesland && (
        <div>
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
              <div className='col-6 d-flex justify-content-end'/>

              <div className='col-6 d-flex justify-content-lg-start text-primary'>
                - maßgebende Stimme für die Verteilung der Sitze insgesamt auf
                die einzelnen Parteien-
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
                const gewahlt_direkt = direktkandidaten.find(d => d.checked)
                  ?.direktkandidat.kandidat_id
                const gewahlt_liste = landeslisten.find(d => d.checked)
                  ?.landesliste.liste_id
                submitVote(
                  {
                    direktkandidat: gewahlt_direkt || null,
                    landesliste: gewahlt_liste || null,
                    waehlerschlussel: key,
                  },
                  token
                )
                  .then(() => {
                    setMessage('Ihre Stimme wurde erfolgreich geschickt.')
                    setResult('success')
                    {
                      /* setTimeout(() => window.location.reload(), 3000) */
                    }
                  })
                  .catch(([err, status]) => {
                    if (status == 401) {
                      setMessage('Die Sitzung ist abgelaufen. Sie werden umgeleitet.')
                      setResult('error')
                      setToken(undefined)
                      setTimeout(() => (window.location.href = '/login'), 3000)
                      return
                    }
                    setMessage(err.message)
                    setResult('error')
                  })
              }}
            >
              Stimme abgeben
            </button>
          </div>
        </div>
      )}

      {message && <Alert severity={result}> {message} </Alert>}
    </Container>
  )
}

function Erststimme({
  direktkandidaten,
  setdirektkandidaten,
}: ErststimmeZettelProps): JSX.Element {
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
                    direktkandidaten.map(object => ({
                      ...object,
                      checked: object.direktkandidat === d.direktkandidat,
                    }))
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
  landeslisten,
  setlandeslisten,
}: ZweitstimmeZettelProps): JSX.Element {
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
                    landeslisten.map(object => ({
                      ...object,
                      checked: object.landesliste === d.landesliste,
                    }))
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
