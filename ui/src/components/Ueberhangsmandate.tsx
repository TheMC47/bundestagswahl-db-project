import {ArcElement, Chart as ChartJS, Legend, Tooltip} from 'chart.js';
import {useEffect, useState} from 'react';
import {ueberhangsmandate} from '../models'
import {getUeberhangsmandate} from "../api";
import {Col, Container, Form, Row, Table} from "react-bootstrap";


ChartJS.register(ArcElement, Tooltip, Legend);

interface UeberhangsmandateProps {
    data: ueberhangsmandate[];
    year: number;
}


export default function Ueberhangsmandate(): JSX.Element {

    const [data, setData] = useState<ueberhangsmandate[]>([]);
    const [year, setYear] = useState<number>(1);


    useEffect(() => {
        getUeberhangsmandate().then(d => setData(d))
    }, [])


    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        setYear(+e.currentTarget.value)
    }

    return (
        <Container>
            <Row>
                <Col>
                    <Form.Select onChange={handleYearChange}>
                        <option value="1">2021</option>
                        <option value="2">2017</option>
                    </Form.Select>
                </Col>
            </Row>
            <Col>
                <UeberhangsmandateTable data={data} year={year}/>
            </Col>
        </Container>
    );
}

export function UeberhangsmandateTable({data, year}: UeberhangsmandateProps): JSX.Element {
    const filteredData = data.filter(d => d.wahl == year)


    return (
        <Table>
            <thead>
            <tr>
                <th>Partei</th>
                <th>Bundesland</th>
                <th>Überhangmandate</th>
            </tr>
            </thead>
            <tbody>
            {
                filteredData.map((d, index) =>
                    <tr key={index}>
                        <td>{d.partei_kurzbezeichnung}</td>
                        <td>{d.land_abkuerzung}</td>
                        <td>{d.ueberhange}</td>
                    </tr>
                )
            }
            </tbody>
        </Table>
    )
}