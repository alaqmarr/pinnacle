import { NextRequest } from 'next/server';
import { POST } from './app/api/storefront/paypal/create-order/route';

async function testEndpoint() {
  const req = new NextRequest('http://localhost:3000/api/storefront/paypal/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        { productId: '12x12x12-heavy-duty-corrugated-box', quantity: 1 }
      ]
    })
  });

  const res = await POST(req);
  console.log('Response status:', res.status);
  const data = await res.json();
  console.log('Response body:', data);
}

testEndpoint().catch(console.error);
