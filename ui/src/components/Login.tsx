import { useState } from 'react'
import { Container, Button, Form, Alert } from 'react-bootstrap'
import validate from 'uuid-validate'
import { login } from '../api'

type ErrorState = { [index in 'helfer' | 'key']: boolean }
type FormValues = { [index in 'helfer' | 'key']?: string }



export function HelperLogin(props: {
  setToken: (token: string | undefined) => void
}): JSX.Element {
  const [form, setForm] = useState<FormValues>({})
  const [errors, setErrors] = useState<ErrorState>({
    helfer: false,
    key: false,
  })
  const [message, setMessage] = useState<string | undefined>(undefined)
  const [result, setResult] = useState<'success' | 'danger'>('success')
  const [disabled, setDisabled] = useState<boolean>(false)

  const updateField = (field: string, value: string) => {
    setErrors({
      ...errors,
      [field]: !validate(value),
    })
    setForm({
      ...form,
      [field]: value,
    })
  }
  const isDisabled = (): boolean =>
    disabled ||
    errors.helfer ||
    errors.key ||
    form.helfer == undefined ||
    form.key == undefined

  const handleSubmit: React.FormEventHandler<HTMLElement> = event => {
    event.preventDefault()
    setMessage(undefined)
    setDisabled(true)
    if (!form.helfer || !form.key) return
    login({
      key: form.key,
      helfer: form.helfer,
    })
      .then(resp => {
        setMessage('Aktivierung erfolgreich. Sie werden in Kürze umgeleitet.')
        setResult('success')
        props.setToken(resp.token)
        setTimeout(() => (window.location.href = '/stimmabgabe'), 3000)
      })
      .catch(([err, _status]) => {
        setMessage(err.message)
        setResult('danger')
        setDisabled(false)
      })
  }

  return (
    <Container className='w-50'>
      <Form onSubmit={handleSubmit}>
        <Form.Group className='mb-3'>
          <Form.Label>Helferkennung</Form.Label>
          <Form.Control
            isInvalid={errors.helfer}
            placeholder='Kennung'
            onChange={e => updateField('helfer', e.target.value)}
          />
        </Form.Group>
        <Form.Group className='mb-3'>
          <Form.Label>Aktivierungsschlüssel</Form.Label>
          <Form.Control
            placeholder='Schlüssel'
            isInvalid={errors.key}
            onChange={e => updateField('key', e.target.value)}
          />
          <Form.Text className='text-muted'>
            Sitzung wird für zwei Stunden aktiviert
          </Form.Text>
        </Form.Group>
        <Button
          disabled={isDisabled()}
          variant='primary'
          type='submit'
          className='mb-3'
        >
          Aktivieren
        </Button>
      </Form>
      {message && <Alert variant={result}> {message} </Alert>}
    </Container>
  )
}
