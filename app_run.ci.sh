#!/bin/sh
npm run db:migrate
npm run db:seed
NODE_ENV=testing node server.js
