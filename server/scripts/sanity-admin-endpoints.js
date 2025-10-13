const axios = require('axios');

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const adminEmail = process.env.ADMIN_EMAIL || 'colab@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || '123456';
  function h(t) {
    return { headers: { Authorization: `Bearer ${t}` } };
  }

  try {
    console.log('Health check...');
    const health = await axios.get(base + '/health');
    console.log('health ok:', health.status);

    console.log('Login admin...');
    const login = await axios.post(base + '/api/auth/login', {
      email: adminEmail,
      password: adminPassword,
    });
    const token = login.data?.data?.accessToken;
    if (!token) {
      throw new Error('Login sem token');
    }
    console.log('login ok');

    console.log('GET public supporters...');
    const pubSupp = await axios.get(base + '/api/public/supporters');
    console.log(
      'public supporters count:',
      Array.isArray(pubSupp.data?.data) ? pubSupp.data.data.length : 'n/a'
    );

    console.log('POST supporter...');
    const created = await axios.post(
      base + '/api/supporters',
      { name: 'Sanity Co.', description: 'Teste', order: 1, visible: true },
      h(token)
    );
    const supporterId = created.data?.data?.id;
    console.log('supporter id:', supporterId);

    console.log('PATCH supporter order...');
    const upd = await axios.patch(base + '/api/supporters/' + supporterId, { order: 2 }, h(token));
    console.log('supporter new order:', upd.data?.data?.order);

    console.log('GET public top donors...');
    const pubTop = await axios.get(base + '/api/public/top-donors/top/2025/10/10');
    console.log(
      'public top donors count:',
      Array.isArray(pubTop.data?.data) ? pubTop.data.data.length : 'n/a'
    );

    console.log('POST top donor A...');
    const td = await axios.post(
      base + '/api/top-donors',
      {
        donorName: 'Doado A',
        donatedAmount: 1000,
        donationType: 'total',
        donationDate: new Date().toISOString(),
        referenceMonth: 10,
        referenceYear: 2025,
      },
      h(token)
    );
    console.log('top donor A id:', td.data?.data?.id);

    console.log('POST top donor B (maior valor)...');
    const td2 = await axios.post(
      base + '/api/top-donors',
      {
        donorName: 'Doado B',
        donatedAmount: 2000,
        donationType: 'total',
        donationDate: new Date().toISOString(),
        referenceMonth: 10,
        referenceYear: 2025,
      },
      h(token)
    );
    console.log('top donor B id:', td2.data?.data?.id);

    console.log('GET public top donors (ver ranking)...');
    const top10 = await axios.get(base + '/api/public/top-donors/top/2025/10/10');
    console.log(
      'top positions:',
      top10.data.data.map((x) => ({ name: x.donorName, pos: x.topPosition, amt: x.donatedAmount }))
    );

    console.log('Cleanup...');
    await axios.delete(base + '/api/supporters/' + supporterId, h(token));
    await axios.delete(base + '/api/top-donors/' + td.data.data.id, h(token));
    await axios.delete(base + '/api/top-donors/' + td2.data.data.id, h(token));

    console.log('Sanity OK');
    process.exit(0);
  } catch (e) {
    const status = e.response?.status;
    const body = e.response?.data || e.message;
    console.error('Sanity FAILED:', status, body);
    process.exit(1);
  }
})();
