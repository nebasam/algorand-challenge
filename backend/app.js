const express = require('express');

// const userRouter = require('./routes/userRoute');
const usersRoute = require('./routes/users');
const accountsRoute = require('./routes/account');

const app = express();


// body parser
app.use(express.json());


app.use('/users', usersRoute);
app.use('/accounts', accountsRoute);

app.listen(process.env.PORT, () => {
    console.log(`App started on PORT ${process.env.PORT}`)
})

module.exports = app;