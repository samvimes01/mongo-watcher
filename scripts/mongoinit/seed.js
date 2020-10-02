// db = db.getSiblingDB("projectdb");
db.createCollection("warehouses");
db.createCollection("manufacturers");
db.createCollection("serviceCenters");

const manufCount = 240;
const warehouseCount = 3;
const serviceCenterCount = 4;
const manufPerWarehouse = manufCount / warehouseCount;
const manufPerServiceCenter = manufCount / serviceCenterCount;
const manufacturers = [];

// seed manufacturers
for (let i = 0; i < manufCount; i++) {
  const _id = new ObjectId();
  const name = `Manufacturer ${i}`;
  manufacturers.push({ _id, name });

  db.manufacturers.save({ _id, name, adress: `Blossom street ${i + 1}` });
}
// seed warehouses
for (let i = 0; i < warehouseCount; i++) {
  db.warehouses.save({
    _id: new ObjectId(),
    name: `Warehouse ${i}`,
    manufacturers: manufacturers.slice(
      i * manufPerWarehouse,
      (i + 1) * manufPerWarehouse
    ),
  });
}
// seed servicecenters
for (let i = 0; i < serviceCenterCount; i++) {
  db.serviceCenters.save({
    _id: new ObjectId(),
    name: `ServiceCenter ${i}`,
    manufacturers: manufacturers.slice(
      i * manufPerServiceCenter,
      (i + 1) * manufPerServiceCenter
    ),
  });
}
