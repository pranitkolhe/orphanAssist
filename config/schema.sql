CREATE DATABASE orphan_assist;
USE orphan_assist;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  img VARCHAR(255) ,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(10) NOT NULL,
  password VARCHAR(255) NOT NULL,
  rating DECIMAL(3, 2) DEFAULT 0
);

CREATE TABLE organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(10) NOT NULL,
  password VARCHAR(255) NOT NULL,
 latitude DECIMAL(10, 8),
 longitude DECIMAL(11, 8)
);


CREATE TABLE requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  photo VARCHAR(255),
  latitude DECIMAL(10, 8),
 longitude DECIMAL(11, 8),
 description VARCHAR(200),
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  organization_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);



select * from users;
select * from organizations;
truncate table requests;


DELIMITER //

CREATE TRIGGER update_user_rating_after_request_change
AFTER UPDATE ON requests
FOR EACH ROW
BEGIN
  IF NEW.status != OLD.status THEN
    UPDATE users u
    JOIN (
      SELECT user_id,
             COUNT(CASE WHEN status = 'accepted' THEN 1 END) AS accepted_requests,
             COUNT(*) AS total_requests
      FROM requests
      GROUP BY user_id
    ) 
    ON u.id = r.user_id
    SET u.rating = (r.accepted_requests / r.total_requests) * 5
    WHERE u.id = NEW.user_id;
  END IF;
END//

DELIMITER ;

