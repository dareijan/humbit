import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import "bootstrap/dist/css/bootstrap.min.css";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import "bootstrap-icons/font/bootstrap-icons.css";
import Alert from "react-bootstrap/Alert";

import HumiditeettiKomponentti from './komponentit/HumiditeettiKomponentti';

const apibase =
  'https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature' +
  '&storedquery_id=fmi::forecast::edited::weather::scandinavia::point::timevaluepair' +
  '&place=' + encodeURIComponent('Jyväskylä') +
  '&parameters=Humidity';

const POISSULJETTAVAT_YON_AJAT = ["01:00", "02:00", "03:00", "04:00", "05:00", "06:00"];
const VIIKONPAIVAT = ["Sunnuntai", "Maanantai", "Tiistai", "Keskiviikko", "Torstai", "Perjantai", "Lauantai"];

export default function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    let cancelled = false;

    // Start of the current hour, in UTC ISO format without milliseconds
    const alku = new Date();
    alku.setMinutes(0, 0, 0);
    const paivays = alku.toISOString().replace('.000Z', 'Z');

    axios
      .get(`${apibase}&starttime=${paivays}`)
      .then((result) => {
        if (cancelled) return;

        const parser = new DOMParser();
        const parsedxml = parser.parseFromString(result.data, "text/xml");

        if (parsedxml.querySelector('parsererror')) {
          console.log('XML parse error');
          return;
        }

        const rivit = [];

        parsedxml.querySelectorAll('MeasurementTVP').forEach((tvp) => {
          const value = tvp.querySelector('value')?.textContent;
          const time = tvp.querySelector('time')?.textContent;
          if (value == null || time == null) return;

          const [paivaStr, kello] = time.split('T');
          const [hh, mm] = kello.split(':');
          const aika = `${hh}:${mm}`;

          if (POISSULJETTAVAT_YON_AJAT.includes(aika)) return;

          // Show the weekday name when a new day starts (07:00)
          let paivamaarateksti = '';
          if (aika === '07:00') {
            const [v, k, p] = paivaStr.split('-').map(Number);
            paivamaarateksti = VIIKONPAIVAT[new Date(Date.UTC(v, k - 1, p)).getUTCDay()];
          }

          rivit.push({ aika, paivamaarateksti, value });
        });

        setData(rivit);
      })
      .catch((error) => console.log(error));

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <Container>
        <Row>
          <Col md="9">
            <br />
            <div align="center">
              <h6 className="violetti">Humbit - Maalaussää Jyväskylässä</h6>
            </div>
          </Col>
        </Row>
      </Container>
      <Container>
        <Row>
          <Col md="9">
            <br />
            <div align="left">
              <Alert key="light" variant="light">
                <i className="bi bi-hand-thumbs-up lila" title="maalaussää"> maalaussää</i>
                <br />
                <i className="bi bi-hand-thumbs-down lila" title="ei maalaussäätä"> ei maalaussäätä</i>
                <br />
              </Alert>
            </div>
          </Col>
        </Row>
      </Container>
      <HumiditeettiKomponentti data={data} />
    </div>
  );
}