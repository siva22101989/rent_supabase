const https = require('https');

const PROJECT_REF = 'ayndosipsjjcagfrdglg';
const ACCESS_TOKEN = 'sbp_20c3b0a37ec0475aebbffd32462a4a92ea4d5b0f';

function runSql(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${body}`));
          }
        } else {
          reject(new Error(`Status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Checking "plans" table columns...');
  try {
    const columns = await runSql(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'plans';
    `);
    console.log('Columns:', JSON.stringify(columns, null, 2));

    console.log('\nChecking "plans" table data...');
    const rows = await runSql(`
      SELECT tier, name, duration_days, price
      FROM public.plans 
      ORDER BY tier;
    `);
    console.log('Data:', JSON.stringify(rows, null, 2));

  } catch (error) {
    console.error('Error fetching state:', error.message);
  }
}

main();
