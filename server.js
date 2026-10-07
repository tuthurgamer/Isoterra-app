const express = require('express');
const path = require('node:path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.locals.icons = require('./views/helpers/icons');
app.locals.fmt = require('./views/helpers/format');

app.use(express.urlencoded({ extended: true }));

// Uploads (species icons, journal photos) get a fresh, unique filename on
// every upload — the same URL never changes content, so it's safe to tell
// browsers to keep it forever instead of re-checking with the Pi on every
// page load, which is what was making icons feel slow to load.
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  maxAge: '1y',
  immutable: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.use('/', require('./routes/bacs'));
app.use('/fiches', require('./routes/fiches'));
app.use('/especes', require('./routes/especes'));
app.use('/journal', require('./routes/journal'));
app.use('/pontes', require('./routes/pontes'));
app.use('/vente', require('./routes/vente'));
app.use('/tournee', require('./routes/tournee'));

app.use((req, res) => {
  res.status(404).render('404', { path: req.path });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Erreur serveur : ' + err.message);
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Isoterra tourne sur http://${HOST}:${PORT}`);
});
