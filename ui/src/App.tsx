import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import {Col, Container, Form} from 'react-bootstrap';
import SeatDistribution from './components/SeatDistribution';
import Deputies from './components/Deputies'
import TightestWins from './components/TightestWinner';
import {useState} from "react";

function App(): JSX.Element {
    const [year, setYear] = useState<number>(1);

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        setYear(+e.currentTarget.value)
    }

    return (
        <Container className="App d-flex justify-content-center">
            <Col>
                <Form.Select onChange={handleYearChange}>
                    <option value="1">2021</option>
                    <option value="2">2017</option>
                </Form.Select>
            </Col>
            <Col className="mw-75">
                <SeatDistribution year={year}/>
            </Col>
            <Col>
                <Deputies/>
            </Col>
            <Col>
                <TightestWins year={year}/>
            </Col>
        </Container>
    );
}

export default App;
