const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { spawn } = require('child_process');

const runId = `isotest${Date.now()}`;
const password = `LocalTest_${Date.now()}_Only`;
const port = 5127;
const base = `http://127.0.0.1:${port}`;

const users = [
  {
    business: 1,
    username: `${runId}_b1`,
    email: `${runId}_b1@example.test`,
    fullName: `${runId}_manager_b1`
  },
  {
    business: 3,
    username: `${runId}_b3`,
    email: `${runId}_b3@example.test`,
    fullName: `${runId}_manager_b3`
  }
];

const directors = [
  {
    business: 1,
    username: `${runId}_director_b1`,
    email: `${runId}_director_b1@example.test`,
    fullName: `${runId}_director_b1`
  },
  {
    business: 3,
    username: `${runId}_director_b3`,
    email: `${runId}_director_b3@example.test`,
    fullName: `${runId}_director_b3`
  }
];

const products = [
  `${runId}_product_b1`,
  `${runId}_product_b3`
];

const customers = [
  `${runId}_customer_b1`,
  `${runId}_customer_b3`
];

const customerIds = [];
const saleIds = [];

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'sales_management_migration_test',
  user: 'u0_a282',
  password: ''
});

let server;
let inserted = false;
let failed = false;
const cookies = [];

function check(condition, message) {
  console.log(`${condition ? 'PASS' : 'FAIL'}: ${message}`);
  if (!condition) failed = true;
}

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {})
    }
  });

  let data = null;
  try {
    data = await response.json();
  } catch {}

  return { response, data };
}

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    if (server.exitCode !== null) {
      throw new Error('Local server stopped during startup.');
    }

    try {
      const result = await request('/api/auth/me');
      if (result.response.status === 401) return;
    } catch {}

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  throw new Error('Local server did not start on port 5127.');
}

