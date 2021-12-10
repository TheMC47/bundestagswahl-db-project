import {useEffect, useState} from 'react';
import {Deputy, TightestWinner} from '../models'
import {getDeputies, getTightestWinner} from '../api'
import {Col, Container, Form, Row, Table} from 'react-bootstrap';
import {SeatDistributionChart} from "./SeatDistribution";


interface TightestWinsProps {
    year: number;
}


export default function TightestWins(): JSX.Element {
    const [tightestWins, setTightestWins] = useState<TightestWinner[]>([]);

    useEffect(() => {
        getTightestWinner().then(tw => {
            setTightestWins(tw)
        })
    }, [])

    return (
        <Container>
            <Table>
                <thead>
                <tr>
                    <th> Wahl</th>
                    <th> Partei</th>
                    <th> Wahlkreis</th>
                    <th> Rank</th>
                </tr>
                </thead>
                <tbody>
                {
                    tightestWins.map((d, i) =>
                        <tr key={i}>
                            <td>{d.wahl}</td>
                            <td>{d.partei_kurzbezeichnung}</td>
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
