fetch('http://localhost:3000/api/clients', {
  headers: { 'Authorization': 'Bearer ' + 'dummy', 'x-user-id': 'default-user' }
}).then(res => res.json()).then(console.log);
