const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({ status: 404, message: `Order id not found: ${orderId}` });
}

function orderIdMatchesRouteId(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { orderId } = req.params;
  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  next();
}

function extractOrderData(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  if (!deliverTo || deliverTo.trim() === "") {
    return next({ status: 400, message: "Order must include a deliverTo" });
  }
  if (!mobileNumber || mobileNumber.trim() === "") {
    return next({ status: 400, message: "Order must include a mobileNumber" });
  }
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({ status: 400, message: "Order must include at least one dish" });
  }

  for (let i = 0; i < dishes.length; i++) {
    const { quantity } = dishes[i];
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }

  res.locals.newData = { deliverTo, mobileNumber, status, dishes };
  next();
}

function statusIsValid(req, res, next) {
  const { status } = res.locals.newData;
  const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (!status || !validStatuses.includes(status)) {
    return next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  next();
}

function isPending(req, res, next) {
  if (res.locals.order.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const newOrder = {
    id: nextId(),
    ...res.locals.newData,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  Object.assign(res.locals.order, res.locals.newData);
  res.json({ data: res.locals.order });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [extractOrderData, create],
  read: [orderExists, read],
  update: [orderExists, orderIdMatchesRouteId, extractOrderData, statusIsValid, update],
  destroy: [orderExists, isPending, destroy],
};