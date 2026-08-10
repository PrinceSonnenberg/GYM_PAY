fetch('http://localhost:3000/api/clients', { headers: { 'x-user-id': 'rX5Vc7mc5XSVzDqHZ58U4cFvKVx2' } }).then(r=>r.json()).then(async clients => {
  const c = clients.find(c => c.name === 'Bob Smith' && !c.isArchived);
  if (!c) return console.log("No Bob Smith");
  c.isArchived = true;
  c.status = 'Archived';
  const res = await fetch('http://localhost:3000/api/clients/' + c.id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'rX5Vc7mc5XSVzDqHZ58U4cFvKVx2' },
    body: JSON.stringify(c)
  });
  console.log("Status:", res.status);
  console.log("Res:", await res.json());
});
