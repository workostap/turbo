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

// // Импортировать модуль mongoose
var mongoose = require('mongoose');
const fetch = require('node-fetch')

// Установим подключение по умолчанию
var mongoDB = 'mongodb+srv://sostapenko:AB12219ab!@cluster0.lxqjp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
mongoose.connect(mongoDB);
// Позволим Mongoose использовать глобальную библиотеку промисов
mongoose.Promise = global.Promise;
// Получение подключения по умолчанию
var db = mongoose.connection;

// Привязать подключение к событию ошибки  (получать сообщения об ошибках подключения)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//Определяем схему
var Schema = mongoose.Schema;

var Trade = new Schema({
  id: Number,
  tradeString: String,
});

// Компилируем модель из схемы
var TradeModel = mongoose.model('Trade', Trade );

// SomeModel.find({ 'name': 'awesome' }, 'name', function (err, athletes) {
//     if (err) return handleError(err);
//     console.log(athletes);
//     // 'athletes' содержит список спортсменов, соответствующих критерию.
// })

//Сохранить новый экземпляр, передав callback
// initial_zakaz.save(function (err) {
//     if (err) return handleError(err);
//     // сохранили!
// });
const handleError = (err) => {
  console.log(err);
  return undefined;
}

const sendMessageToBot = (item) => {
  const info = encodeURI(` Создано ${JSON.stringify(item.created_at)}\n 
    Цена ${item.total}\n
    Источник ${JSON.stringify(item.source.name)}\n
    Данные:\n 
    ФИО ${JSON.stringify(item.custom_fields["ФИО"])}\n
    Телефон ${JSON.stringify(item.custom_fields["Телефон"])}\n
    Комментарий ${JSON.stringify(item.custom_fields["Комментарий"])}\n
    Тип оплаты ${JSON.stringify(item.custom_fields["Тип оплаты"])}\n
    Служба доставки ${JSON.stringify(item.custom_fields["Служба доставки"])}\n
    Адрес доставки ${JSON.stringify(item.custom_fields["Адрес доставки"])}\n

    Количество товаров ${JSON.stringify(item.jobs.length)}\n
    Товар ${JSON.stringify(item.jobs[0].title)}`);

  fetch(`https://api.telegram.org/bot1630838759:AAE_xv66rJO9yyEd0gcDZVD3fMAstjM4qDQ/sendMessage?chat_id=-530465357&text=${info}`, { method: 'GET' })
  // https://api.telegram.org/bot1630838759:AAE_xv66rJO9yyEd0gcDZVD3fMAstjM4qDQ/sendMessage?chat_id=-530465357&text=Test
}

const checkForNewTrades = (lastTrades, savedTrades) => {
  const lastItems = lastTrades.items;
  const savedItems = savedTrades.map(item => ({ ...item, tradeString: JSON.parse(item.tradeString)}));

  let newItemsArr = [];
  let savedItemsKey = {};

  savedItems.forEach((item, index) => {
    savedItemsKey[item.tradeString.id] = index + 1;
  });

  lastItems.forEach(item => {
    if(!savedItemsKey[item.id]){
      newItemsArr.push(item);
    }
  });

  if(newItemsArr.length){
    newItemsArr.forEach((item, index) => {
      var trade = new TradeModel({
        id: item.id,
        tradeString: JSON.stringify(item),
      });

      trade.save(function (err) {
        if (err) return handleError(err);
        // сохранили!
        console.log('trade saved', item.id);
      });

      if(savedItems.length){
        sendMessageToBot(item)
      }

      if(savedItems[savedItems.length -1 - index]){
        TradeModel.find({ id: savedItems[savedItems.length -1 - index].id}).remove()
      }
    });
  }
}

const rrr = async () => {

  let lastTrades;
  var headers = {
    'X-Auth-Token': '8ea1iHDcz1xEbhu3j4FgFWtC'
  }


  fetch('https://api.keepincrm.com/v1/agreements', { method: 'GET', headers: headers}).then((res) => {
    status = res.status;
    return res.json()
  })
      .then((jsonData) => {

        lastTrades = jsonData

        TradeModel.find({}, 'tradeString', function (err, trades) {
          if (err) return handleError(err);

          checkForNewTrades(lastTrades, trades);
        })

      })
      .catch((err) => {
        // handle error
        console.error(err);
      });
}

// function callApiEveryNSeconds(n) {
//   setInterval(rrr, n * 1000);
// }
rrr()

var cron = require('node-cron');

var task = cron.schedule('* * * * *', () =>  {
  rrr();
  console.log('cron')
});
