import path from 'path';
import { Server } from 'http';
import Express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { match, RouterContext } from 'react-router';

// initialize the server and configure support for ejs templates
const app = new Express();
const server = new Server(app);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// define the folder that will be used for static assets
app.use('/', Express.static(path.join(__dirname, 'static')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'static/index.html')));

// start the server
const port = process.env.PORT || 3000;
const env = process.env.NODE_ENV || 'staging';
server.listen(port, err => {
  if (err) {
    return console.error(err);
  }
  console.info(`Server running on http://localhost:${port} [${env}]`);
});