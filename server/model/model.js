const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize
const sequelize = new Sequelize(process.env.DB, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: false, // Disable logging
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // allow self-signed certs (safe for dev)
    },
  },

});

// Define User Model
const User = sequelize.define('User', {
  user_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  username: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  email: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true, 
    validate: { isEmail: true } 
  },
  password: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  zip_code: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  role: { 
    type: DataTypes.ENUM('user', 'admin'), 
    defaultValue: 'user' 
  },
}, { timestamps: true });

// Define Food_Locations Model
const FoodLocation = sequelize.define('FoodLocation', {
  location_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  address: { 
    type: DataTypes.STRING, 
    allowNull: true

  },
  zip_code: { 
    type: 
    DataTypes.STRING, 
    allowNull: false 
  },
  latitude: { 
    type: DataTypes.FLOAT, 
    allowNull: true 
  },
  longitude: { 
    type: 
    DataTypes.FLOAT, 
    allowNull: true 
  },
  type: { 
    type: DataTypes.STRING, //DataTypes.ENUM('supermarket', 'food pantry', 'farmers market', 'restaurant', 'bodega', 'community fridge', 'soup kitchen'), 
    allowNull: false 
  },
  hours_open: { 
    type: DataTypes.STRING 
  },
  website_url: { 
    type: DataTypes.STRING 
  },
  phone_number: { 
    type: DataTypes.STRING 
  },
  email: { 
    type: DataTypes.STRING, 
    validate: { isEmail: true } 
  },
}, { timestamps: true });

// Define Food_Prices Model
const FoodPrice = sequelize.define('FoodPrice', {
  price_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  location_id: { 
    type: DataTypes.INTEGER, 
    references: { 
      model: FoodLocation, 
      key: 'location_id' 
    }
  },
  item_name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  price: { 
    type: DataTypes.FLOAT, 
    allowNull: false 
  },
  unit: { 
    type: DataTypes.ENUM('lb', 'kg', 'each', 'dozen', 'gallon', 'liter'), 
    allowNull: true 
  },
  last_updated: { 
    type: DataTypes.DATE, 
    defaultValue: Sequelize.NOW 
  },
}, { timestamps: false });

// Define Food_Deserts Model
const FoodDesert = sequelize.define('FoodDesert', {
  desert_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  neighborhood: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  zip_code: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  food_access_score: { 
    type: DataTypes.FLOAT, 
    allowNull: false 
  },
  avg_grocery_distance: { 
    type: DataTypes.FLOAT, 
    allowNull: false 
  },
  avg_income: { 
    type: DataTypes.FLOAT, 
    allowNull: false 
  },
  population: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  last_updated: { 
    type: DataTypes.DATE, 
    defaultValue: Sequelize.NOW 
  },
}, { timestamps: false });

// Define Reviews Model
const Review = sequelize.define('Review', {
  review_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  user_id: { 
    type: DataTypes.INTEGER, 
    references: { 
      model: User, 
      key: 'user_id' 
    } 
  },
  location_id: { 
    type: DataTypes.INTEGER, 
    references: { 
      model: FoodLocation, 
      key: 'location_id' 
    }
  },
  price_rating: { 
    type: DataTypes.INTEGER, 
    allowNull: false
  },
  quality_rating: {
    type: DataTypes.INTEGER, 
    allowNull: false
  },
  comment: { 
    type: DataTypes.TEXT 
  },
}, { timestamps: true });

// Define Saved_Locations Model
const SavedLocation = sequelize.define('SavedLocation', {
  save_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true
  },
  user_id: { 
    type: DataTypes.INTEGER, 
    references: { model: User, key: 'user_id' } 
  },
  location_id: { 
    type: DataTypes.INTEGER, 
    references: { model: FoodLocation, key: 'location_id' } 
  },
}, { timestamps: true });

// Define Community_Resources Model
const CommunityResource = sequelize.define('CommunityResource', {
  resource_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  type: { 
    type: DataTypes.ENUM('food_assistance', 'financial_aid', 'housing_shelter', 'healthcare', 'employment_support'), 
    allowNull: false 
  },
  eligibility: { 
    type: DataTypes.STRING 
  },
  description: { 
    type: DataTypes.TEXT 
  },
  website_url: { 
    type: DataTypes.STRING 
  },
  contact_email: { 
    type: DataTypes.STRING, 
    validate: { 
      isEmail: true 
    } 
  },
  contact_phone: { 
    type: DataTypes.STRING 
  },
}, { timestamps: false });

// Define Relationships
User.hasMany(Review, { foreignKey: 'user_id' });
User.hasMany(SavedLocation, { foreignKey: 'user_id' });

FoodLocation.hasMany(FoodPrice, { foreignKey: 'location_id' });
FoodLocation.hasMany(Review, { foreignKey: 'location_id' });
FoodLocation.hasMany(SavedLocation, { foreignKey: 'location_id' });

Review.belongsTo(User, { foreignKey: 'user_id' });
Review.belongsTo(FoodLocation, { foreignKey: 'location_id' });

SavedLocation.belongsTo(User, { foreignKey: 'user_id' });
SavedLocation.belongsTo(FoodLocation, { foreignKey: 'location_id' });

FoodPrice.belongsTo(FoodLocation, { foreignKey: 'location_id' });

// Sync Database (Creates Tables)
const syncDatabase = async () => {
  try {
    await sequelize.sync({ schema: 'public', alter: true });
    console.log("All tables created successfully!");
  } catch (error) {
    console.error("Error syncing database:", error);
  }
};

syncDatabase();

// Export Models and Sequelize Instance
module.exports = { 
  sequelize, 
  User, 
  FoodLocation, 
  FoodPrice, 
  FoodDesert, 
  Review, 
  SavedLocation, 
  CommunityResource 
};


