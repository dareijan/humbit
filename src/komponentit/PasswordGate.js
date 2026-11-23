import React, { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

const FRAGMENTS = [
  "wOvx4NLYfjc",
  "BxCNVEHmutx",
  "mVLtDQjRms=",
  "kzbR0BGIPBg"
];

const ORDER = [2, 0, 3, 1];
const XOR_KEY = ['the-', 'salt'].join('');

function getExpectedHash() {
  const parts = [];
  FRAGMENTS.forEach((f, k) => { parts[ORDER[k]] = f; });
  const bytes = Uint8Array.from(atob(parts.join('')), (c) => c.charCodeAt(0));
  const key = new TextEncoder().encode(XOR_KEY);
  return [...bytes]
    .map((b, i) => (b ^ key[i % key.length]).toString(16).padStart(2, '0'))
    .join('');
}
// ----------------------------------------------------------

async function sesame(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem('unlocked') === 'true'
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((await sesame(password)) === getExpectedHash()) {
      sessionStorage.setItem('unlocked', 'true');
      setUnlocked(true);
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (unlocked) return children;

  return (
    <Container style={{ maxWidth: 400 }} className="mt-5">
      <h5 className="mb-3">Syötä salasana</h5>
      <Form onSubmit={handleSubmit}>
        <Form.Control
          type="password"
          value={password}
          autoFocus
          placeholder="Salasana"
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
        />
        {error && <Alert variant="danger" className="mt-2">Väärä salasana</Alert>}
        <Button type="submit" className="mt-3">Avaa</Button>
      </Form>
    </Container>
  );
}