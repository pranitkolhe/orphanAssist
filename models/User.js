const db = require("../config/db.js");

const User = {
  // Create a new user with callback to handle success or failure
  create: (data, callback) => {
    const query =
      "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)";
    db.query(
      query,
      [data.name, data.email, data.password, data.phone],
      (err, result) => {
        if (err) {
          return callback(err, null);
        }
        callback(null, result);
      }
    );
  },

  // Get user by ID with callback for handling result or error
  findById: (id, callback) => {
    const query = "SELECT * FROM users WHERE id = ?";
    db.query(query, [id], (err, result) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, result[0]); // Assuming you want a single user
    });
  },

  // Get user by email with callback for handling result or error
  findByEmail: (email, callback) => {
    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], (err, result) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, result[0]); // Assuming email is unique and only one user is returned
    });
  },

  // Update user details by ID
  findByIdAndUpdate: (id, updatedData, callback) => {
    const fields = [];
    const values = [];

    // Dynamically generate the query based on provided fields
    if (updatedData.name) {
      fields.push("name = ?");
      values.push(updatedData.name);
    }
    if (updatedData.email) {
      fields.push("email = ?");
      values.push(updatedData.email);
    }
    if (updatedData.phone) {
      fields.push("phone = ?");
      values.push(updatedData.phone);
    }
    if (updatedData.img) {
      fields.push("img = ?");
      values.push(updatedData.img);
    }
    if (updatedData.password) {
      fields.push("password = ?");
      values.push(updatedData.password);
    }

    // Add the user ID at the end for the WHERE clause
    values.push(id);

    // Construct the query string
    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

    // Execute the query
    db.query(query, values, (err, result) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, result);
    });
  },
};

module.exports = User;
