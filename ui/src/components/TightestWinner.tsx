import {useEffect, useState} from 'react';
import {Deputy, TightestWinner} from '../models'
import {getDeputies, getTightestWinner} from '../api'
import {Col, Container, Form, Row, Table} from 'react-bootstrap';
import {SeatDistributionChart} from "./SeatDistribution";


export default function TightestWins(props: { year: number }): JSX.Element {
    const [tightestWins, setTightestWins] = useState<TightestWinner[]>([]);


    useEffect(() => {
        getTightestWinner().then(tw => {
            setTightestWins(tw)
        })
    }, [])

    const filteredData = tightestWins.filter(d => d.wahl == props.year)

    return (
        <Container>
            <Table>
                <thead>
                <tr>
                    <th> Partei</th>
                    <th> Wahlkreis</th>
                    <th> Rank</th>
                </tr>
                </thead>
                <tbody>
                {
                    filteredData.map((d, i) =>
                        <tr key={i}>
                            <td>{d.kurzbezeichnung}</td>
                            <td>{d.wahlkreis}</td>
                            <td>{d.rank}</td>
                        </tr>
                    )
                }
                </tbody>
            </Table>
        </Container>
    );
}
