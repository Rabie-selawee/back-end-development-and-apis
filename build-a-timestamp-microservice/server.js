import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// 1. مسار الطلب الفارغ /api
app.get('/api', (req, res) => {
  const now = new Date();
  return res.json({
    unix: now.getTime(),
    utc: now.toUTCString()
  });
});

// 2. مسار التواريخ /api/:date
app.get('/api/:date', (req, res) => {
  const dateParam = req.params.date;
  let date;

  if (/^\d+$/.test(dateParam) || /^-?\d+$/.test(dateParam)) {
    date = new Date(parseInt(dateParam, 10));
  } else {
    date = new Date(dateParam);
  }

  if (isNaN(date.getTime())) {
    return res.json({ error: 'Invalid Date' });
  }

  return res.json({
    unix: date.getTime(),
    utc: date.toUTCString()
  });
});

// 3. الاستماع على المنفذ 3000 والمنفذ 8000 معاً
const PORT_PRIMARY = process.env.PORT || 3000;
const PORT_SECONDARY = 8000;

app.listen(PORT_PRIMARY, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT_PRIMARY}`);
});

app.listen(PORT_SECONDARY, '0.0.0.0', () => {
  console.log(`Server also listening on port ${PORT_SECONDARY}`);
});