async function main() {
  // Ensure the local test port is not already occupied.
  try {
    await fetch(`${base}/api/auth/me`);
    throw new Error('Port 5127 is already in use. Stop the other local server first.');
  } catch (error) {
    if (error.message.includes('already in use')) throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query('BEGIN');

  try {
    for (const user of users) {
      await pool.query(
        `INSERT INTO users
          (full_name, username, email, password_hash, role,
           is_active, business_id, is_platform_admin)
         VALUES ($1, $2, $3, $4, 'manager', true, $5, false)`,
        [
          user.fullName,
          user.username,
          user.email,
          passwordHash,
          user.business
        ]
      );
    }

    for (const director of directors) {
      await pool.query(
        `INSERT INTO users
          (full_name, username, email, password_hash, role,
           is_active, business_id, is_platform_admin)
         VALUES ($1, $2, $3, $4, 'director', true, $5, false)`,
        [
          director.fullName,
          director.username,
          director.email,
          passwordHash,
          director.business
        ]
      );
    }

    for (let i = 0; i < 2; i++) {
      await pool.query(
        `INSERT INTO products
          (product_name, sku, category, selling_price,
           stock_quantity, low_stock_limit, is_active, business_id)
         VALUES ($1, $2, 'food', 100, 10, 2, true, $3)`,
        [
          products[i],
          `${runId}_sku_b${users[i].business}`,
          users[i].business
        ]
      );

      const customerResult = await pool.query(
        `INSERT INTO customers
          (full_name, phone, email, address, is_active, business_id)
         VALUES ($1, $2, $3, $4, true, $5)
         RETURNING id`,
        [
          customers[i],
          `${Date.now()}${i}`,
          `${runId}_customer_b${users[i].business}@example.test`,
          'Temporary local isolation test',
          users[i].business
        ]
      );

      customerIds[i] = customerResult.rows[0].id;

      // Create a sale owned by this business and its temporary manager.
      const saleResult = await pool.query(
        `INSERT INTO sales
          (sale_reference, customer_id, user_id, subtotal, discount,
           total_amount, payment_method, payment_status, business_id, created_at)
         SELECT $1, c.id, u.id, 100, 0, 100, 'cash', 'paid', $4, CURRENT_TIMESTAMP
         FROM customers c
         CROSS JOIN users u
         WHERE c.id = $2 AND u.username = $3
         RETURNING id`,
        [
          `${runId}_sale_b${users[i].business}`,
          customerIds[i],
          users[i].username,
          users[i].business
        ]
      );

      saleIds[i] = saleResult.rows[0].id;

      await pool.query(
        `INSERT INTO sale_items
          (sale_id, product_id, quantity, unit_price, total_price, business_id)
         SELECT $1, p.id, 1, 100, 100, $3
         FROM products p
         WHERE p.product_name = $2`,
        [saleIds[i], products[i], users[i].business]
      );
    }

    await pool.query('COMMIT');
    inserted = true;
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }

  console.log('\n=== LOCAL TENANT-ISOLATION TEST ===');
  console.log('Database: sales_management_migration_test');

  server = spawn(process.execPath, ['server.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: '',
      DB_HOST: '127.0.0.1',
      DB_PORT: '5432',
      DB_NAME: 'sales_management_migration_test',
      DB_USER: 'u0_a282',
      DB_PASSWORD: '',
      NODE_ENV: 'test',
      SESSION_SECRET: `local-only-${runId}-session-secret`,
      PORT: String(port)
    },
    stdio: ['ignore', 'ignore', 'pipe']
  });

  let serverErrors = '';
  server.stderr.on('data', chunk => {
    serverErrors = (serverErrors + chunk.toString()).slice(-3000);
  });

  await waitForServer();

  const unauth = await request('/api/products');

  check(
    unauth.response.status === 401,
    `Unauthenticated product request rejected (HTTP ${unauth.response.status})`
  );

  const sessions = [];

  for (const user of users) {
    const result = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user.username,
        password
      })
    });

    const setCookie = result.response.headers.get('set-cookie');
    const cookie = setCookie ? setCookie.split(';')[0] : '';

    check(
      result.response.ok && result.data?.success === true && !!cookie,
      `Business ${user.business} temporary account login`
    );

    if (!result.response.ok || !cookie) {
      throw new Error(
        `Login failed for Business ${user.business}: HTTP ${result.response.status}`
      );
    }

    cookies.push(cookie);
    sessions.push(cookie);
  }

  for (let i = 0; i < users.length; i++) {
    const business = users[i].business;

    for (const resource of ['products', 'customers']) {
      const result = await request(`/api/${resource}`, {
        headers: { Cookie: sessions[i] }
      });

      const body = JSON.stringify(result.data || {});
      const ownMarker = resource === 'products' ? products[i] : customers[i];
      const otherMarker = resource === 'products' ? products[1 - i] : customers[1 - i];

      check(
        result.response.ok,
        `Business ${business} can access ${resource} (HTTP ${result.response.status})`
      );

      check(
        body.includes(ownMarker),
        `Business ${business} can see its own test ${resource}`
      );

      check(
        !body.includes(otherMarker),
        `Business ${business} cannot see the other business's test ${resource}`
      );
    }
  }

  for (let i = 0; i < users.length; i++) {
    const business = users[i].business;
    const other = 1 - i;
    const cookie = sessions[i];

    const list = await request('/api/sales', {
      headers: { Cookie: cookie }
    });

    const listBody = JSON.stringify(list.data || {});

    check(
      list.response.ok,
      `Business ${business} can access sales list (HTTP ${list.response.status})`
    );

    check(
      listBody.includes(`${runId}_sale_b${business}`),
      `Business ${business} can see its own test sale`
    );

    check(
      !listBody.includes(`${runId}_sale_b${users[other].business}`),
      `Business ${business} cannot see the other business's test sale in the list`
    );

    const ownSale = await request(`/api/sales/${saleIds[i]}`, {
      headers: { Cookie: cookie }
    });

    check(
      ownSale.response.status === 200 &&
      ownSale.data?.sale?.sale_reference === `${runId}_sale_b${business}`,
      `Business ${business} can retrieve its own sale by ID`
    );

    const foreignSale = await request(`/api/sales/${saleIds[other]}`, {
      headers: { Cookie: cookie }
    });

    check(
      foreignSale.response.status === 404,
      `Business ${business} cannot retrieve the other business's sale by ID (HTTP ${foreignSale.response.status})`
    );

    const foreignCustomer = await request(`/api/customers/${customerIds[other]}`, {
      headers: { Cookie: cookie }
    });

    check(
      foreignCustomer.response.status === 404,
      `Business ${business} cannot retrieve the other business's customer by ID (HTTP ${foreignCustomer.response.status})`
    );
  }


  // Cross-business sale write isolation tests.
  const productLookup = await pool.query(
    'SELECT id, product_name, stock_quantity FROM products WHERE product_name = ANY($1::text[])',
    [products]
  );

  const productByName = new Map(
    productLookup.rows.map(row => [row.product_name, row])
  );

  check(
    productByName.size === products.length,
    'Both temporary test products were found'
  );

  const stockBefore = new Map(
    productLookup.rows.map(row => [
      Number(row.id),
      Number(row.stock_quantity)
    ])
  );

  for (let i = 0; i < users.length; i++) {
    const business = users[i].business;
    const other = 1 - i;
    const ownProduct = productByName.get(products[i]);
    const foreignProduct = productByName.get(products[other]);

    if (!ownProduct || !foreignProduct) {
      throw new Error('Temporary test product missing');
    }

    const foreignCustomerAttempt = await request('/api/sales', {
      method: 'POST',
      headers: {
        Cookie: sessions[i],
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_id: customerIds[other],
        items: [{ product_id: ownProduct.id, quantity: 1 }],
        payment_method: 'cash'
      })
    });

    check(
      foreignCustomerAttempt.response.status === 404,
      'Business ' + business +
      ' cannot create a sale for another business customer (HTTP ' +
      foreignCustomerAttempt.response.status + ')'
    );

    const foreignProductAttempt = await request('/api/sales', {
      method: 'POST',
      headers: {
        Cookie: sessions[i],
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_id: customerIds[i],
        items: [{ product_id: foreignProduct.id, quantity: 1 }],
        payment_method: 'cash'
      })
    });

    check(
      foreignProductAttempt.response.status === 404,
      'Business ' + business +
      ' cannot create a sale using another business product (HTTP ' +
      foreignProductAttempt.response.status + ')'
    );
  }

  const stockAfterResult = await pool.query(
    'SELECT id, stock_quantity FROM products WHERE product_name = ANY($1::text[])',
    [products]
  );

  for (const row of stockAfterResult.rows) {
    check(
      stockBefore.get(Number(row.id)) === Number(row.stock_quantity),
      'Rejected cross-business sale attempts leave stock unchanged'
    );
  }

  const unexpectedSales = await pool.query(
    'SELECT COUNT(*)::int AS count FROM sales WHERE customer_id = ANY($1::int[]) AND sale_reference NOT IN ($2, $3)',
    [
      customerIds,
      runId + '_sale_b1',
      runId + '_sale_b3'
    ]
  );

  check(
    Number(unexpectedSales.rows[0].count) === 0,
    'No unexpected sales were created during the write tests'
  );


  // Dashboard access-control and business-isolation tests.
  console.log('\nDashboard isolation tests');

  for (let i = 0; i < users.length; i++) {
    const business = users[i].business;
    const cookie = sessions[i];

    // Managers should access their own manager dashboard.
    const managerDashboard = await request(
      '/api/dashboard/manager',
      {
        headers: { Cookie: cookie }
      }
    );

    check(
      managerDashboard.response.status === 200 &&
      managerDashboard.data?.success === true,
      'Business ' + business +
      ' manager can access the manager dashboard'
    );

    // Managers must not access the director dashboard.
    const directorDashboard = await request(
      '/api/dashboard/director',
      {
        headers: { Cookie: cookie }
      }
    );

    check(
      directorDashboard.response.status === 403,
      'Business ' + business +
      ' manager cannot access the director dashboard (HTTP ' +
      directorDashboard.response.status + ')'
    );


       // Verify today's dashboard totals for this temporary manager.
    if (
      managerDashboard.response.status === 200 &&
      managerDashboard.data?.success === true
    ) {
      const summary = managerDashboard.data.summary || {};

      check(
        Number(summary.total_sales) === 1,
        `Business ${business} dashboard reports exactly one test sale today`
      );

      check(
        Number(summary.total_revenue) === 100,
        `Business ${business} dashboard reports exactly ₦100 test revenue today`
      );

      check(
        Number(summary.products_sold) === 1,
        `Business ${business} dashboard reports exactly one test item sold today`
      );

      check(
        Number(summary.total_customers) === 1,
        `Business ${business} dashboard reports exactly one test customer today`
      );

            // Verify the weekly chart contains only this manager's test sale.
      const chart = managerDashboard.data.sales_chart || [];

      const chartTotals = chart.reduce(
        (totals, row) => ({
          sales: totals.sales + Number(row.total_sales || 0),
          revenue: totals.revenue + Number(row.total_revenue || 0)
        }),
        { sales: 0, revenue: 0 }
      );

      check(
        chartTotals.sales === 1 && chartTotals.revenue === 100,
        `Business ${business} weekly chart contains only its own test sale`
      );
    }

    // Verify the manager dashboard contains no foreign test sales.
    if (managerDashboard.response.status === 200) {
      const recentSales = managerDashboard.data?.recent_sales || [];
      const foreignSaleIds = saleIds.filter(
        (id, index) => index !== i
      );

      check(
        !recentSales.some(
          sale => foreignSaleIds.includes(Number(sale.id))
        ),
        'Business ' + business +
        ' manager dashboard excludes the other business test sale'
      );
    }
  }

  // Director dashboard business-isolation tests.
  console.log('\nDirector dashboard isolation tests');

  for (let i = 0; i < directors.length; i++) {
    const director = directors[i];
    const otherIndex = 1 - i;

    const login = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: director.username,
        password
      })
    });

    const setCookie = login.response.headers.get('set-cookie');
    const cookie = setCookie ? setCookie.split(';')[0] : '';

    check(
      login.response.ok && login.data?.success === true && !!cookie,
      `Business ${director.business} director login`
    );

    if (!login.response.ok || !cookie) {
      throw new Error(
        `Director login failed for Business ${director.business}`
      );
    }

    cookies.push(cookie);

    // Compare dashboard summary against the local database's
    // independently scoped totals for this business.
    const expected = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM sales WHERE business_id = $1) AS total_sales,
         (SELECT COALESCE(SUM(total_amount), 0)
            FROM sales WHERE business_id = $1) AS total_revenue,
         (SELECT COUNT(*) FROM products
            WHERE business_id = $1 AND is_active = true) AS total_products,
         (SELECT COUNT(*) FROM users
            WHERE business_id = $1 AND role = 'manager') AS total_managers,
         (SELECT COUNT(*) FROM users
            WHERE business_id = $1 AND role = 'manager'
              AND is_active = true) AS active_managers,
         (SELECT COUNT(*) FROM users
            WHERE business_id = $1 AND role = 'manager'
              AND is_active = false) AS inactive_managers`,
      [director.business]
    );

    const dashboard = await request('/api/dashboard/director', {
      headers: { Cookie: cookie }
    });

    check(
      dashboard.response.status === 200 &&
      dashboard.data?.success === true,
      `Business ${director.business} director dashboard loads`
    );

    if (dashboard.response.status === 200 &&
        dashboard.data?.success === true) {
      const summary = dashboard.data.summary || {};
      const expectedSummary = expected.rows[0];

      for (const key of [
        'total_sales',
        'total_revenue',
        'total_products',
        'total_managers',
        'active_managers',
        'inactive_managers'
      ]) {
        check(
          Number(summary[key]) === Number(expectedSummary[key]),
          `Business ${director.business} director ${key} matches its own database totals`
        );
      }

      const topManagers = dashboard.data.top_managers || [];
      check(
        !topManagers.some(manager =>
          String(manager.full_name) === directors[otherIndex].fullName
        ),
        `Business ${director.business} director manager list excludes the other business`
      );

      const recent = dashboard.data.recent_transactions || [];
      check(
        recent.some(sale =>
          String(sale.sale_reference) ===
          `${runId}_sale_b${director.business}`
        ),
        `Business ${director.business} director sees its own test sale`
      );

      check(
        !recent.some(sale =>
          String(sale.sale_reference) ===
          `${runId}_sale_b${directors[otherIndex].business}`
        ),
        `Business ${director.business} director excludes the other business's test sale`
      );
    }

    // Check weekly and monthly chart aggregates against independently
    // scoped database queries, avoiding date-string formatting assumptions.
    for (const period of ['weekly', 'monthly']) {
      const interval = period === 'weekly'
        ? "INTERVAL '7 days'"
        : "INTERVAL '12 months'";

      const expectedChart = await pool.query(
        `SELECT
           COUNT(*) AS total_sales,
           COALESCE(SUM(total_amount), 0) AS total_revenue
         FROM sales
         WHERE business_id = $1
           AND created_at >= CURRENT_TIMESTAMP - ${interval}`,
        [director.business]
      );

      const chartResult = await request(
        `/api/dashboard/director?period=${period}`,
        { headers: { Cookie: cookie } }
      );

      check(
        chartResult.response.status === 200 &&
        chartResult.data?.success === true,
        `Business ${director.business} director ${period} chart loads`
      );

      if (chartResult.response.status === 200 &&
          chartResult.data?.success === true) {
        const chart = chartResult.data.sales_chart || [];
        const chartTotals = chart.reduce(
          (totals, row) => ({
            sales: totals.sales + Number(row.total_sales || 0),
            revenue: totals.revenue + Number(row.total_revenue || 0)
          }),
          { sales: 0, revenue: 0 }
        );

        check(
          chartTotals.sales === Number(expectedChart.rows[0].total_sales) &&
          chartTotals.revenue === Number(expectedChart.rows[0].total_revenue),
          `Business ${director.business} director ${period} chart matches only its business totals`
        );
      }
    }
  }


  // Reports and notifications business-isolation tests.
  console.log('\nReports and notifications isolation tests');

  // Make each temporary test product eligible for a low-stock alert.
  await pool.query(
    `UPDATE products
     SET stock_quantity = 1, low_stock_limit = 2
     WHERE product_name = ANY($1::text[])`,
    [products]
  );

  // Manager reports and notifications.
  for (let i = 0; i < users.length; i++) {
    const business = users[i].business;
    const otherIndex = 1 - i;
    const cookie = sessions[i];

    const report = await request('/api/reports', {
      headers: { Cookie: cookie }
    });

    check(
      report.response.status === 200 && report.data?.success === true,
      `Business ${business} manager reports load`
    );

    if (report.response.ok && report.data?.success === true) {
      const transactions = report.data.transactions || [];
      const topProducts = report.data.top_products || [];

      check(
        transactions.some(
          sale => String(sale.sale_reference) ===
            `${runId}_sale_b${business}`
        ),
        `Business ${business} manager report includes its test sale`
      );

      check(
        !transactions.some(
          sale => String(sale.sale_reference) ===
            `${runId}_sale_b${users[otherIndex].business}`
        ),
        `Business ${business} manager report excludes the other business's sale`
      );

      check(
        !topProducts.some(
          product => product.product_name === products[otherIndex]
        ),
        `Business ${business} manager report excludes the other business's product`
      );
    }

    const notificationResult = await request('/api/notifications', {
      headers: { Cookie: cookie }
    });

    check(
      notificationResult.response.status === 200 &&
        notificationResult.data?.success === true,
      `Business ${business} manager notifications load`
    );

    if (
      notificationResult.response.ok &&
      notificationResult.data?.success === true
    ) {
      const messages = (notificationResult.data.notifications || [])
        .map(notification => String(notification.message || ''));

      const combinedMessages = messages.join('\n');

      check(
        combinedMessages.includes(`${runId}_sale_b${business}`),
        `Business ${business} manager receives its own latest-sale notification`
      );

      check(
        !combinedMessages.includes(
          `${runId}_sale_b${users[otherIndex].business}`
        ),
        `Business ${business} manager notifications exclude the other business's sale`
      );

      check(
        !combinedMessages.includes(products[otherIndex]),
        `Business ${business} manager notifications exclude the other business's low-stock product`
      );
    }
  }

  // Director reports: verify business-level isolation.
  for (let i = 0; i < directors.length; i++) {
    const director = directors[i];
    const otherIndex = 1 - i;

    const login = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: director.username,
        password
      })
    });

    const setCookie = login.response.headers.get('set-cookie');
    const cookie = setCookie ? setCookie.split(';')[0] : '';

    check(
      login.response.ok &&
        login.data?.success === true &&
        !!cookie,
      `Business ${director.business} director login for reports test`
    );

    if (!login.response.ok || !cookie) {
      continue;
    }

    cookies.push(cookie);

    const report = await request('/api/reports', {
      headers: { Cookie: cookie }
    });

    check(
      report.response.status === 200 && report.data?.success === true,
      `Business ${director.business} director reports load`
    );

    if (report.response.ok && report.data?.success === true) {
      const transactions = report.data.transactions || [];
      const topProducts = report.data.top_products || [];

      check(
        transactions.some(
          sale => String(sale.sale_reference) ===
            `${runId}_sale_b${director.business}`
        ),
        `Business ${director.business} director report includes its test sale`
      );

      check(
        !transactions.some(
          sale => String(sale.sale_reference) ===
            `${runId}_sale_b${directors[otherIndex].business}`
        ),
        `Business ${director.business} director report excludes the other business's sale`
      );

      check(
        !topProducts.some(
          product => product.product_name === products[otherIndex]
        ),
        `Business ${director.business} director report excludes the other business's product`
      );
    }
  }

  // Manager-versus-director permission tests.
  for (let i = 0; i < users.length; i++) {
    const business = users[i].business;
    const cookie = sessions[i];
    const ownProduct = productByName.get(products[i]);

    const createProduct = await request('/api/products', {
      method: 'POST',
      headers: {
        Cookie: cookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    check(
      createProduct.response.status === 403,
      'Business ' + business +
      ' manager cannot create a product (HTTP ' +
      createProduct.response.status + ')'
    );

    const deleteProduct = await request(
      '/api/products/' + ownProduct.id,
      {
        method: 'DELETE',
        headers: { Cookie: cookie }
      }
    );

    check(
      deleteProduct.response.status === 403,
      'Business ' + business +
      ' manager cannot delete a product (HTTP ' +
      deleteProduct.response.status + ')'
    );

    const productStillExists = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND business_id = $2',
      [ownProduct.id, business]
    );

    check(
      productStillExists.rows.length === 1,
      'Manager permission test leaves the product intact'
    );

    // Managers must not be able to clear business sales.
    const salesBeforeClearAttempt = await pool.query(
      'SELECT id FROM sales WHERE business_id = $1',
      [business]
    );

    const clearSales = await request('/api/sales/clear-all', {
      method: 'DELETE',
      headers: { Cookie: cookie }
    });

    check(
      clearSales.response.status === 403,
      'Business ' + business +
      ' manager cannot clear all sales (HTTP ' +
      clearSales.response.status + ')'
    );

    const salesAfterClearAttempt = await pool.query(
      'SELECT id FROM sales WHERE business_id = $1',
      [business]
    );

    check(
      salesAfterClearAttempt.rowCount === salesBeforeClearAttempt.rowCount,
      'Manager clear-sales attempt leaves business sales intact'
    );

    const deleteCustomer = await request(
      '/api/customers/' + customerIds[i],
      {
        method: 'DELETE',
        headers: { Cookie: cookie }
      }
    );

    check(
      deleteCustomer.response.status === 403,
      'Business ' + business +
      ' manager cannot delete a customer (HTTP ' +
      deleteCustomer.response.status + ')'
    );

    const customerStillExists = await pool.query(
      'SELECT id FROM customers WHERE id = $1 AND business_id = $2',
      [customerIds[i], business]
    );

    check(
      customerStillExists.rows.length === 1,
      'Manager permission test leaves the customer intact'
    );
  }

  if (serverErrors) {
    console.log('\nServer diagnostic output was captured; no secrets will be printed.');
  }
}

main()
  .catch(error => {
    failed = true;
    console.error('\nTEST ERROR:', error.message);
  })
  .finally(async () => {
    for (const cookie of cookies) {
      try {
        await request('/api/auth/logout', {
          method: 'POST',
          headers: { Cookie: cookie }
        });
      } catch {}
    }

    if (server && server.exitCode === null) {
      server.kill('SIGTERM');

      await Promise.race([
        new Promise(resolve => server.once('exit', resolve)),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);

      if (server.exitCode === null) server.kill('SIGKILL');
    }

    if (inserted) {
      try {
        await pool.query('BEGIN');

        await pool.query(
          'DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE customer_id = ANY($1::int[]))',
          [customerIds]
        );

        await pool.query(
          'DELETE FROM sales WHERE customer_id = ANY($1::int[]) OR sale_reference = ANY($2::text[])',
          [customerIds, [`${runId}_sale_b1`, `${runId}_sale_b3`]]
        );

        await pool.query(
          'DELETE FROM customers WHERE full_name = ANY($1::text[])',
          [customers]
        );

        await pool.query(
          'DELETE FROM products WHERE product_name = ANY($1::text[])',
          [products]
        );

        await pool.query(
          'DELETE FROM users WHERE username = ANY($1::text[])',
          [
            [
              ...users.map(user => user.username),
              ...directors.map(director => director.username)
            ]
          ]
        );

        await pool.query('COMMIT');
        console.log('\nCleanup: temporary test records removed.');
      } catch (error) {
        await pool.query('ROLLBACK').catch(() => {});
        console.error('CLEANUP WARNING:', error.message);
        failed = true;
      }
    }

    await pool.end();

    console.log(
      failed
        ? '\nFinal status: CHECK FAILED — do not deploy.'
        : '\nFinal status: TESTS PASSED.'
    );

    if (failed) process.exitCode = 1;
  });
