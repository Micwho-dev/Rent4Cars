fetch('http://localhost:3000/api/ai/chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    message: 'Is there available car in Mati?',
    history: [{ role: 'ai', text: 'Hello!' }],
    userName: 'Mark'
  })
}).then(res => res.text().then(text => console.log('STATUS:', res.status, 'DATA:', text))).catch(console.error);
