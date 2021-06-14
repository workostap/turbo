var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const axios = require("axios");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

const apiClient = axios.create({
  baseURL: 'https://api.keepincrm.com/',
  // timeout: 2000,
  responseType: 'json',
  headers: { 'X-Auth-Token': '8ea1iHDcz1xEbhu3j4FgFWtC', 'Content-Type': 'application/json' },
});

async function callApi() {
  try {
    let response = await apiClient.get('v1/agreements')
    console.log("Response:", response.data);
  } catch (err) {
    console.log('err', err)
  }
}

function callApiEveryNSeconds(n) {
  setInterval(callApi, n * 1000);
}

callApiEveryNSeconds(20);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
