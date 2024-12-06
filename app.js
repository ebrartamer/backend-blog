const express = require('express');
const connectDB = require('./config/database');
const dotenv = require('dotenv');
const cors = require('cors');
const routes = require('./routes/index');
const path = require('path');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

connectDB();

app.get('/', (req, res) => res.send('API is running...'));

app.use('/api', routes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
