const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({ status: 404, message: `Dish id not found: ${dishId}` });
}

function dishIdMatchesRouteId(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { dishId } = req.params;
  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

function extractDishData(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  if (!name || name.trim() === "") {
    return next({ status: 400, message: "Dish must include a name" });
  }
  if (!description || description.trim() === "") {
    return next({ status: 400, message: "Dish must include a description" });
  }
  if (!image_url || image_url.trim() === "") {
    return next({ status: 400, message: "Dish must include a image_url" });
  }
  if (price === undefined || typeof price !== "number" || price <= 0 || !Number.isInteger(price)) {
    return next({ status: 400, message: "Dish must have a price that is an integer greater than 0" });
  }

  res.locals.newData = { name, description, price, image_url };
  next();
}

function list(req, res) {
  res.json({ data: dishes });
}

function create(req, res) {
  const newDish = {
    id: nextId(),
    ...res.locals.newData,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  Object.assign(res.locals.dish, res.locals.newData);
  res.json({ data: res.locals.dish });
}

function methodNotAllowed(req, res, next) {
  next({ status: 405, message: `${req.method} not allowed for ${req.originalUrl}` });
}

module.exports = {
  list,
  create: [extractDishData, create],
  read: [dishExists, read],
  update: [dishExists, dishIdMatchesRouteId, extractDishData, update],
  delete: [methodNotAllowed],
};