import {
  AppBar,
  LinearProgress,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
} from '@mui/material'
import React, { useState } from 'react'
import Box from '@mui/material/Box'
import '../App/style.css'
import logo from './assets/bundestag_logo.svg'
import SeatDistribution from '../SeatDistribution'
import { BrowserRouter as Router, Routes, Route, NavLink, Link } from 'react-router-dom'

import Button from '@mui/material/Button';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuList from '@mui/material/MenuList';
import Divider from '@mui/material/Divider';

import Stack from '@mui/material/Stack';





const navigation = [
  'Ergebnisse',
  'Analyse',
  'Stimmabgabe',
]

export default function Header(): JSX.Element {
  return (
    <AppBar
      position='sticky'
      variant='elevation'
      sx={{
        backgroundColor: '#343a40',
      }}
    >
      <Toolbar variant={ 'dense'}>
        <Box
          component="img"
          sx={{
            height: 64,
          }}
          alt="Your logo."
          src={logo}
        />
        <Typography
          variant='h6'
          noWrap
          component='div'
          color='primary'
          onClick={() => (document.location = '/')}
          sx={{
            cursor: 'pointer',
            position: 'absolute',
            left: '5.25%',
            display: { xs: 'flex', md: 'flex' },
          }}
        >

          Bundestagswahl
        </Typography>
 <HeaderLarge />
      </Toolbar>

    </AppBar>
  )
}

function HeaderLarge(): JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        typography: 'body1',
        position: 'absolute',
        left: '20%',

      }}
    >
      <MenuResults />
      <MenuAnalysis />
      <Voting />


    </Box>
  )
}


export  function MenuAnalysis() {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };


  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = React.useRef(open);
  React.useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current!.focus();
    }

    prevOpen.current = open;
  }, [open]);



  return (
      <div>
        <Button
          ref={anchorRef}
          variant = 'text'
          id="composition-button"
          aria-controls={open ? 'composition-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
        >
          Anaylse
        </Button>
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          role={undefined}
          placement="bottom-start"
          transition
          disablePortal
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin:
                  placement === 'bottom-start' ? 'left top' : 'left bottom',
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList
                    autoFocusItem={open}
                    id="composition-menu"
                    aria-labelledby="composition-button"
                    onKeyDown={handleListKeyDown}
                  >
                    <MenuItem component={Link} to="/knappste-sieger" >Knappste Sieger</MenuItem>
                    <MenuItem component={Link} to="/ueberhangsmandate">Überhangsmandate</MenuItem>
                    <MenuItem component={Link} to="/wahlkreissieger">Wahlkreissieger</MenuItem>
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem component={Link} to="/koalitionen">Koalitionen</MenuItem>
                    <MenuItem component={Link} to="/arbeitslosigkeit"> Arbeitslosigkeit und ideologische Tendenzen</MenuItem>

                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </div>
  );
}


export  function MenuResults() {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };


  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = React.useRef(open);
  React.useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current!.focus();
    }

    prevOpen.current = open;
  }, [open]);



  return (
    <div>
      <Button
        ref={anchorRef}
        variant = 'text'
        id="composition-button"
        aria-controls={open ? 'composition-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        Ergebnisse
      </Button>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        placement="bottom-start"
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom-start' ? 'left top' : 'left bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  autoFocusItem={open}
                  id="composition-menu"
                  aria-labelledby="composition-button"
                  onKeyDown={handleListKeyDown}
                >
                  <MenuItem component={Link} to="/Sitzverteilung" >Sitzverteilung</MenuItem>
                  <MenuItem component={Link} to="/abgeordnete">Abgeordnete</MenuItem>
                  <MenuItem component={Link} to="/wahlkreisuebersicht">Wahlkreisübersicht</MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  );
}


export  function Voting() {



  return (
    <div>
      <Button

        variant = 'text'
        id="composition-button"
        aria-haspopup="true"
      >
        Stimmabgabe
      </Button>
      </div>
     );
}



