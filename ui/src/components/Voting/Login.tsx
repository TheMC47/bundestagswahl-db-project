import { useState } from 'react'
import validate from 'uuid-validate'
import { login } from '../../api'
import { Alert, Box, Button, Grid, TextField } from '@mui/material'

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
  const [result, setResult] = useState<'success' | 'error'>('success')
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
        setResult('error')
        setDisabled(false)
      })
  }

  return (
    <Grid
      container
      spacing={0}
      direction='column'
      alignItems='center'
      justifyContent='center'
      style={{ minHeight: '50vh' }}
    >
      <Alert severity='info'>
        Geben Sie Ihre 36-stellige Kennung sowie Ihre Aktivierungsschlüssel ein.
        Ihre Sitzung wird für <strong> zwei Stunden </strong> aktiviert.
      </Alert>
      <Grid item xs={3}>
        <Box
          component='form'
          sx={{
            '& .MuiTextField-root': { m: 2, width: '30ch' },
          }}
          autoComplete='off'
        >
          <div>
            <TextField
              error={errors.helfer}
              label='Helferkennung'
              onChange={e => updateField('helfer', e.target.value)}
              variant='filled'
            />
          </div>
          <div>
            <TextField
              label='Aktivierungsschlüssel'
              error={errors.key}
              onChange={e => updateField('key', e.target.value)}
              variant='filled'
            />
          </div>
          <div style={{ paddingTop: 50 }}>
            <Button
              disabled={isDisabled()}
              type='submit'
              className='mb-3'
              onClick={handleSubmit}
              variant='contained'
              fullWidth={true}
            >
              Aktivieren
            </Button>
          </div>
          {message && <Alert severity={result}> {message} </Alert>}
        </Box>
      </Grid>
    </Grid>
  )
}
