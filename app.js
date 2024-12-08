const express = require('express');
const connectDB = require('./config/database');
const dotenv = require('dotenv');
const cors = require('cors');
const routes = require('./routes/index');
const path = require('path');
const mongoose = require('mongoose');
const visitorRoutes = require('./routes/visitorRoutes');
const logVisitor = require('./middlewares/visitor');

dotenv.config();

mongoose.set('strictQuery', false);

const app = express();
app.use(express.json());
app.use(cors());

connectDB();

app.get('/', (req, res) => res.send('API is running...'));

app.use('/api', routes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ziyaretçi loglaması için middleware
app.use(logVisitor);

app.use('/api/visitors', visitorRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
