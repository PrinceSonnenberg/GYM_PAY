fetch('http://localhost:3000/api/clients', {
  headers: { 'Content-Type': 'application/json' }
}).then(res => res.json()).then(async data => {
  const c = data[0];
  console.log("Got client:", c);
  const updated = { ...c, isArchived: true, status: 'Archived' };
  const res = await fetch('http://localhost:3000/api/clients/' + c.id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated)
  });
  console.log("PUT status:", res.status);
  console.log("PUT body:", await res.json());
});
