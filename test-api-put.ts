const id = '6a938585-52ff-40d4-8d22-dccef3146812'; // I'll just query to get a valid id first
fetch('http://localhost:3000/api/clients', {
  headers: { 'x-user-id': 'default-user' }
}).then(r => r.json()).then(async data => {
  if (data.length === 0) return;
  const target = data[0];
  target.isArchived = true;
  target.status = 'Archived';
  const res = await fetch(`http://localhost:3000/api/clients/${target.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'default-user' },
    body: JSON.stringify(target)
  });
  console.log("Status:", res.status);
  console.log("Response:", await res.text());
});
