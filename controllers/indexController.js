const User = require("../models/User");
const Organization = require("../models/Organization");
const Request = require("../models/Request");
const bcrypt = require("bcrypt");
const path = require("path");
const db = require("../config/db.js");
// Show login page
exports.showLoginPage = (req, res) => {
  res.render("pages/index/login", { user: res.session?.user || null });
};
// Common login handler
exports.handleLogin = (req, res) => {
  const { email, password, role } = req.body;
  // Select the model based on role
  const model = role === "user" ? User : Organization;
  // Fetch the user/organization by email
  model.findByEmail(email, (err, user) => {
    if (err || !user) {
      return res.status(400).send("Invalid email or password");
    }

    // Compare the password
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).send("Invalid email or password");
    }

    req.session.user = { ...user, role };
    res.redirect(role === "user" ? "/" : "/");
  });
};

exports.showSignupPage = (req, res) => {
  res.render("pages/index/signup", { user: res.session?.user || null });
};

exports.handleSignup = (req, res) => {
  const { name, email, phone, password, role, longitude, latitude } = req.body;

  // Hash the password
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Select the model based on role
  const model = role === "user" ? User : Organization;

  // Prepare the data for insertion
  const data = {
    name,
    email,
    phone,
    password: hashedPassword,
    location: role === "organization" ? { longitude, latitude } : null, // Only include location for organizations
  };

  // Create user or organization
  model.create(data, (err, result) => {
    if (err) {
      return res.status(500).send("Error creating account");
    }
    // Optionally, log the user in and redirect to the appropriate dashboard
    req.session.user = {
      id:result.insertId,
      name,
      email,
      phone,
      longitude,
      latitude,
      role,
    }; // Store user info in session
    res.redirect(role === "user" ? "/" : "/");
  });
};

exports.handleLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out");
    }
  });

  res.redirect("/");
};

exports.handleUpload = async (req, res) => {
  const { latitude, longitude, description } = req.body;
  const userId = req.session.user.id; // Assuming the user is logged in

  // Check if a file was uploaded
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  const photo = req.files.photo;
  const uploadPath = path.join(__dirname, "../public/uploads/", photo.name);

  // Move the uploaded file to the uploads directory
  photo.mv(uploadPath, async (err) => {
    if (err) {
      console.error("File upload error: ", err);
      return res.status(500).send(err);
    }

    try {
      // Get all organizations and find the nearest one
      const query = "SELECT * FROM organizations";
      db.query(query, [], (error, organizations) => {
        if (error) {
          console.error("Database error: ", error);
          return res.status(500).send("Database error");
        }

        let nearestOrg = null;
        let minDistance = Infinity;

        organizations.forEach((org) => {
          const distance = getDistance(
            latitude,
            longitude,
            org.latitude,
            org.longitude
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestOrg = org;
          }
        });

        if (!nearestOrg) {
          return res.status(404).send("No organizations found nearby.");
        }

        // Create a new request and assign it to the nearest organization
        const newRequest = {
          userId: userId,
          photo: photo.name, // Store the file name in the database
          latitude,
          longitude,
          organization_id: nearestOrg.id,
          description,
        };

        Request.createRequest(newRequest, (err, result) => {
          if (err) {
            console.error("Request creation error: ", err);
            return res.status(500).send("Failed to create request");
          }

          res.redirect("/");
        });
      });
    } catch (error) {
      console.error("Internal server error: ", error);
      res.status(500).send("Internal server error");
    }
  });
};

// Haversine formula
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon1 - lon2) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLon / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

exports.showDashboard = (req, res) => {
  const { id } = req.params;
  const role = req.session.user.role;

  if (role === "organization") {
    Request.findByOrgId(id, (err, results) => {
      if (err) {
        return res.send(err); // Return to avoid continuing execution if error occurs
      }
      console.log(results);
      res.render("pages/index/dashboard", {
        user: req.session.user || null,
        requests: results,
      });
      // Log the requests after query completion
    });
  }
};

exports.showProfile = (req, res) => {
  const { id } = req.params;
  const role = req.session.user.role;

  if (role === "user") {
    Request.findByUserId(id, (err, results) => {
      if (err) {
        return res.send(err); // Return to avoid continuing execution if error occurs
      }
      console.log(results);
      res.render("pages/user/profile", {
        user: req.session.user || null,
        requests: results,
      });
      // Log the requests after query completion
    });
  }
};

exports.handleResponse = (req, res) => {
  try {
    const {  request_id, response_action } = req.body;
    // Validate the input
    if (!request_id || !response_action ) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Validate the action
    if (!["accepted", "rejected"].includes(response_action)) {
      return res.status(400).json({ message: "Invalid action" });
    }
    Request.updateRequestStatus(
      request_id,
      response_action,
      () => {
        res.redirect("/dashboard/" + req.session.user.id);
      }
    );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error accepting request" });
  }
};
