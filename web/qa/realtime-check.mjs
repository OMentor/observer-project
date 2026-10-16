import { io } from 'socket.io-client';
import axios from 'axios';

const BASE = 'http://localhost:3000';
const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });

const results = [];
function check(name, ok, extra = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ->  ' + extra : ''}`);
}
function fail(msg) {
  console.error('ERROR:', msg);
  process.exitCode = 1;
}

function waitFor(socket, event, timeout = 4000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), timeout);
    socket.once(event, (payload) => {
      clearTimeout(t);
      resolve(payload);
    });
  });
}

function waitConnect(socket, timeout = 4000) {
  return new Promise((resolve, reject) => {
    if (socket.connected) return resolve();
    const t = setTimeout(() => reject(new Error('timeout waiting connect')), timeout);
    socket.once('connect', () => {
      clearTimeout(t);
      resolve();
    });
    socket.once('connect_error', (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

function connect(token) {
  return io(BASE, {
    auth: { token },
    transports: ['websocket'],
    reconnection: false,
  });
}

async function main() {
  const stamp = Date.now();
  const owner = (await api.post('/auth/login', { email: 'demo@pletenie.local', password: 'demo12345' })).data;
  const ownerToken = owner.accessToken;
  const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

  const space = (await api.post('/spaces', { name: `QA Realtime ${stamp}` }, { headers: ownerHeaders })).data;
  const source = (await api.post(`/spaces/${space.id}/sources`, { name: 'QA Source' }, { headers: ownerHeaders })).data;

  const guest = (await api.post('/auth/register', {
    name: 'QA Guest',
    email: `qa-guest-${stamp}@pletenie.local`,
    password: 'guest12345',
  })).data;
  const guestToken = guest.accessToken;
  const guestHeaders = { Authorization: `Bearer ${guestToken}` };

  const tokenRes = (await api.post(`/spaces/${space.id}/tokens`, { preset: 'BUSY' }, { headers: ownerHeaders })).data;
  await api.post(`/tokens/${tokenRes.token}/activate`, { name: 'QA Guest' }, { headers: guestHeaders });

  const ownerSocket = connect(ownerToken);
  const guestSocket = connect(guestToken);
  await Promise.all([waitConnect(ownerSocket), waitConnect(guestSocket)]);
  check('owner и guest подключились по JWT', ownerSocket.connected && guestSocket.connected);

  const payload = {
    title: `QA Event ${stamp}`,
    start_at: new Date(Date.now() + 3600_000).toISOString(),
    end_at: new Date(Date.now() + 7200_000).toISOString(),
  };

  const ownerGot = waitFor(ownerSocket, 'event.created');
  const guestGot = waitFor(guestSocket, 'event.created');
  await api.post(`/sources/${source.id}/events`, payload, { headers: ownerHeaders });
  const [ownerPayload, guestPayload] = await Promise.all([ownerGot, guestGot]);

  check('owner получил event.created', ownerPayload.event.title === payload.title);
  check('owner видит полный заголовок', ownerPayload.event.busy === false);
  check('guest получил event.created', guestPayload.event.source_id === source.id);
  check(
    'guest видит маскировку BUSY (Занято)',
    guestPayload.event.busy === true && guestPayload.event.title === 'Занято',
  );
  check('payload содержит actor_id владельца', ownerPayload.actor_id === owner.user.id);

  const members = (await api.get(`/spaces/${space.id}/members`, { headers: ownerHeaders })).data;
  const guestMember = members.find((m) => m.user_id === guest.user.id);
  check('guest присутствует в участниках', Boolean(guestMember));

  const kicked = waitFor(guestSocket, 'member.kicked');
  await api.delete(`/members/${guestMember.id}`, { headers: ownerHeaders });
  const kickPayload = await kicked;
  check('guest получил member.kicked', kickPayload.user_id === guest.user.id);

  await new Promise((r) => setTimeout(r, 400));
  let guestLeaked = false;
  const leakGuard = guestSocket.on('event.created', () => {
    guestLeaked = true;
  });
  const ownerAfter = waitFor(ownerSocket, 'event.created');
  await api.post(`/sources/${source.id}/events`, { ...payload, title: `After kick ${stamp}` }, { headers: ownerHeaders });
  await ownerAfter;
  await new Promise((r) => setTimeout(r, 400));
  guestSocket.off('event.created', leakGuard);
  check('кикнутый guest больше не получает события комнаты', guestLeaked === false);

  guestSocket.disconnect();
  await waitConnect(ownerSocket).catch(() => {});
  ownerSocket.disconnect();
  await new Promise((r) => setTimeout(r, 300));

  const reconnected = connect(ownerToken);
  await waitConnect(reconnected);
  check('owner переподключился после обрыва', reconnected.connected);
  const afterReconnect = waitFor(reconnected, 'event.created');
  await api.post(`/sources/${source.id}/events`, { ...payload, title: `Reconnect ${stamp}` }, { headers: ownerHeaders });
  const rePayload = await afterReconnect;
  check('после реконнекта события снова приходят', rePayload.event.title === `Reconnect ${stamp}`);
  reconnected.disconnect();

  await api.delete(`/spaces/${space.id}`, { headers: ownerHeaders }).catch(() => {});

  const failed = results.filter((r) => !r.ok);
  console.log(`\nTOTAL ${results.length - failed.length}/${results.length} PASS`);
  if (failed.length) process.exitCode = 1;
}

main().catch((e) => fail(e.stack || e.message));
