Promise.all([
  fetch('http://localhost:3000/api/settings'),
  fetch('http://localhost:3000/api/clients'),
  fetch('http://localhost:3000/api/invoices'),
  fetch('http://localhost:3000/api/goals'),
  fetch('http://localhost:3000/api/expenses'),
  fetch('http://localhost:3000/api/sessions'),
]).then(resps => {
  resps.forEach(r => console.log(r.status));
}).catch(console.error);
